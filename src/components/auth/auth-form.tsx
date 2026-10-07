"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { loginMember, signUpMember } from "@/app/(auth)/actions";
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
  const next = searchParams.get("next") ?? "/";
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
        const result = await loginMember({
          email: normalizedEmail,
          password: normalizedPassword,
        });
        if (!result.ok) throw new Error(result.message);
        router.push(next);
        router.refresh();
      }
    } catch (e) {
      const raw = e instanceof Error ? e.message : "Something went wrong";
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
          "Wrong email or password for this Supabase project — or this account was never created. Try Sign up with the same email and a new password (dev mode updates the password), or in Supabase → Authentication → Users reset the password for your email.",
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
      <h1 className="text-xl font-semibold">
        {mode === "signup" ? "Create your account" : "Welcome back"}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {mode === "signup"
          ? "Everyone starts as a member — creators apply separately."
          : "Log in to Streakly"}
      </p>
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        {mode === "signup" ? (
          <Field label="Display name">
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-xl border border-border px-3 py-2.5 text-sm"
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
            className="w-full rounded-xl border border-border px-3 py-2.5 text-sm"
            autoComplete="email"
          />
        </Field>
        <Field label="Password">
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-border px-3 py-2.5 text-sm"
            autoComplete={
              mode === "signup" ? "new-password" : "current-password"
            }
          />
        </Field>
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
