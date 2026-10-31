"use server";

import { readCreatorApplicationAttribution } from "@/lib/creator/growth-actions";
import { validateOrganicApplication } from "@/lib/creator/onboarding-rules";
import { bioContainsVerificationCode } from "@/lib/creator/verification";
import { assertVerifiedAccount } from "@/lib/auth/require-user-id";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { userFacingErrorMessage } from "@/lib/errors/user-message";
import { redirect } from "next/navigation";

export async function submitCreatorApplication(formData: FormData): Promise<void> {
  const displayName = String(formData.get("display_name") ?? "").trim();
  const pitch = String(formData.get("motivation") ?? formData.get("pitch") ?? "").trim();
  const socialLink = String(formData.get("social_link") ?? "").trim();
  const coachingFocus = String(formData.get("coaching_focus") ?? "").trim();

  const invalid = validateOrganicApplication({
    displayName,
    socialLink,
    coachingFocus,
    motivation: pitch,
  });
  if (invalid) throw new Error(invalid);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in.");
  }
  await assertVerifiedAccount();

  const attribution = await readCreatorApplicationAttribution();
  const rpcArgs = {
    p_display_name: displayName,
    p_pitch: pitch,
    p_social_link: socialLink,
    p_referred_by_user_id: attribution?.referredByUserId ?? null,
    p_application_source: attribution?.source ?? "unknown",
    p_coaching_focus: coachingFocus,
  };

  let { data: appId, error } = await supabase.rpc("submit_creator_application", rpcArgs);

  if (error && /p_coaching_focus|schema cache|could not find the function/i.test(error.message)) {
    ({ data: appId, error } = await supabase.rpc("submit_creator_application", {
      p_display_name: displayName,
      p_pitch: `Coaching focus: ${coachingFocus}\n\n${pitch}`,
      p_social_link: socialLink,
      p_referred_by_user_id: attribution?.referredByUserId ?? null,
      p_application_source: attribution?.source ?? "unknown",
    }));
  }

  if (error && /p_referred_by|p_application_source|schema cache|could not find the function/i.test(error.message)) {
    ({ data: appId, error } = await supabase.rpc("submit_creator_application", {
      p_display_name: displayName,
      p_pitch: `Coaching focus: ${coachingFocus}\n\n${pitch}`,
      p_social_link: socialLink,
    }));
  }

  if (error) {
    throw new Error(
      userFacingErrorMessage(new Error(error.message), "Could not submit your application. Please try again."),
    );
  }

  if (!appId) {
    throw new Error("Could not create application.");
  }

  const { recordPlatformEvent } = await import("@/lib/analytics/record-event");
  await recordPlatformEvent({
    eventType: "creator_application_submitted",
    userId: user.id,
    idempotencyKey: `creator_application_submitted:${appId}`,
  });

  revalidatePath("/become-creator");
  revalidatePath("/profile");
  redirect(`/become-creator?submitted=1&app=${appId}`);
}

export async function refreshCreatorVerificationCode(applicationId: string): Promise<{
  ok: boolean;
  message: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Log in to refresh your verification code." };
  try {
    await assertVerifiedAccount();
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Confirm your email before continuing.",
    };
  }

  const { error } = await supabase.rpc("refresh_creator_verification_code", {
    app_id: applicationId,
  });
  if (error) {
    if (/schema cache|could not find the function/i.test(error.message)) {
      return {
        ok: false,
        message: "Requesting a new code needs database migration 051. Ask an admin to run it.",
      };
    }
    return {
      ok: false,
      message: userFacingErrorMessage(
        new Error(error.message),
        "Could not create a new verification code.",
      ),
    };
  }

  revalidatePath("/become-creator");
  return { ok: true, message: "New verification code ready. Add it to your public bio, then check again." };
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
  try {
    await assertVerifiedAccount();
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Confirm your email before continuing.",
    };
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
    return {
      ok: false,
      message: userFacingErrorMessage(error, "Could not complete verification. Please try again."),
    };
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
  try {
    await assertVerifiedAccount();
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Confirm your email before continuing.",
    };
  }

  const { error } = await supabase.rpc("request_dm_verification", {
    app_id: applicationId,
  });

  if (error) {
    return {
      ok: false,
      message: userFacingErrorMessage(error, "Could not complete verification. Please try again."),
    };
  }

  revalidatePath("/become-creator");
  return {
    ok: true,
    message: "DM verification requested. An admin will confirm after you message us.",
  };
}
