"use server";

import { requireAdmin } from "@/lib/auth/require-admin";
import {
  creatorInvitationExpiry,
  isInviteEmail,
  normalizeInviteEmail,
} from "@/lib/creator/onboarding-rules";
import { userFacingErrorMessage } from "@/lib/errors/user-message";
import { creatorInvitePath, getAppBaseUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createCreatorInvitationAction(formData: FormData): Promise<
  { ok: true; link: string; expiresAt: string } | { ok: false; message: string }
> {
  await requireAdmin("/admin/creator-invitations");
  const email = normalizeInviteEmail(String(formData.get("email") ?? ""));
  const dateKey = String(formData.get("expires_on") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();

  if (!isInviteEmail(email)) {
    return { ok: false, message: "Enter the creator email address this invite is for." };
  }

  let expiresAt: Date;
  try {
    expiresAt = creatorInvitationExpiry(dateKey);
  } catch (error) {
    return {
      ok: false,
      message: userFacingErrorMessage(error, "Choose an expiry date in the future."),
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_creator_invitation", {
    p_intended_email: email,
    p_expires_at: expiresAt.toISOString(),
    p_note: note || null,
  });

  if (error) {
    if (/schema cache|could not find the function/i.test(error.message)) {
      return {
        ok: false,
        message: "Creator invites need database migration 051. Run it in the Supabase SQL editor.",
      };
    }
    return {
      ok: false,
      message: userFacingErrorMessage(new Error(error.message), "Could not create that invitation."),
    };
  }

  const row = Array.isArray(data) ? data[0] : data;
  const token = row?.token as string | undefined;
  if (!token) {
    return { ok: false, message: "The invitation was created without a link. Try again." };
  }

  revalidatePath("/admin/creator-invitations");
  return {
    ok: true,
    link: `${getAppBaseUrl()}${creatorInvitePath(token)}`,
    expiresAt: expiresAt.toISOString(),
  };
}

export async function revokeCreatorInvitationAction(invitationId: string) {
  await requireAdmin("/admin/creator-invitations");
  const supabase = await createClient();
  const { error } = await supabase.rpc("revoke_creator_invitation", {
    p_invitation_id: invitationId,
  });
  if (error) {
    throw new Error(userFacingErrorMessage(new Error(error.message), "Could not revoke that invitation."));
  }
  revalidatePath("/admin/creator-invitations");
}
