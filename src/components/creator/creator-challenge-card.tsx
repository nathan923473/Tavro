import { ChallengeCoverImage } from "@/components/challenges/challenge-cover-image";
import { ChallengeCreatorLine } from "@/components/challenges/challenge-creator-line";
import { ChallengeDateRange } from "@/components/challenges/challenge-date-range";
import { ChallengeStartCountdown } from "@/components/challenges/challenge-start-countdown";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { CreatorCommunityChallenge } from "@/types/creator-community";
import { CalendarRange, Users } from "lucide-react";
import Link from "next/link";

type CreatorChallengeCardProps = {
  challenge: CreatorCommunityChallenge;
  showJoin?: boolean;
  creatorUserId: string;
  creatorDisplayName: string;
  creatorAvatarUrl: string | null;
  viewerUserId?: string | null;
};

export function CreatorChallengeCard({
  challenge,
  showJoin = true,
  creatorUserId,
  creatorDisplayName,
  creatorAvatarUrl,
  viewerUserId = null,
}: CreatorChallengeCardProps) {
  const canReportCover = Boolean(
    viewerUserId && viewerUserId !== creatorUserId && challenge.coverUrl,
  );
  const isPast = challenge.timeline === "previous";
  const isUpcoming = challenge.timeline === "upcoming";
  const isOwner = Boolean(viewerUserId && viewerUserId === creatorUserId);
  const openHref = isOwner
    ? `/challenges/${challenge.id}`
    : `/join/${challenge.inviteSlug}`;

  return (
    <Card className="overflow-hidden p-0">
      <ChallengeCoverImage
        coverUrl={challenge.coverUrl}
        fallbackGradient={challenge.coverGradient}
        title={challenge.title}
        report={
          challenge.coverUrl
            ? {
                contentId: challenge.id,
                reportedUserId: creatorUserId,
                canReport: canReportCover,
              }
            : undefined
        }
      />
      <div className="space-y-2 p-4">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <div className="flex flex-wrap items-center gap-2">
            {isUpcoming ? (
              <Badge tone="warning" className="uppercase tracking-wide">
                Upcoming
              </Badge>
            ) : isPast ? (
              <Badge tone="muted">Completed</Badge>
            ) : (
              <Badge tone="success">Active</Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {isUpcoming ? (
              <ChallengeStartCountdown
                startDate={challenge.startDate}
                variant="compact"
                label="Starts in"
              />
            ) : null}
            {!isPast ? <Badge tone="success">Free</Badge> : null}
          </div>
        </div>

        <div>
          <h3 className="font-semibold leading-snug">{challenge.title}</h3>
          <ChallengeCreatorLine
            displayName={creatorDisplayName}
            avatarUrl={creatorAvatarUrl}
            className="mt-1.5"
          />
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2">{challenge.description}</p>

        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <CalendarRange className="h-3.5 w-3.5" aria-hidden />
            <ChallengeDateRange startDate={challenge.startDate} endDate={challenge.endDate} />
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" aria-hidden />
            {challenge.participants.toLocaleString()} joined
          </span>
        </div>

        <div className="flex gap-2 pt-1">
          <Link
            href={openHref}
            className="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl bg-primary px-3 text-sm font-semibold text-primary-foreground"
          >
            {isOwner ? "Open challenge" : isPast ? "View recap" : "View challenge"}
          </Link>
          {showJoin && !isPast && !isOwner ? (
            <Link
              href={`/join/${challenge.inviteSlug}`}
              className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl border border-border px-3 text-sm font-semibold"
            >
              Free to join
            </Link>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
