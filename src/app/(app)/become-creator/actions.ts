"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function submitCreatorApplication(formData: FormData): Promise<void> {
  const displayName = String(formData.get("display_name") ?? "").trim();
  const pitch = String(formData.get("pitch") ?? "").trim();
  const socialLink = String(formData.get("social_link") ?? "").trim();

  if (!displayName || !pitch || !socialLink) {
    throw new Error("Name, pitch, and primary social link are required.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in.");
  }

  const { data: appId, error } = await supabase.rpc("submit_creator_application", {
    p_display_name: displayName,
    p_pitch: pitch,
    p_social_link: socialLink,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!appId) {
    throw new Error("Could not create application.");
  }

  revalidatePath("/become-creator");
  revalidatePath("/profile");
  redirect(`/become-creator?submitted=1&app=${appId}`);
}

/** Applicant confirms they sent the Instagram DM — does not verify ownership. */
export async function confirmDmSent(applicationId: string): Promise<{
  ok: boolean;
  message: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "Log in first." };
  }

  const { data: app, error: loadError } = await supabase
    .from("creator_applications")
    .select("id, verification_code_expires_at, verification_state")
    .eq("id", applicationId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (loadError || !app) {
    return { ok: false, message: "Application not found." };
  }

  if (app.verification_state === "verified") {
    return {
      ok: true,
      message: "Ownership already verified. Waiting for admin approval.",
    };
  }

  if (
    app.verification_code_expires_at &&
    new Date(app.verification_code_expires_at) < new Date()
  ) {
    return {
      ok: false,
      message: "Verification code expired. Contact support or reapply when enabled.",
    };
  }

  const { error } = await supabase.rpc("request_dm_verification", {
    app_id: applicationId,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/become-creator");
  revalidatePath("/admin/creator-applications");
  return {
    ok: true,
    message:
      "Thanks — we recorded that you sent the DM. An admin will confirm ownership after checking Instagram. This does not approve you as a creator yet.",
  };
}
