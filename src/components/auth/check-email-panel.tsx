"use client";

import { resendSignupConfirmation } from "@/app/(auth)/actions";
import { BrandWordmark } from "@/components/brand/brand-wordmark";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { safeInternalPath } from "@/lib/site-url";
import Link from "next/link";
import { useState } from "react";

export function CheckEmailPanel({
  email,
  nextPath,
}: {
  email: string;
  nextPath: string;
}) {
  const next = safeInternalPath(nextPath);
  const [address, setAddress] = useState(email);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function resend() {
    setLoading(true);
    setError(null);
    setMessage(null);
    const result = await resendSignupConfirmation({ email: address, next });
    setLoading(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setMessage(result.message);
  }

  return (
    <Card className="mx-auto max-w-md">
      <BrandWordmark size="md" className="mb-4 justify-center" />
      <h1 className="text-xl font-bold">Check your email</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        We sent a verification link
        {address ? (
          <>
            {" "}
            to <strong className="text-foreground">{address}</strong>
          </>
        ) : null}
        . Open it to finish creating your account. The link expires, and you can request
        another one from here.
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        Your account is not active until that link is opened. Creator access is a separate
        step after this.
      </p>
      {message ? (
        <p className="mt-3 text-sm text-foreground" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      <div className="mt-4 flex flex-col gap-2">
        {email ? null : (
          <input
            type="email"
            required
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder="Email address"
            autoComplete="email"
            className="w-full rounded-2xl border border-border bg-surface px-3 py-3 text-sm outline-none ring-primary focus:ring-2"
          />
        )}
        <Button type="button" fullWidth disabled={loading || !address.trim()} onClick={() => void resend()}>
          {loading ? "Sending…" : "Resend verification email"}
        </Button>
        <Link
          href={next !== "/" ? `/login?next=${encodeURIComponent(next)}` : "/login"}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-secondary px-5 text-sm font-semibold text-secondary-foreground"
        >
          I already confirmed — log in
        </Link>
      </div>
    </Card>
  );
}
