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
  /** Hide side preview on step 0 if desired */
  showPreview?: boolean;
};

export function ChallengeBuilderWithPreview({
  children,
  showPreview = true,
  ...preview
}: ChallengeBuilderWithPreviewProps) {
  if (!showPreview) {
    return <div className="space-y-4">{children}</div>;
  }

  return (
    <div className="space-y-4 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] lg:items-start lg:gap-6">
      <div className="min-w-0 space-y-4">{children}</div>
      <aside className="lg:sticky lg:top-4">
        <div className="hidden lg:block">
          <ChallengeCreatorLivePreview {...preview} />
        </div>
        <details className="rounded-xl border border-border bg-surface/80 lg:hidden">
          <summary className="cursor-pointer px-3 py-2.5 text-sm font-semibold">
            Show participant preview
          </summary>
          <div className="border-t border-border p-3">
            <ChallengeCreatorLivePreview {...preview} compact />
          </div>
        </details>
      </aside>
    </div>
  );
}
