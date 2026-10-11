"use client";

import { BrandWordmark } from "@/components/brand/brand-wordmark";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PasswordInput } from "@/components/ui/password-input";
import { getOrCreateTabId, syncTabHintCookie } from "@/lib/auth/tab-id.client";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionState, setSessionState] = useState<
    "checking" | "ready" | "missing"
  >("checking");

  useEffect(() => {
    let cancelled = false;
    const tabId = getOrCreateTabId();
    syncTabHintCookie(tabId);
    const supabase = createClient();

    void supabase.auth.getUser().then(({ data, error }) => {
      if (cancelled) return;
      setSessionState(!error && data.user ? "ready" : "missing");
    });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const tabId = getOrCreateTabId();
      syncTabHintCookie(tabId);
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      router.push("/");
      router.refresh();
    } catch (e) {
      const raw = e instanceof Error ? e.message : "Something went wrong";
      setMessage(raw);
    } finally {
      setLoading(false);
    }
  }

  if (sessionState === "checking") {
    return <Card className="mx-auto max-w-md p-4 text-sm">Loading…</Card>;
  }

  return (
    <Card className="mx-auto max-w-md">
      <BrandWordmark size="sm" className="mb-4" />
      <h1 className="text-xl font-bold">Choose a new password</h1>
      {sessionState === "missing" ? (
        <>
          <p className="mt-1 text-sm text-muted-foreground" role="alert">
            This reset link is invalid or has expired. Request a new one to
            continue.
          </p>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            <Link href="/forgot-password" className="font-medium text-primary">
              Forgot password?
            </Link>
          </p>
        </>
      ) : (
        <>
          <p className="mt-1 text-sm text-muted-foreground">
            Use at least 8 characters.
          </p>
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <Field label="New password">
              <PasswordInput
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </Field>
            <Field label="Confirm password">
              <PasswordInput
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </Field>
            {message ? (
              <p className="text-sm text-red-600" role="alert">
                {message}
              </p>
            ) : null}
            <Button type="submit" fullWidth disabled={loading}>
              {loading ? "Please wait…" : "Update password"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            <Link href="/login" className="font-medium text-primary">
              Back to log in
            </Link>
          </p>
        </>
      )}
    </Card>
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
