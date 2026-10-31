"use server";

import { authEmailRedirect } from "@/lib/auth/email-redirect";
import {
  classifySignUp,
  normalizeAuthEmail,
  passwordIssue,
  shouldDeleteAutoconfirmedUser,
  signupBlockedWithoutRateLimit,
} from "@/lib/auth/email-verification";
import { clientIpFromHeaders, consumeAuthRateLimits } from "@/lib/auth/rate-limit";
import { verifyTurnstileToken } from "@/lib/auth/turnstile";
import { ensureUserProfile } from "@/lib/auth/ensure-profile";
import { safeInternalPath } from "@/lib/site-url";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { userFacingErrorMessage } from "@/lib/errors/user-message";
import { headers } from "next/headers";

const ALREADY_REGISTERED =
  "That email already has an account. Try Log in instead.";
const CONFIRM_EMAIL_DISABLED =
  "Sign-up is paused because Supabase is marking emails as verified without a confirmation link. Turn Confirm email on, then try again.";
const RATE_LIMITED = "Too many attempts. Wait a while and try again.";
const CHECK_EMAIL =
  "If that address can receive mail, we sent a link. Check your inbox and spam folder.";

export type SignUpResult =
  | { ok: true; needsEmailConfirmation: true }
  | { ok: false; message: string };

export type AuthFailure = {
  ok: false;
  message: string;
  code?: "email_not_confirmed" | "rate_limited";
};

function isAlreadyRegisteredError(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("already") &&
    (normalized.includes("registered") || normalized.includes("exists"))
  );
}

function isEmailNotConfirmed(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("email not confirmed") ||
    normalized.includes("email_not_confirmed")
  );
}

async function requestIp(): Promise<string> {
  return clientIpFromHeaders(await headers());
}

async function guardEmailSend(
  bucket: "resend:email" | "reverify:email" | "reset:email",
  email: string,
): Promise<AuthFailure | null> {
  const limit = await consumeAuthRateLimits([{ bucket, subject: email }]);
  if (limit === "limited") {
    return {
      ok: false,
      code: "rate_limited",
      message: "Too many emails were sent to that address. Wait about an hour and try again.",
    };
  }
  if (limit === "unavailable" && signupBlockedWithoutRateLimit(process.env.NODE_ENV)) {
    return {
      ok: false,
      message: "Email is temporarily unavailable. Try again shortly.",
    };
  }
  return null;
}

/** Creates an unconfirmed user and sends Supabase's confirmation email. */
export async function signUpMember(input: {
  email: string;
  password: string;
  displayName?: string;
  next?: string;
  turnstileToken?: string;
}): Promise<SignUpResult> {
  const email = normalizeAuthEmail(input.email);
  const password = input.password ?? "";
  const passwordError = passwordIssue(password);
  if (!email || passwordError) {
    return {
      ok: false,
      message: passwordError ?? "Enter a valid email address.",
    };
  }

  const ip = await requestIp();
  const captcha = await verifyTurnstileToken(input.turnstileToken, ip);
  if (!captcha.ok) return { ok: false, message: captcha.message };

  const signupLimit = await consumeAuthRateLimits([{ bucket: "signup:ip", subject: ip }]);
  if (signupLimit === "limited") {
    return {
      ok: false,
      message: "Too many sign-ups from this network. Wait about an hour and try again.",
    };
  }
  if (signupLimit === "unavailable" && signupBlockedWithoutRateLimit(process.env.NODE_ENV)) {
    return {
      ok: false,
      message: "Sign-up is temporarily unavailable. Try again shortly.",
    };
  }

  const displayName = (input.displayName?.trim() || email.split("@")[0] || "Member").slice(0, 80);
  const emailRedirectTo = await authEmailRedirect(safeInternalPath(input.next));
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
      emailRedirectTo,
      captchaToken: input.turnstileToken?.trim() || undefined,
    },
  });

  if (error) {
    if (isAlreadyRegisteredError(error.message)) {
      return { ok: false, message: ALREADY_REGISTERED };
    }
    if (error.message.includes("Database error saving new user")) {
      return {
        ok: false,
        message:
          "Supabase database setup incomplete. In Supabase SQL Editor, run supabase/migrations/003_fix_signup_profile_trigger.sql (and 001 if needed), then try again.",
      };
    }
    if (
      error.message.toLowerCase().includes("rate limit") ||
      error.message.includes("over_email_send_rate_limit")
    ) {
      return {
        ok: false,
        message: "Too many confirmation emails were sent. Wait about an hour and try again.",
      };
    }
    return {
      ok: false,
      message: userFacingErrorMessage(error, "Could not create the account."),
    };
  }

  const identityCount = data.user?.identities?.length ?? null;
  const disposition = classifySignUp({
    hasSession: Boolean(data.session),
    emailConfirmedAt: data.user?.email_confirmed_at ?? null,
    identityCount,
  });

  if (disposition === "already_registered") {
    return { ok: false, message: ALREADY_REGISTERED };
  }

  if (disposition === "reject_autoconfirm") {
    const admin = createAdminClient();
    if (
      admin &&
      data.user &&
      shouldDeleteAutoconfirmedUser(data.user.created_at, Date.now())
    ) {
      await admin.auth.admin.deleteUser(data.user.id);
    }
    await supabase.auth.signOut();
    return { ok: false, message: CONFIRM_EMAIL_DISABLED };
  }

  return { ok: true, needsEmailConfirmation: true };
}

