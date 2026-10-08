"use client";

import { ChallengeCreatorLivePreview } from "@/components/creator/studio/challenge-creator-live-preview";
import type { ChallengeCategory } from "@/types/creator-studio";
import type { ReactNode } from "react";

type ChallengeBuilderWithPreviewProps = {
  children: ReactNode;
  templateLabel: string;
  category: ChallengeCategory;
  title: string;
  shortDescription: string;
  description: string;
  goalDescription: string;
  startDate: string;
  endDate: string;
  startTimeLocal: string;
  challengeTimezone: string;
  schedule: Array<{ dayLabel: string; title: string; body: string; isRest: boolean }>;
  creatorDisplayName: string;
  creatorAvatarUrl?: string | null;
  showPreview?: boolean;
};

/** Form on top, phone-width participant preview below — same on mobile and desktop. */
export function ChallengeBuilderWithPreview({
  children,
  showPreview = true,
  ...preview
}: ChallengeBuilderWithPreviewProps) {
  if (!showPreview) {
    return <div className="mx-auto w-full max-w-2xl space-y-4">{children}</div>;
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8 pb-4">
      <div className="min-w-0 space-y-4">{children}</div>

      <section
        aria-labelledby="challenge-live-preview-heading"
        className="border-t border-border pt-8"
      >
        <div className="mb-4 text-center">
          <h2
            id="challenge-live-preview-heading"
            className="text-sm font-semibold text-foreground"
          >
            Participant preview
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Updates live as you edit · {preview.templateLabel}
          </p>
        </div>
        <div className="mx-auto w-full max-w-[400px]">
          <div className="rounded-[1.75rem] bg-muted/50 p-2 ring-1 ring-border/80 shadow-sm">
            <ChallengeCreatorLivePreview {...preview} framed />
          </div>
        </div>
      </section>
    </div>
  );
}
