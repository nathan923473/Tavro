"use client";

import { sendOwnershipVerificationEmail } from "@/app/(auth)/actions";
import { CheckEmailPanel } from "@/components/auth/check-email-panel";
import { BrandWordmark } from "@/components/brand/brand-wordmark";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { useEffect, useState } from "react";

function hashErrorMessage(): string | null {
  if (typeof window === "undefined") return null;
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const code = hash.get("error_code") || hash.get("error");
  if (!code) return null;
  const description = hash.get("error_description") ?? "";
  if (code === "otp_expired" || description.toLowerCase().includes("expired")) {
    return "That link has expired. Request a new one below.";
  }
  return "That link is invalid or has already been used. Request a new one below.";
}

export function VerifyEmailPanel({
  mode,
  email,
  nextPath,
  queryError,
}: {
  mode: "reverify" | "confirm" | "signed_out";
  email: string;
  nextPath: string;
  queryError?: string;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fromHash = hashErrorMessage();
    if (fromHash) setError(fromHash);
  }, []);

  const queryMessage =
    queryError === "expired"
      ? "That link has expired. Request a new one below."
      : queryError === "invalid"
        ? "That link is invalid or has already been used. Request a new one below."
        : queryError === "config"
          ? "Your email link worked, but Tavro could not record it. Add the server service role key, then request another link."
          : null;

  if (mode === "signed_out" || mode === "confirm") {
    return (
      <div className="space-y-3">
        {queryMessage ? (
          <p className="mx-auto max-w-md text-sm text-red-600" role="alert">
            {queryMessage}
          </p>
        ) : null}
        <CheckEmailPanel email={email} nextPath={nextPath} />
      </div>
    );
  }

  async function sendLink() {
    setLoading(true);
    setError(null);
    setMessage(null);
    const result = await sendOwnershipVerificationEmail({ next: nextPath });
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
      <h1 className="text-xl font-bold">Confirm this email address</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Your account, challenges, and progress stay as they are. Earlier accounts were marked
        verified without opening an email link, so Tavro needs one confirmation from
        {email ? (
          <>
            {" "}
            <strong className="text-foreground">{email}</strong>
          </>
        ) : (
          " this inbox"
        )}{" "}
        before protected features open again.
      </p>
      {queryMessage ? (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {queryMessage}
        </p>
      ) : null}
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
        <Button type="button" fullWidth disabled={loading} onClick={() => void sendLink()}>
          {loading ? "Sending…" : "Email me a verification link"}
        </Button>
        <Link
          href="/forgot-password"
          className="text-center text-sm font-medium text-primary"
        >
          Forgot your password?
        </Link>
      </div>
    </Card>
  );
}
