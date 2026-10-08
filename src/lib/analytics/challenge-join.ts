import { readAttributionCookie } from "@/lib/analytics/attribution";
import { recordPlatformEvent } from "@/lib/analytics/record-event";
import { createAdminClient } from "@/lib/supabase/admin";

export type ChallengeJoinAnalyticsFields = {
  join_source: "challenge_landing" | "creator_page" | "in_app" | "unknown";
  referrer_user_id: string | null;
  is_new_platform_user_at_join: boolean;
  joined_challenge_id: string;
};

export async function buildChallengeJoinAnalyticsFields(
  userId: string,
  challengeId: string,
  joinSourceHint?: ChallengeJoinAnalyticsFields["join_source"],
): Promise<ChallengeJoinAnalyticsFields> {
  const admin = createAdminClient();
  const attr = await readAttributionCookie();
  let joinSource = joinSourceHint ?? "unknown";
  if (attr?.challengeId === challengeId) {
    joinSource = joinSourceHint ?? "challenge_landing";
  } else if (attr?.landingPath?.includes("/creator/")) {
    joinSource = joinSourceHint ?? "creator_page";
  }

  let isNew = true;
  if (admin) {
    const { count } = await admin
      .from("challenge_participants")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);
    isNew = (count ?? 0) === 0;
  }

  let referrerUserId: string | null = null;
  if (attr?.referralCode && admin) {
    const { data: ref } = await admin
      .from("profiles")
      .select("id")
      .eq("referral_code", attr.referralCode)
      .maybeSingle();
    referrerUserId = ref?.id ?? null;
  }

  return {
    join_source: joinSource,
    referrer_user_id: referrerUserId,
    is_new_platform_user_at_join: isNew,
    joined_challenge_id: challengeId,
  };
}

export async function recordChallengeJoinedEvent(input: {
  userId: string;
  challengeId: string;
  creatorId: string;
  isNewPlatformUser: boolean;
}) {
  await recordPlatformEvent({
    eventType: "challenge_joined",
    userId: input.userId,
    challengeId: input.challengeId,
    creatorId: input.creatorId,
    idempotencyKey: `challenge_joined:${input.challengeId}:${input.userId}`,
    properties: { isNewPlatformUser: input.isNewPlatformUser },
  });
}
