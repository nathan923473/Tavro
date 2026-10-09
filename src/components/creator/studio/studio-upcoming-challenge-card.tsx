import { Card } from "@/components/ui/card";
import { formatCompactCountdownToStart } from "@/lib/timezone/format";
import { resolveChallengeStartAt } from "@/lib/timezone/challenge-fields";
import type { CreatorStudioChallenge } from "@/types/creator-studio";
import Link from "next/link";

export function StudioUpcomingChallengeCard({
  challenge,
}: {
  challenge: CreatorStudioChallenge;
}) {
  const startAt = resolveChallengeStartAt({
    start_date: challenge.startDate,
    start_at: challenge.startAt ?? null,
    challenge_timezone: challenge.challengeTimezone ?? null,
  });
  const countdown = formatCompactCountdownToStart(startAt);

  return (
    <Card className="space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            Upcoming challenge
          </p>
          <p className="mt-1 font-semibold">{challenge.title}</p>
          <p className="text-xs text-muted-foreground">
            Starts {challenge.startDate} · {countdown}
          </p>
          <p className="text-xs tabular-nums text-muted-foreground">
            {challenge.participantCount} registered
          </p>
        </div>
      </div>
      <Link
        href={`/studio/challenges/${challenge.id}`}
        className="inline-flex min-h-10 items-center text-sm font-semibold text-primary"
      >
        Manage challenge →
      </Link>
    </Card>
  );
}
