"use server";

import { ensureUserProfile } from "@/lib/auth/ensure-profile";
import { createAdminClient, isAdminSignupEnabled } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";

async function findUserIdByEmail(
  admin: SupabaseClient,
  email: string,
): Promise<string | null> {
  let page = 1;
  const perPage = 200;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const match = data.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    );
    if (match) return match.id;
    if (data.users.length < perPage) break;
    page += 1;
  }
  return null;
}

function isAlreadyRegisteredError(message: string) {
  const m = message.toLowerCase();
  return m.includes("already") && (m.includes("registered") || m.includes("exists"));
}

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
    if (isAlreadyRegisteredError(msg) && process.env.NODE_ENV !== "production") {
      const userId = await findUserIdByEmail(admin, email);
      if (userId) {
        const { error: updateError } = await admin.auth.admin.updateUserById(
          userId,
          { password, email_confirm: true },
        );
        if (!updateError) {
          await admin.from("profiles").upsert(
            {
              id: userId,
              display_name: displayName,
              referral_code: randomBytes(6).toString("hex"),
            },
            { onConflict: "id" },
          );
          return { ok: true };
        }
      }
      return {
        ok: false,
        message:
          "That email already has an account. Use Log in with the same password, or Sign up again here to reset your dev password.",
      };
    }
    if (isAlreadyRegisteredError(msg)) {
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

/** Server-side log in so auth cookies are set reliably in Next.js. */
export async function loginMember(input: {
  email: string;
  password: string;
  tabId?: string | null;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (!email || password.length < 8) {
    return { ok: false, message: "Enter your email and password (8+ characters)." };
  }

  const supabase = await createClient(input.tabId);
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { ok: false, message: error.message };
  }

  await ensureUserProfile();
  return { ok: true };
}
