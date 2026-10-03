"use server";

import { createAdminClient, isAdminSignupEnabled } from "@/lib/supabase/admin";
import { randomBytes } from "node:crypto";

export type SignUpResult =
  | { ok: true }
  | { ok: false; message: string; useClientSignup?: boolean };

export async function getSignupMode(): Promise<{
  serverSignup: boolean;
}> {
  return { serverSignup: isAdminSignupEnabled() };
}

/** Creates a confirmed user without sending email (dev-friendly). */
export async function signUpMember(input: {
  email: string;
  password: string;
  displayName?: string;
}): Promise<SignUpResult> {
  const email = input.email.trim().toLowerCase();
  const password = input.password;
  const displayName =
    input.displayName?.trim() || email.split("@")[0] || "Member";

  if (!email || password.length < 8) {
    return { ok: false, message: "Use a valid email and password (8+ characters)." };
  }

  const admin = createAdminClient();
  if (!admin) {
    return {
      ok: false,
      useClientSignup: true,
      message: "Using standard sign-up.",
    };
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName },
  });

  if (error) {
    const msg = error.message;
    if (
      msg.toLowerCase().includes("already") ||
      msg.toLowerCase().includes("registered")
    ) {
      return {
        ok: false,
        message: "That email already has an account. Try Log in instead.",
      };
    }
    if (msg.includes("Database error saving new user")) {
      return {
        ok: false,
        message:
          "Supabase database setup incomplete. In Supabase SQL Editor, run supabase/migrations/003_fix_signup_profile_trigger.sql (and 001 if needed), then try again.",
      };
    }
    return { ok: false, message: msg };
  }

  const userId = data.user?.id;
  if (userId) {
    await admin.from("profiles").upsert(
      {
        id: userId,
        display_name: displayName,
        referral_code: randomBytes(6).toString("hex"),
      },
      { onConflict: "id" },
    );
  }

  return { ok: true };
}
