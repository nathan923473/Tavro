import { ChallengeCoverImage } from "@/components/challenges/challenge-cover-image";
import { ChallengeDateRange } from "@/components/challenges/challenge-date-range";
import { ChallengeStartCountdown } from "@/components/challenges/challenge-start-countdown";
import { Card } from "@/components/ui/card";
import { creatorChallengePath } from "@/lib/data/creator-studio";
import type { CreatorStudioChallenge } from "@/types/creator-studio";
import Link from "next/link";

export function CurrentChallengeCard({
  challenge,
  communitySlug,
  compact,
}: {
  challenge: CreatorStudioChallenge;
  communitySlug: string | null;
  compact?: boolean;
}) {
  const manageHref = `/studio/challenges/${challenge.id}`;
  const shareHref =
    communitySlug != null
      ? creatorChallengePath(communitySlug, challenge.inviteSlug)
      : `/join/${challenge.inviteSlug}`;

  return (
    <Card className={`overflow-hidden p-0 ${compact ? "border-dashed" : ""}`}>
      <ChallengeCoverImage coverUrl={challenge.coverUrl} title={challenge.title} />
      <div className={compact ? "p-3" : "p-4"}>
      <p className={compact ? "text-sm font-semibold" : "text-lg font-semibold"}>
        {challenge.title}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {challenge.participantCount} participants · {challenge.activeThisWeek} active
        this week
      </p>
      <p className="text-xs text-muted-foreground">
        <ChallengeDateRange startDate={challenge.startDate} endDate={challenge.endDate} />
      </p>
      {challenge.bucket === "upcoming" ? (
        <ChallengeStartCountdown
          startAt={challenge.startAt}
          startDate={challenge.startDate}
          challengeTimezone={challenge.challengeTimezone}
          variant="compact"
          className="mt-2"
          label="Starts in"
        />
      ) : null}
      <div className="mt-3 grid gap-2">
        {challenge.publishStatus !== "draft" ? (
          <Link
            href={`/challenges/${challenge.id}`}
            className="flex min-h-10 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground"
          >
            Open challenge
          </Link>
        ) : null}
        <Link
          href={manageHref}
          className={`flex min-h-10 items-center justify-center rounded-xl text-sm font-semibold ${
            challenge.publishStatus === "draft"
              ? "bg-primary text-primary-foreground"
              : "border border-border"
          }`}
        >
          Manage challenge
        </Link>
        {!compact ? (
          <Link
            href={shareHref}
            className="text-center text-xs font-medium text-primary"
          >
            View public challenge page →
          </Link>
        ) : null}
      </div>
      </div>
    </Card>
  );
}
