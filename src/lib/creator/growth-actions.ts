"use server";

import {
  CREATOR_APP_ATTR_COOKIE,
  type CreatorApplicationAttribution,
  type CreatorApplicationSource,
} from "@/lib/creator/growth";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

async function writeCreatorAppAttribution(payload: CreatorApplicationAttribution) {
  const jar = await cookies();
  jar.set(
    CREATOR_APP_ATTR_COOKIE,
    encodeURIComponent(JSON.stringify({ ...payload, ts: Date.now() })),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    },
  );
}

export async function readCreatorApplicationAttribution(): Promise<CreatorApplicationAttribution | null> {
  const raw = (await cookies()).get(CREATOR_APP_ATTR_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(decodeURIComponent(raw)) as CreatorApplicationAttribution;
  } catch {
    return null;
  }
}

/** Called from /creators when ?cref= is present or for landing attribution. */
export async function primeCreatorApplicationAttributionAction(
  creatorReferralCode?: string | null,
) {
  const code = creatorReferralCode?.trim();
  if (!code) {
    await writeCreatorAppAttribution({ source: "creator_landing" });
    return { ok: true as const };
  }

  const supabase = await createClient();
  const { data: referrer } = await supabase
    .from("profiles")
    .select("id, creator_status")
    .eq("referral_code", code)
    .maybeSingle();

  if (referrer?.creator_status === "approved") {
    await writeCreatorAppAttribution({
      referredByUserId: referrer.id,
      source: "creator_referral",
    });
    return { ok: true as const, referred: true as const };
  }

  await writeCreatorAppAttribution({ source: "creator_landing" });
  return { ok: true as const, referred: false as const };
}

export async function clearCreatorApplicationAttributionAction() {
  const jar = await cookies();
  jar.delete(CREATOR_APP_ATTR_COOKIE);
}
