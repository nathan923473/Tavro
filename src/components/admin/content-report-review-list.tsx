"use client";

import { userFacingErrorMessage } from "@/lib/errors/user-message";

import { adminUpdateContentReportAction } from "@/app/(app)/moderation/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CONTENT_REPORT_REASONS } from "@/lib/moderation/types";
import type { ContentReportRow } from "@/lib/moderation/types";
import { useState } from "react";

function reasonLabel(value: string) {
  return CONTENT_REPORT_REASONS.find((r) => r.value === value)?.label ?? value;
}

export function ContentReportReviewList({ reports }: { reports: ContentReportRow[] }) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notesById, setNotesById] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  async function run(id: string, status: "reviewed" | "dismissed") {
    setBusyId(id);
    setMessage(null);
    try {
      await adminUpdateContentReportAction(id, status, notesById[id] ?? "");
      window.location.reload();
    } catch (e) {
      setMessage(userFacingErrorMessage(e, "Action failed"));
      setBusyId(null);
    }
  }

  if (!reports.length) {
    return (
      <Card>
        <p className="text-sm text-muted-foreground">No content reports yet.</p>
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
      {reports.map((report) => (
        <Card key={report.id}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="font-semibold">
                {report.contentType.replace(/_/g, " ")}
              </h2>
              <p className="text-xs text-muted-foreground">
                Content id: {report.contentId}
              </p>
            </div>
            <Badge tone={report.status === "pending" ? "warning" : "muted"}>
              {report.status}
            </Badge>
          </div>

          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className="font-medium">Reason</dt>
              <dd>{reasonLabel(report.reason)}</dd>
            </div>
            {report.explanation ? (
              <div>
                <dt className="font-medium">Reporter notes</dt>
                <dd className="text-muted-foreground">{report.explanation}</dd>
              </div>
            ) : null}
            <div>
              <dt className="font-medium">Reporter</dt>
              <dd>
                {report.reporterDisplayName ?? "Member"} ({report.reporterId})
              </dd>
            </div>
            <div>
              <dt className="font-medium">Reported member</dt>
              <dd>
                {report.reportedDisplayName ?? "Member"} ({report.reportedUserId})
              </dd>
            </div>
            <div>
              <dt className="font-medium">Submitted</dt>
              <dd>{new Date(report.createdAt).toLocaleString()}</dd>
            </div>
            {report.adminNotes ? (
              <div>
                <dt className="font-medium">Prior admin notes</dt>
                <dd className="text-muted-foreground">{report.adminNotes}</dd>
              </div>
            ) : null}
          </dl>

          {report.status === "pending" ? (
            <div className="mt-4 space-y-2">
              <textarea
                rows={2}
                placeholder="Admin notes (optional)"
                value={notesById[report.id] ?? ""}
                onChange={(e) =>
                  setNotesById((prev) => ({ ...prev, [report.id]: e.target.value }))
                }
                className="w-full rounded-xl border border-border px-3 py-2 text-sm"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  fullWidth
                  disabled={busyId === report.id}
                  onClick={() => run(report.id, "dismissed")}
                >
                  Dismiss
                </Button>
                <Button
                  type="button"
                  fullWidth
                  disabled={busyId === report.id}
                  onClick={() => run(report.id, "reviewed")}
                >
                  Mark reviewed
                </Button>
              </div>
            </div>
          ) : null}
        </Card>
      ))}
    </div>
  );
}
