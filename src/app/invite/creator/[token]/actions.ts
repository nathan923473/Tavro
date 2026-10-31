"use server";

import {
  hashCreatorInvitationToken,
  isCreatorInvitationToken,
} from "@/lib/creator/invitation-token";
import { userFacingErrorMessage } from "@/lib/errors/user-message";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function acceptCreatorInvitationAction(token: string): Promise<void> {
  if (!isCreatorInvitationToken(token)) {
    redirect("/invite/creator/invalid");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/invite/creator/${token}`)}`);
  }

  const { error } = await supabase.rpc("accept_creator_invitation", { p_token: token });
  if (error) {
    const message = /schema cache|could not find the function/i.test(error.message)
      ? "Creator invites need database migration 051."
      : userFacingErrorMessage(new Error(error.message), "Could not accept this invitation.");
    redirect(`/invite/creator/${token}?error=${encodeURIComponent(message)}`);
  }

  const { recordPlatformEvent } = await import("@/lib/analytics/record-event");
  await recordPlatformEvent({
    eventType: "creator_invitation_accepted",
    userId: user.id,
    idempotencyKey: `creator_invitation_accepted:${hashCreatorInvitationToken(token)}`,
    properties: { pathway: "invite" },
  });
  await recordPlatformEvent({
    eventType: "creator_approved",
    userId: user.id,
    idempotencyKey: `creator_approved:invite:${user.id}`,
    properties: { pathway: "invite" },
  });

  revalidatePath("/studio");
  revalidatePath("/profile");
  revalidatePath("/become-creator");
  redirect("/studio/onboarding?welcome=invite");
}
