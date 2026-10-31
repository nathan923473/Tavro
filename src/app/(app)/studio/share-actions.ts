"use server";

import { requireApprovedCreator } from "@/lib/auth/profile";
import { userFacingErrorMessage } from "@/lib/errors/user-message";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function recordCreatorChallengeShareAction(challengeId: string): Promise<{
  ok: boolean;
  message?: string;
}> {
  const { user } = await requireApprovedCreator();
  const supabase = await createClient();
  const { error } = await supabase.rpc("record_creator_challenge_share", {
    p_challenge_id: challengeId,
  });
  if (error) {
    if (/schema cache|could not find the function/i.test(error.message)) {
      return { ok: false, message: "Sharing stats need database migration 051." };
    }
    return {
      ok: false,
      message: userFacingErrorMessage(new Error(error.message), "Could not record that share."),
    };
  }

  const { recordPlatformEvent } = await import("@/lib/analytics/record-event");
  await recordPlatformEvent({
    eventType: "challenge_shared",
    userId: user.id,
    creatorId: user.id,
    challengeId,
    idempotencyKey: `challenge_shared:${user.id}:${challengeId}`,
  });
  revalidatePath("/studio");
  revalidatePath("/studio/onboarding");
  return { ok: true };
}
