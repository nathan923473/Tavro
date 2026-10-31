"use client";

import { userFacingErrorMessage } from "@/lib/errors/user-message";

import { submitContentReportAction } from "@/app/(app)/moderation/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CONTENT_REPORT_REASONS } from "@/lib/moderation/types";
import type { ContentReportReason, ReportedContentType } from "@/lib/moderation/types";
import { useEffect, useState, useTransition } from "react";

type ReportContentDialogProps = {
  open: boolean;
  onClose: () => void;
  contentType: ReportedContentType;
  contentId: string;
  reportedUserId: string;
  label?: string;
};

export function ReportContentDialog({
  open,
  onClose,
  contentType,
  contentId,
  reportedUserId,
  label = "Report content",
}: ReportContentDialogProps) {
  const [reason, setReason] = useState<ContentReportReason>("spam_scam");
  const [explanation, setExplanation] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) {
      setReason("spam_scam");
      setExplanation("");
      setMessage(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="report-dialog-title">
      <Card className="max-h-[85vh] w-full max-w-md overflow-y-auto">
        <h2 id="report-dialog-title" className="text-lg font-semibold">
          {label}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Reports go to Tavro admins for review. We do not automatically remove content.
        </p>

        <fieldset className="mt-4 space-y-2">
          <legend className="text-sm font-medium">Reason</legend>
          {CONTENT_REPORT_REASONS.map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-start gap-2 rounded-lg border border-border px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5"
            >
              <input
                type="radio"
                name="report-reason"
                value={opt.value}
                checked={reason === opt.value}
                onChange={() => setReason(opt.value)}
                className="mt-0.5"
              />
              {opt.label}
            </label>
          ))}
        </fieldset>

        <label className="mt-4 block text-sm">
          <span className="font-medium">
            Details {reason === "other" ? "(required)" : "(optional)"}
          </span>
          <textarea
            rows={3}
            maxLength={500}
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
            placeholder="What is wrong with this content?"
          />
        </label>

        {message ? (
          <p
            className={`mt-3 text-sm ${/thank|submitted|already/i.test(message) ? "text-muted-foreground" : "text-destructive"}`}
            role="status"
          >
            {message}
          </p>
        ) : null}

        <div className="mt-4 flex gap-2">
          <Button type="button" variant="outline" fullWidth disabled={pending} onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            fullWidth
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                try {
                  await submitContentReportAction({
                    contentType,
                    contentId,
                    reportedUserId,
                    reason,
                    explanation,
                  });
                  setMessage("Thanks — your report was submitted.");
                  setTimeout(onClose, 1200);
                } catch (e) {
                  setMessage(userFacingErrorMessage(e, "Could not submit report."));
                }
              })
            }
          >
            Submit report
          </Button>
        </div>
      </Card>
      </div>
    </div>
  );
}
