"use client";

import {
  adminApproveApplication,
  adminConfirmVerification,
  adminRejectApplication,
} from "@/app/(app)/admin/creator-applications/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { CreatorApplicationRow } from "@/lib/creator/applications";
import { applicationSourceLabel } from "@/lib/creator/growth";
import { useState } from "react";

export function CreatorApplicationReviewList({
  applications,
  referrerNames,
}: {
  applications: CreatorApplicationRow[];
  referrerNames: Record<string, string>;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function run(id: string, action: () => Promise<void>) {
    setBusyId(id);
    setMessage(null);
    try {
      await action();
      window.location.reload();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Action failed");
      setBusyId(null);
    }
  }

  if (!applications.length) {
    return (
      <Card>
        <p className="text-sm text-muted-foreground">No applications yet.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {message ? (
        <p className="text-sm text-destructive" role="alert">
          {message}
        </p>
      ) : null}
      {applications.map((app) => (
        <Card key={app.id}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="font-semibold">{app.display_name}</h2>
              <p className="text-xs text-muted-foreground">
                User ID: {app.user_id}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="muted">{app.status}</Badge>
              <Badge
                tone={
                  app.verification_state === "verified" ? "success" : "warning"
                }
              >
                {app.verification_state}
              </Badge>
            </div>
          </div>

          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className="font-medium">Social profile</dt>
              <dd>
                <a
                  href={app.social_link ?? "#"}
                  className="text-primary underline-offset-2 hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  {app.social_link}
                </a>
              </dd>
            </div>
            <div>
              <dt className="font-medium">Verification code</dt>
              <dd className="font-mono">{app.verification_code ?? "—"}</dd>
            </div>
            <div>
              <dt className="font-medium">Application source</dt>
              <dd className="text-muted-foreground">
                {applicationSourceLabel(app.application_source)}
                {app.referred_by_user_id ? (
                  <>
                    {" "}
                    · Referred by{" "}
                    <span className="font-medium text-foreground">
                      {referrerNames[app.referred_by_user_id] ?? app.referred_by_user_id}
                    </span>
                  </>
                ) : null}
              </dd>
            </div>
            <div>
              <dt className="font-medium">Pitch</dt>
              <dd className="text-muted-foreground">{app.pitch}</dd>
            </div>
            {app.dm_verification_requested_at ? (
              <div>
                <dt className="font-medium">DM verification</dt>
                <dd className="text-muted-foreground">
                  Requested {new Date(app.dm_verification_requested_at).toLocaleString()}
                </dd>
              </div>
            ) : null}
          </dl>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {app.verification_state !== "verified" ? (
              <Button
                type="button"
                variant="outline"
                disabled={busyId === app.id}
                onClick={() =>
                  run(app.id, () => adminConfirmVerification(app.id))
                }
              >
                Confirm verification manually
              </Button>
            ) : null}
            <Button
              type="button"
              disabled={
                busyId === app.id ||
                app.status !== "awaiting_review" ||
                app.verification_state !== "verified"
              }
              onClick={() => run(app.id, () => adminApproveApplication(app.id))}
            >
              Approve creator
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={busyId === app.id || app.status === "approved"}
              onClick={() =>
                run(app.id, () =>
                  adminRejectApplication(app.id, "Rejected by admin review."),
                )
              }
            >
              Reject
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
