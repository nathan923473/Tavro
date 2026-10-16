"use client";

import { ChallengeCoverImage } from "@/components/challenges/challenge-cover-image";
import { ChallengeCreatorLine } from "@/components/challenges/challenge-creator-line";
import { ChallengeDateRange } from "@/components/challenges/challenge-date-range";
import { ChallengeStartCountdown } from "@/components/challenges/challenge-start-countdown";
import { LeaveChallengeButton } from "@/components/challenges/leave-challenge-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { isChallengeUpcoming } from "@/lib/challenge-countdown";
import { CalendarRange, Gift, Users } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export type ChallengeSummaryCardProps = {
  title: string;
  shortDescription?: string | null;
  coverUrl?: string | null;
  coverFallbackGradient?: string;
  creatorName: string;
  creatorAvatarUrl?: string | null;
  creatorSubtitle?: string | null;
  startDate: string;
  endDate: string;
  startAt?: string | null;
  challengeTimezone?: string | null;
  participants: number;
  participantsLabel?: string;
  href: string;
  ctaLabel: string;
  upcoming?: boolean;
  topRightBadges?: ReactNode;
  showFreeBadge?: boolean;
  joined?: boolean;
  leaveChallengeId?: string;
  leaveRedirectTo?: string;
  reportCover?: {
    contentId: string;
    reportedUserId: string;
    canReport: boolean;
  };
};

export function ChallengeSummaryCard({
  title,
  shortDescription,
  coverUrl,
  coverFallbackGradient,
  creatorName,
  creatorAvatarUrl,
  creatorSubtitle,
  startDate,
  endDate,
  startAt,
  challengeTimezone,
  participants,
  participantsLabel = "joined",
  href,
  ctaLabel,
  upcoming: upcomingProp,
  topRightBadges,
  showFreeBadge = true,
  joined = false,
  leaveChallengeId,
  leaveRedirectTo,
  reportCover,
}: ChallengeSummaryCardProps) {
  const upcoming =
    upcomingProp ??
    isChallengeUpcoming({
      startAt: startAt ?? null,
      startDate,
      challengeTimezone,
    });

  return (
    <Card className="overflow-hidden p-0">
      <ChallengeCoverImage
        coverUrl={coverUrl}
        fallbackGradient={coverFallbackGradient}
        title={title}
        report={reportCover}
      />

      <div className="space-y-2 p-4">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {upcoming ? (
              <Badge tone="warning" className="shrink-0 uppercase tracking-wide">
                Upcoming
              </Badge>
            ) : null}
          </div>
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
            {upcoming ? (
              <ChallengeStartCountdown
                startAt={startAt}
                startDate={startDate}
                challengeTimezone={challengeTimezone}
                variant="compact"
                label="Starts in"
              />
            ) : null}
            {topRightBadges}
            {showFreeBadge ? (
              <Badge tone="success" className="gap-1">
                <Gift className="h-3 w-3" aria-hidden />
                Free
              </Badge>
            ) : null}
          </div>
        </div>

        <div>
          <h3 className="font-semibold leading-snug">{title}</h3>
          <ChallengeCreatorLine
            displayName={creatorName}
            avatarUrl={creatorAvatarUrl}
            subtitle={creatorSubtitle ?? undefined}
            className="mt-1.5"
          />
        </div>

        {shortDescription ? (
          <p className="text-sm text-muted-foreground line-clamp-2">{shortDescription}</p>
        ) : null}

        <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <CalendarRange className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <ChallengeDateRange
              startDate={startDate}
              endDate={endDate}
              challengeTimezone={challengeTimezone}
            />
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {participants.toLocaleString()} {participantsLabel}
          </span>
        </p>

        <Link
          href={href}
          className="flex min-h-10 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground"
        >
          {ctaLabel}
        </Link>

        {joined && leaveChallengeId ? (
          <LeaveChallengeButton
            challengeId={leaveChallengeId}
            className="mt-0"
            redirectTo={leaveRedirectTo}
          />
        ) : null}
      </div>
    </Card>
  );
}