export async function resendSignupConfirmation(input: {
  email: string;
  next?: string;
}): Promise<{ ok: true; message: string } | AuthFailure> {
  const email = normalizeAuthEmail(input.email);
  if (!email) return { ok: false, message: "Enter a valid email address." };

  const blocked = await guardEmailSend("resend:email", email);
  if (blocked) return blocked;

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: await authEmailRedirect(safeInternalPath(input.next)) },
  });

  if (
    error &&
    !isAlreadyRegisteredError(error.message) &&
    !/not found|already confirmed/i.test(error.message)
  ) {
    if (
      error.message.toLowerCase().includes("rate limit") ||
      error.message.includes("over_email_send_rate_limit")
    ) {
      return {
        ok: false,
        code: "rate_limited",
        message: "Too many confirmation emails were sent. Wait about an hour and try again.",
      };
    }
    return { ok: false, message: userFacingErrorMessage(error, "Could not send the email.") };
  }

  return { ok: true, message: CHECK_EMAIL };
}

export async function sendOwnershipVerificationEmail(input?: {
  next?: string;
}): Promise<{ ok: true; message: string } | AuthFailure> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return { ok: false, message: "Log in again, then request a new verification link." };
  }

  const email = normalizeAuthEmail(user.email);
  if (!email) return { ok: false, message: "This account has no email address to verify." };

  const blocked = await guardEmailSend("reverify:email", email);
  if (blocked) return blocked;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: await authEmailRedirect(safeInternalPath(input?.next)),
    },
  });

  if (error) {
    if (
      error.message.toLowerCase().includes("rate limit") ||
      error.message.includes("over_email_send_rate_limit")
    ) {
      return {
        ok: false,
        code: "rate_limited",
        message: "Too many verification emails were sent. Wait about an hour and try again.",
      };
    }
    return { ok: false, message: userFacingErrorMessage(error, "Could not send the email.") };
  }

  return {
    ok: true,
    message: `We sent a verification link to ${email}. Open it on this device. Your progress stays on this account.`,
  };
}

export async function requestPasswordReset(input: {
  email: string;
}): Promise<{ ok: true; message: string } | AuthFailure> {
  const email = normalizeAuthEmail(input.email);
  if (!email) return { ok: false, message: "Enter a valid email address." };

  const blocked = await guardEmailSend("reset:email", email);
  if (blocked) return blocked;

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: await authEmailRedirect("/reset-password"),
  });

  if (error) {
    if (
      error.message.toLowerCase().includes("rate limit") ||
      error.message.includes("over_email_send_rate_limit")
    ) {
      return {
        ok: false,
        code: "rate_limited",
        message: "Too many reset emails were sent. Wait about an hour and try again.",
      };
    }
    if (!/not found|user/i.test(error.message)) {
      return { ok: false, message: userFacingErrorMessage(error, "Could not send the reset email.") };
    }
  }

  return { ok: true, message: CHECK_EMAIL };
}

/** Server-side log in so auth cookies and rate limits are applied together. */
export async function loginMember(input: {
  email: string;
  password: string;
  tabId?: string | null;
}): Promise<{ ok: true } | AuthFailure> {
  const email = normalizeAuthEmail(input.email);
  const password = input.password ?? "";
  if (!email || !password || password.length > 256) {
    return { ok: false, message: "Enter your email and password." };
  }

  const ip = await requestIp();
  const limit = await consumeAuthRateLimits([
    { bucket: "login:ip", subject: ip },
    { bucket: "login:email", subject: email },
  ]);
  if (limit === "limited") {
    return { ok: false, code: "rate_limited", message: RATE_LIMITED };
  }

  const supabase = await createClient(input.tabId);
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (isEmailNotConfirmed(error.message)) {
      return {
        ok: false,
        code: "email_not_confirmed",
        message: "Confirm your email before logging in. Check your inbox for the verification link.",
      };
    }
    return {
      ok: false,
      message: userFacingErrorMessage(error, "Could not log in. Check your email and password."),
    };
  }

  await ensureUserProfile();
  return { ok: true };
}
