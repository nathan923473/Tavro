import {
  ANALYTICS_ATTR_COOKIE,
  ANALYTICS_VISITOR_COOKIE,
  type SignupAcquisitionSource,
} from "@/lib/analytics/constants";
import { recordPlatformEvent } from "@/lib/analytics/record-event";
import { createAdminClient } from "@/lib/supabase/admin";
import { cookies } from "next/headers";

export type AttributionCookiePayload = {
  creatorId?: string;
  challengeId?: string;
  referralCode?: string;
  source?: SignupAcquisitionSource;
  landingPath?: string;
  utm?: Record<string, string>;
  ts?: number;
};

export async function getVisitorKey(): Promise<string | null> {
  return (await cookies()).get(ANALYTICS_VISITOR_COOKIE)?.value ?? null;
}

export async function readAttributionCookie(): Promise<AttributionCookiePayload | null> {
  const raw = (await cookies()).get(ANALYTICS_ATTR_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(decodeURIComponent(raw)) as AttributionCookiePayload;
  } catch {
    return null;
  }
}

export async function writeAttributionCookie(payload: AttributionCookiePayload) {
  const jar = await cookies();
  jar.set(ANALYTICS_ATTR_COOKIE, encodeURIComponent(JSON.stringify(payload)), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}

export async function mergeAttributionCookie(partial: AttributionCookiePayload) {
  const prev = (await readAttributionCookie()) ?? {};
  await writeAttributionCookie({ ...prev, ...partial, ts: Date.now() });
}

function sourceFromUtm(utm: Record<string, string> | undefined): SignupAcquisitionSource {
  if (!utm) return "unknown";
  const medium = (utm.utm_medium ?? "").toLowerCase();
  const source = (utm.utm_source ?? "").toLowerCase();
  if (medium.includes("cpc") || medium.includes("paid") || source.includes("ads")) return "paid";
  if (source.includes("google") || source.includes("bing")) return "organic_search";
  return "unknown";
}

/** First-touch only — skips if attribution already recorded. */
export async function applySignupAttribution(userId: string): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;

  const { data: profile } = await admin
    .from("profiles")
    .select(
      "id, created_at, attribution_recorded_at, referral_code, is_admin, is_test_account",
    )
    .eq("id", userId)
    .maybeSingle();

  if (!profile || profile.attribution_recorded_at) return;
  if (profile.is_admin || profile.is_test_account) return;

  const attr = await readAttributionCookie();
  let signupSource: SignupAcquisitionSource = "direct";
  let referrerUserId: string | null = null;
  let attributedCreatorId: string | null = attr?.creatorId ?? null;
  let attributedChallengeId: string | null = attr?.challengeId ?? null;

  if (attr?.referralCode) {
    const { data: referrer } = await admin
      .from("profiles")
      .select("id")
      .eq("referral_code", attr.referralCode)
      .maybeSingle();
    if (referrer?.id && referrer.id !== userId) {
      referrerUserId = referrer.id;
      signupSource = "participant_referral";
    }
  } else if (attr?.creatorId || attr?.challengeId) {
    signupSource = "creator_link";
    if (attr.challengeId && !attributedCreatorId) {
      const { data: ch } = await admin
        .from("challenges")
        .select("created_by")
        .eq("id", attr.challengeId)
        .maybeSingle();
      attributedCreatorId = ch?.created_by ?? null;
    }
  } else if (attr?.source) {
    signupSource = attr.source;
  } else if (attr?.utm) {
    signupSource = sourceFromUtm(attr.utm);
  } else {
    signupSource = "unknown";
  }

  const metadata = {
    landingPath: attr?.landingPath ?? null,
    utm: attr?.utm ?? null,
  };

  const { error } = await admin
    .from("profiles")
    .update({
      signup_acquisition_source: signupSource,
      referrer_user_id: referrerUserId,
      attributed_creator_id: attributedCreatorId,
      attributed_challenge_id: attributedChallengeId,
      attribution_recorded_at: new Date().toISOString(),
      attribution_metadata: metadata,
    })
    .eq("id", userId)
    .is("attribution_recorded_at", null);

  if (error && !/attribution_recorded_at|signup_acquisition/i.test(error.message)) {
    console.warn("[analytics] applySignupAttribution", error.message);
    return;
  }

  await recordPlatformEvent({
    eventType: "user_signed_up",
    userId,
    creatorId: attributedCreatorId,
    challengeId: attributedChallengeId,
    idempotencyKey: `user_signed_up:${userId}`,
    properties: { signupSource, referrerUserId },
  });

  if (referrerUserId) {
    await recordPlatformEvent({
      eventType: "referral_link_opened",
      userId: referrerUserId,
      idempotencyKey: `referral_success:${referrerUserId}:${userId}`,
      properties: { referredUserId: userId },
    });
  }
}

export async function recordChallengeLandingView(input: {
  challengeId: string;
  creatorId: string;
  communityId?: string | null;
  landingPath: string;
}) {
  const visitorKey = (await getVisitorKey()) ?? "anonymous";
  await mergeAttributionCookie({
    challengeId: input.challengeId,
    creatorId: input.creatorId,
    landingPath: input.landingPath,
    source: "creator_link",
  });

  const dayKey = new Date().toISOString().slice(0, 10);
  await recordPlatformEvent({
    eventType: "challenge_page_viewed",
    challengeId: input.challengeId,
    creatorId: input.creatorId,
    communityId: input.communityId ?? null,
    sessionKey: visitorKey,
    idempotencyKey: `challenge_page_viewed:${input.challengeId}:${visitorKey}:${dayKey}`,
    properties: { landingPath: input.landingPath },
  });
}
