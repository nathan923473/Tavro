"use client";

import { requestPasswordReset } from "@/app/(auth)/actions";
import { BrandWordmark } from "@/components/brand/brand-wordmark";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { APP_NAME } from "@/lib/branding";
import Link from "next/link";
import { useState } from "react";

export function ForgotPasswordForm({ linkError }: { linkError?: string }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const result = await requestPasswordReset({ email });
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      setSent(true);
      setMessage(
        `If an account exists for that email, we sent a link to choose a new password. Check spam, then open the link on this device in ${APP_NAME}.`,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mx-auto max-w-md">
      <BrandWordmark size="md" className="mb-4 justify-center" />
      <h1 className="text-xl font-bold">Forgot your password?</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter the email you use for {APP_NAME}. We&apos;ll send a secure link to
        set a new password.
      </p>
      {linkError === "expired" ? (
        <p className="mt-3 text-sm text-red-600" role="alert">
          That reset link has expired. Request a new one below.
        </p>
      ) : null}
      {linkError === "invalid" ? (
        <p className="mt-3 text-sm text-red-600" role="alert">
          That reset link is invalid or was already used. Request a new one below.
        </p>
      ) : null}
      {sent ? (
        <p className="mt-4 text-sm text-foreground" role="status">
          {message}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-border bg-surface px-3 py-3 text-sm outline-none ring-primary focus:ring-2"
              autoComplete="email"
            />
          </div>
          {message ? (
            <p className="text-sm text-red-600" role="alert">
              {message}
            </p>
          ) : null}
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-primary">
          Back to log in
        </Link>
      </p>
    </Card>
  );
}
