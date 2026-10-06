"use client";

import { ReportContentDialog } from "@/components/moderation/report-content-dialog";
import type { ReportedContentType } from "@/lib/moderation/types";
import { Flag } from "lucide-react";
import { useState } from "react";

type ReportContentMenuProps = {
  contentType: ReportedContentType;
  contentId: string;
  reportedUserId: string;
  /** Hide when viewer is the owner or not logged in */
  canReport: boolean;
  className?: string;
  compact?: boolean;
};

export function ReportContentMenu({
  contentType,
  contentId,
  reportedUserId,
  canReport,
  className = "",
  compact = false,
}: ReportContentMenuProps) {
  const [open, setOpen] = useState(false);

  if (!canReport) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          compact
            ? `inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground ${className}`
            : `absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-full bg-surface/90 px-2.5 py-1 text-xs font-semibold shadow-sm backdrop-blur hover:bg-surface ${className}`
        }
        aria-label="Report content"
      >
        <Flag className="h-3.5 w-3.5" aria-hidden />
        {compact ? "Report" : null}
      </button>
      <ReportContentDialog
        open={open}
        onClose={() => setOpen(false)}
        contentType={contentType}
        contentId={contentId}
        reportedUserId={reportedUserId}
      />
    </>
  );
}
