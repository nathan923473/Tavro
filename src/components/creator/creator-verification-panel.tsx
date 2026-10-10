"use client";

import { confirmDmSent } from "@/app/(app)/become-creator/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CreatorApplicationRow } from "@/lib/creator/applications";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

/** Locale-stable date text so SSR and the browser match (avoids hydration errors). */
function formatUtcDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
}

export function CreatorVerificationPanel({
  application,
  dmTarget,
}: {
  application: CreatorApplicationRow;
  dmTarget: string | null;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const expiresAtIso = application.verification_code_expires_at;
  const expiresAtMs = expiresAtIso ? Date.parse(expiresAtIso) : NaN;
  const expired =
    Number.isFinite(expiresAtMs) && expiresAtMs < Date.now();
  const dmRequested = Boolean(application.dm_verification_requested_at);
  const code = application.verification_code ?? "";

  async function onCopyCode() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this verification code:", code);
    }
  }

  async function onConfirmDmSent() {
    setLoading(true);
    setMessage(null);
    const result = await confirmDmSent(application.id);
    setMessage(result.message);
    setLoading(false);
    if (result.ok) {
      window.location.reload();
    }
  }

  const statusLabel =
    application.status === "awaiting_review"
      ? "Awaiting review"
      : application.status === "pending_verification"
        ? dmRequested
          ? "DM sent — awaiting confirmation"
          : "Pending verification"
        : application.status;

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-semibold">Verify Instagram ownership</h2>
        <Badge tone="muted">{statusLabel}</Badge>
        {application.verification_state === "verified" ? (
          <Badge tone="success">Verified</Badge>
        ) : null}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Ownership verification is separate from approval. An admin must still
        approve your application before Creator Studio unlocks.
      </p>

      {application.status === "awaiting_review" ||
      application.verification_state === "verified" ? (
        <p className="mt-4 text-sm">
          Ownership verified. Our team will review your pitch and approve or
          reject your creator access.
        </p>
      ) : expired ? (
        <p className="mt-4 text-sm text-destructive">
          Your verification code expired. Contact support or reapply when
          reapplication is enabled.
        </p>
      ) : (
        <>
          <div className="mt-4 rounded-xl bg-muted p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Your temporary verification code
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <p className="font-mono text-lg font-semibold tracking-wide">
                {code || "—"}
              </p>
              <Button
                type="button"
                variant="outline"
                disabled={!code}
                onClick={onCopyCode}
                aria-label="Copy verification code"
              >
                {copied ? (
                  <Check className="h-4 w-4" aria-hidden />
                ) : (
                  <Copy className="h-4 w-4" aria-hidden />
                )}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            {expiresAtIso ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Expires {formatUtcDateTime(expiresAtIso)} (48 hours)
              </p>
            ) : null}
          </div>

          {!dmTarget ? (
            <p className="mt-4 text-sm text-amber-800">
              Tavro&apos;s official Instagram verification account is not
              configured yet. Set{" "}
              <code className="rounded bg-muted px-1 text-xs">
                OFFICIAL_VERIFICATION_DM_TARGET
              </code>{" "}
              in the environment (e.g.{" "}
              <code className="rounded bg-muted px-1 text-xs">
                @yourhandle on Instagram
              </code>
              ), then refresh this page.
            </p>
          ) : (
            <ol className="mt-4 list-decimal space-y-2 pl-4 text-sm text-muted-foreground">
              <li>
                Open Instagram and use the same account as{" "}
                <a
                  href={application.social_link ?? "#"}
                  className="font-medium text-primary underline-offset-2 hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  the profile you applied with
                </a>
                .
              </li>
              <li>
                Send a DM to{" "}
                <strong className="text-foreground">{dmTarget}</strong> that
                includes your verification code above.
              </li>
              <li>
                Tap <strong className="text-foreground">I&apos;ve sent the DM</strong>{" "}
                below. An admin will confirm ownership after checking the message
                — this does not approve you as a creator.
              </li>
            </ol>
          )}

          <div className="mt-4">
            <Button
              type="button"
              fullWidth
              disabled={loading || !dmTarget || !code || dmRequested}
              onClick={onConfirmDmSent}
            >
              {loading
                ? "Saving…"
                : dmRequested
                  ? "DM marked as sent"
                  : "I've sent the DM"}
            </Button>
          </div>

          {dmRequested && application.dm_verification_requested_at ? (
            <p className="mt-3 text-xs text-muted-foreground">
              DM recorded{" "}
              {formatUtcDateTime(application.dm_verification_requested_at)}.
              Waiting for an admin to confirm ownership.
            </p>
          ) : null}
        </>
      )}

      {message ? (
        <p className="mt-3 text-sm text-muted-foreground" role="status">
          {message}
        </p>
      ) : null}
    </Card>
  );
}
