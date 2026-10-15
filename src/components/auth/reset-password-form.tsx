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
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const tabId = getOrCreateTabId();
    syncTabHintCookie(tabId);
    const supabase = createClient();

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      setHasSession(Boolean(session));
      setCheckingSession(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setHasSession(true);
        setCheckingSession(false);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);

    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      router.push("/?password_updated=1");
      router.refresh();
    } catch (e) {
      const raw = e instanceof Error ? e.message : "Something went wrong";
      if (raw.toLowerCase().includes("session")) {
        setMessage(
          "This reset link expired or was already used. Request a new link from the forgot password page.",
        );
        setHasSession(false);
      } else {
        setMessage(raw);
      }
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <Card className="mx-auto max-w-md p-4 text-sm text-muted-foreground">
        Checking your reset link…
      </Card>
    );
  }

  if (!hasSession) {
    return (
      <Card className="mx-auto max-w-md">
        <BrandWordmark size="md" className="mb-4 justify-center" />
        <h1 className="text-xl font-bold">Reset link needed</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Open the link from your email on this device, or request a new one.
          Use the same browser URL you normally use for log in (localhost vs
          127.0.0.1 must match).
        </p>
        {message ? (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {message}
          </p>
        ) : null}
        <div className="mt-4 flex flex-col gap-2">
          <Link
            href="/forgot-password"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20"
          >
            Send a new reset link
          </Link>
          <Link
            href="/login"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-secondary px-5 text-sm font-semibold text-secondary-foreground"
          >
            Back to log in
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-md">
      <BrandWordmark size="md" className="mb-4 justify-center" />
      <h1 className="text-xl font-bold">Choose a new password</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Must be at least 8 characters. You&apos;ll stay signed in after saving.
      </p>
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <div>
          <label className="mb-1 block text-sm font-medium">New password</label>
          <PasswordInput
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            Confirm password
          </label>
          <PasswordInput
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        {message ? (
          <p className="text-sm text-red-600" role="alert">
            {message}
          </p>
        ) : null}
        <Button type="submit" fullWidth disabled={loading}>
          {loading ? "Saving…" : "Save new password"}
        </Button>
      </form>
    </Card>
  );
}
