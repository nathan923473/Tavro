"use client";

import { userFacingErrorMessage } from "@/lib/errors/user-message";

import { BrandWordmark } from "@/components/brand/brand-wordmark";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PasswordInput } from "@/components/ui/password-input";
import { APP_NAME } from "@/lib/branding";
import { safeInternalPath } from "@/lib/site-url";
import { signUpMember } from "@/app/(auth)/actions";
import { getOrCreateTabId, syncTabHintCookie } from "@/lib/auth/tab-id.client";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

type AuthMode = "login" | "signup";

async function syncProfileAfterAuth(displayName?: string) {
  await fetch("/auth/ensure-profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ displayName }),
  });
}

function AuthFormInner({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeInternalPath(searchParams.get("next"));
  const creatorInvite = next.startsWith("/invite/creator/");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const tabId = getOrCreateTabId();
      syncTabHintCookie(tabId);
      const supabase = createClient();
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedPassword = password;

      if (mode === "signup") {
        const serverResult = await signUpMember({
          email: normalizedEmail,
          password: normalizedPassword,
          displayName: displayName || normalizedEmail.split("@")[0],
        });

        if (serverResult.ok) {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password: normalizedPassword,
          });
          if (signInError) throw signInError;
          await syncProfileAfterAuth(displayName || email.split("@")[0]);
          router.push(next);
          router.refresh();
          return;
        }

        if (!serverResult.useClientSignup) {
          throw new Error(serverResult.message);
        }

        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password: normalizedPassword,
          options: {
            data: { display_name: displayName || email.split("@")[0] },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
          },
        });
        if (error) throw error;
        if (data.session) {
          await syncProfileAfterAuth(displayName || email.split("@")[0]);
          router.push(next);
          router.refresh();
          return;
        }
        setMessage(
          "Account created. Check your email to confirm, then log in — or turn off Confirm email in Supabase for instant access.",
        );
        return;
      } else {
        // Client sign-in sets cookies reliably on mobile Safari / PWA (server actions can miss cookies).
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password: normalizedPassword,
        });
        if (signInError) throw signInError;
        await syncProfileAfterAuth();
        router.push(next);
        router.refresh();
      }
    } catch (e) {
      const raw = userFacingErrorMessage(e, "Something went wrong");
      if (raw.includes("Database error saving new user")) {
        setMessage(
          "Sign-up failed in Supabase (profile trigger). In Supabase → SQL Editor, run migration 003_fix_signup_profile_trigger.sql from this repo, then try again.",
        );
      } else if (
        raw.toLowerCase().includes("rate limit") ||
        raw.includes("over_email_send_rate_limit")
      ) {
        setMessage(
          "Supabase is blocking sign-ups because too many confirmation emails were sent. Fix: Supabase → Authentication → Providers → Email → turn OFF “Confirm email”, wait ~1 hour, or add your user manually under Authentication → Users (see docs/supabase-auth-setup.md).",
        );
      } else if (
        raw.toLowerCase().includes("invalid login credentials") ||
        raw.toLowerCase().includes("invalid_credentials")
      ) {
        setMessage(
          "Wrong email or password — or this account was not created yet. Try Forgot password? below, Sign up with the same email, or reset the password in Supabase → Authentication → Users.",
        );
      } else {
        setMessage(raw);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mx-auto max-w-md">
      <BrandWordmark size="md" className="mb-4 justify-center" />
      <h1 className="text-xl font-bold">
        {mode === "signup" ? "Create your account" : "Welcome back"}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {mode === "signup"
          ? creatorInvite
            ? "Create the account for the email on your creator invite. You'll accept it on the next screen."
            : "Everyone starts as a member — creators apply separately."
          : creatorInvite
            ? "Log in with the email this creator invite was issued for."
            : `Log in to ${APP_NAME}`}
      </p>
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        {mode === "signup" ? (
          <Field label="Display name">
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-2xl border border-border bg-surface px-3 py-3 text-sm outline-none ring-primary focus:ring-2"
              autoComplete="name"
            />
          </Field>
        ) : null}
        <Field label="Email">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-2xl border border-border bg-surface px-3 py-3 text-sm outline-none ring-primary focus:ring-2"
            autoComplete="email"
          />
        </Field>
        <Field label="Password">
          <PasswordInput
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={
              mode === "signup" ? "new-password" : "current-password"
            }
          />
        </Field>
        {mode === "login" ? (
          <p className="-mt-1 text-right text-sm">
            <Link
              href={
                next !== "/"
                  ? `/forgot-password?next=${encodeURIComponent(next)}`
                  : "/forgot-password"
              }
              className="font-medium text-primary"
            >
              Forgot password?
            </Link>
          </p>
        ) : null}
        {message ? (
          <p className="text-sm text-red-600" role="alert">
            {message}
          </p>
        ) : null}
        <Button type="submit" fullWidth disabled={loading}>
          {loading
            ? "Please wait…"
            : mode === "signup"
              ? "Sign up as member"
              : "Log in"}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        {mode === "signup" ? (
          <>
            Already have an account?{" "}
            <Link
              href={next !== "/" ? `/login?next=${encodeURIComponent(next)}` : "/login"}
              className="font-medium text-primary"
            >
              Log in
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link
              href={next !== "/" ? `/signup?next=${encodeURIComponent(next)}` : "/signup"}
              className="font-medium text-primary"
            >
              Sign up
            </Link>
          </>
        )}
      </p>
    </Card>
  );
}

export function AuthForm({ mode }: { mode: AuthMode }) {
  return (
    <Suspense fallback={<Card className="p-4 text-sm">Loading…</Card>}>
      <AuthFormInner mode={mode} />
    </Suspense>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
