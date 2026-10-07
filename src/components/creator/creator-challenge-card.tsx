import { ReportContentMenu } from "@/components/moderation/report-content-menu";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { CreatorCommunityChallenge } from "@/types/creator-community";
import { ChallengeStartCountdown } from "@/components/challenges/challenge-start-countdown";
import { CalendarRange, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type CreatorChallengeCardProps = {
  challenge: CreatorCommunityChallenge;
  showJoin?: boolean;
  creatorUserId: string;
  viewerUserId?: string | null;
};

export function CreatorChallengeCard({
  challenge,
  showJoin = true,
  creatorUserId,
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
      <div
        className="relative h-28 w-full bg-muted"
        style={
          challenge.coverUrl ? undefined : { background: challenge.coverGradient }
        }
        role="img"
        aria-label=""
      >
        {challenge.coverUrl ? (
          <>
            <Image
              src={challenge.coverUrl}
              alt=""
              fill
              className="object-cover"
              unoptimized
            />
            <ReportContentMenu
              contentType="challenge_cover"
              contentId={challenge.id}
              reportedUserId={creatorUserId}
              canReport={canReportCover}
            />
          </>
        ) : null}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-snug">{challenge.title}</h3>
          {!isPast ? (
            <Badge tone="success">Free</Badge>
          ) : (
            <Badge tone="muted">Completed</Badge>
          )}
        </div>
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
          {challenge.description}
        </p>
        {isUpcoming ? (
          <ChallengeStartCountdown
            startDate={challenge.startDate}
            variant="prominent"
            className="mt-3"
            label="Starting in"
          />
        ) : null}
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <CalendarRange className="h-3.5 w-3.5" aria-hidden />
            {challenge.startDate} → {challenge.endDate}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" aria-hidden />
            {challenge.participants.toLocaleString()} joined
          </span>
        </div>
        <div className="mt-4 flex gap-2">
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
