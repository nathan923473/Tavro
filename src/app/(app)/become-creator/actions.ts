"use server";

import { bioContainsVerificationCode } from "@/lib/creator/verification";
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

export async function verifyBioForApplication(applicationId: string): Promise<{
  ok: boolean;
  message: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "Log in to verify." };
  }

  const { data: app, error: loadError } = await supabase
    .from("creator_applications")
    .select("*")
    .eq("id", applicationId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (loadError || !app) {
    return { ok: false, message: "Application not found." };
  }

  if (!app.verification_code || !app.social_link) {
    return { ok: false, message: "Missing verification data." };
  }

  if (
    app.verification_code_expires_at &&
    new Date(app.verification_code_expires_at) < new Date()
  ) {
    return { ok: false, message: "Verification code expired. Submit a new application." };
  }

  const check = await bioContainsVerificationCode(
    app.social_link,
    app.verification_code,
  );

  if (!check.found) {
    return {
      ok: false,
      message:
        check.error ??
        "Code not found in your public bio yet. Add the code, save, then try again.",
    };
  }

  const { error } = await supabase.rpc("mark_verification_verified", {
    app_id: applicationId,
    method: "bio",
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/become-creator");
  revalidatePath("/admin/creator-applications");
  return {
    ok: true,
    message: "Social account verified. Your application is awaiting admin review.",
  };
}

export async function requestDmVerification(applicationId: string): Promise<{
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

  const { error } = await supabase.rpc("request_dm_verification", {
    app_id: applicationId,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/become-creator");
  return {
    ok: true,
    message: "DM verification requested. An admin will confirm after you message us.",
  };
}
