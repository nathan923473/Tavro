"use client";

import { BrandWordmark } from "@/components/brand/brand-wordmark";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getOrCreateTabId, syncTabHintCookie } from "@/lib/auth/tab-id.client";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useState } from "react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const tabId = getOrCreateTabId();
      syncTabHintCookie(tabId);
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent("/reset-password")}`;
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo },
      );
      if (error) throw error;
      setSent(true);
    } catch (e) {
      const raw = e instanceof Error ? e.message : "Something went wrong";
      if (
        raw.toLowerCase().includes("rate limit") ||
        raw.includes("over_email_send_rate_limit")
      ) {
        setMessage(
          "Too many reset emails were sent. Wait a bit, or raise the limit in Supabase → Authentication → Rate limits (see docs/supabase-auth-setup.md).",
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
      <BrandWordmark size="sm" className="mb-4" />
      <h1 className="text-xl font-bold">Reset your password</h1>
      {sent ? (
        <>
          <p className="mt-1 text-sm text-muted-foreground" role="status">
            If an account exists for {email.trim().toLowerCase()}, we sent a
            reset link. Open it in this browser, then choose a new password.
          </p>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            <Link href="/login" className="font-medium text-primary">
              Back to log in
            </Link>
          </p>
        </>
      ) : (
        <>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter the email on your account and we&apos;ll send a reset link.
          </p>
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
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
            {message ? (
              <p className="text-sm text-red-600" role="alert">
                {message}
              </p>
            ) : null}
            <Button type="submit" fullWidth disabled={loading}>
              {loading ? "Please wait…" : "Send reset link"}
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
