"use client";

import {
  refreshCreatorVerificationCode,
  requestDmVerification,
  verifyBioForApplication,
} from "@/app/(app)/become-creator/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CreatorApplicationRow } from "@/lib/creator/applications";
import { userFacingErrorMessage } from "@/lib/errors/user-message";
import { useState } from "react";

export function CreatorVerificationPanel({
  application,
  dmTarget,
  canRefreshCode,
  statusTitle,
  statusBody,
}: {
  application: CreatorApplicationRow;
  dmTarget: string;
  canRefreshCode: boolean;
  statusTitle: string;
  statusBody: string;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<"bio" | "dm" | "code" | null>(null);

  const expiresAt = application.verification_code_expires_at
    ? new Date(application.verification_code_expires_at)
    : null;
  async function onVerifyBio() {
    setLoading("bio");
    setMessage(null);
    const result = await verifyBioForApplication(application.id);
    setMessage(userFacingErrorMessage(result.message, "Could not verify that. Please try again."));
    setLoading(null);
    if (result.ok) {
      window.location.reload();
    }
  }

  async function onRefreshCode() {
    setLoading("code");
    setMessage(null);
    const result = await refreshCreatorVerificationCode(application.id);
    setMessage(result.message);
    setLoading(null);
    if (result.ok) window.location.reload();
  }

  async function onRequestDm() {
    setLoading("dm");
    setMessage(null);
    const result = await requestDmVerification(application.id);
    setMessage(userFacingErrorMessage(result.message, "Could not verify that. Please try again."));
    setLoading(null);
  }

  const statusLabel =
    application.status === "awaiting_review"
      ? "Awaiting review"
      : application.status === "pending_verification"
        ? "Pending verification"
        : application.status;

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-semibold">{statusTitle}</h2>
        <Badge tone="muted">{statusLabel}</Badge>
        {application.verification_state === "verified" ? (
          <Badge tone="success">Verified</Badge>
        ) : null}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{statusBody}</p>

      {application.status === "awaiting_review" ? (
        <p className="mt-4 text-sm">
          Ownership verified. Our team will review your pitch and approve or
          reject your creator access.
        </p>
      ) : canRefreshCode ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm">
            The code for {application.social_link ?? "your profile"} has expired. Request a
            new one and add it to that public bio.
          </p>
          <Button type="button" fullWidth disabled={loading !== null} onClick={onRefreshCode}>
            {loading === "code" ? "Creating a code…" : "Get a new verification code"}
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-4 rounded-xl bg-muted p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Your verification code
            </p>
            <p className="mt-1 font-mono text-lg font-semibold tracking-wide">
              {application.verification_code}
            </p>
            {expiresAt ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Expires {expiresAt.toLocaleString()} (48 hours)
              </p>
            ) : null}
          </div>

          <ol className="mt-4 list-decimal space-y-2 pl-4 text-sm text-muted-foreground">
            <li>
              Temporarily add the code above to the{" "}
              <strong>public bio</strong> of{" "}
              <a
                href={application.social_link ?? "#"}
                className="text-primary underline-offset-2 hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                your profile
              </a>
              .
            </li>
            <li>Click &quot;Check my bio&quot; below.</li>
          </ol>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              fullWidth
              disabled={loading !== null}
              onClick={onVerifyBio}
            >
              {loading === "bio" ? "Checking…" : "Check my bio"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              fullWidth
              disabled={loading !== null}
              onClick={onRequestDm}
            >
              {loading === "dm" ? "Saving…" : "Verify via DM instead"}
            </Button>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            DM option: message {dmTarget} from the claimed account with your
            verification code. An admin will confirm manually.
            {application.dm_verification_requested_at
              ? " (DM verification requested.)"
              : null}
          </p>
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
