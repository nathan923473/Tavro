"use server";

import {
  AccountDeletionError,
  deleteUserAccount,
} from "@/lib/account-deletion/delete-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function userUsesEmailPassword(user: {
  app_metadata?: Record<string, unknown>;
  identities?: { provider: string }[];
}): boolean {
  const providers = user.identities?.map((i) => i.provider) ?? [];
  if (providers.includes("email")) return true;
  const meta = user.app_metadata?.providers;
  return Array.isArray(meta) && meta.includes("email");
}

export async function deleteAccountAction(input: {
  password: string;
  confirmation: string;
}) {
  const confirmation = input.confirmation.trim();
  if (confirmation !== "DELETE") {
    throw new Error('Type DELETE in the confirmation box to continue.');
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Log in to delete your account.");
  }

  const password = input.password;
  if (userUsesEmailPassword(user)) {
    if (!password || password.length < 8) {
      throw new Error("Enter your current password to confirm deletion.");
    }
    if (!user.email) {
      throw new Error("This account has no email on file. Contact support.");
    }
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password,
    });
    if (reauthError) {
      throw new Error("Incorrect password. Account was not deleted.");
    }
  }

  const admin = createAdminClient();
  if (!admin) {
    throw new Error(
      "Account deletion is not configured on this server (missing service role key).",
    );
  }

  try {
    await deleteUserAccount(admin, user.id);
  } catch (e) {
    if (e instanceof AccountDeletionError) {
      throw new Error(
        `We could not finish deleting your account (${e.step}). Try again or contact support.`,
      );
    }
    throw e;
  }

  await supabase.auth.signOut();
  return { ok: true as const };
}

export async function submitOffAppDeletionRequestAction(input: {
  email: string;
  note?: string;
}) {
  const email = input.email.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    throw new Error("Enter a valid email address.");
  }

  const admin = createAdminClient();
  if (!admin) {
    throw new Error("Request submission is unavailable. Email support from the Privacy page.");
  }

  const { error } = await admin.from("account_deletion_requests").insert({
    email,
    note: input.note?.trim().slice(0, 2000) ?? null,
  });

  if (error) {
    if (/account_deletion_requests|schema cache/i.test(error.message)) {
      throw new Error(
        "Run supabase/migrations/024_account_deletion.sql in Supabase, then try again.",
      );
    }
    throw new Error(error.message);
  }

  return { ok: true as const };
}
