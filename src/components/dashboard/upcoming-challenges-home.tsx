import { ChallengeDateRange } from "@/components/challenges/challenge-date-range";
import { ChallengeStartCountdown } from "@/components/challenges/challenge-start-countdown";
import { Card } from "@/components/ui/card";
import { challengePhaseFromInstants } from "@/lib/timezone/challenge-calendar";
import { resolveChallengeEndAt, resolveChallengeStartAt } from "@/lib/timezone/challenge-fields";
import type { Challenge } from "@/types";
import Link from "next/link";

export function UpcomingChallengesHome({ challenges }: { challenges: Challenge[] }) {
  const upcoming = challenges.filter((c) => {
    if (!c.startAt || !c.endAt) return c.startDate > new Date().toISOString().slice(0, 10);
    const start = resolveChallengeStartAt({
      start_date: c.startDate,
      start_at: c.startAt,
      challenge_timezone: c.challengeTimezone ?? null,
    });
    const end = resolveChallengeEndAt({
      end_date: c.endDate,
      end_at: c.endAt,
      challenge_timezone: c.challengeTimezone ?? null,
    });
    return challengePhaseFromInstants(start, end) === "upcoming";
  });

  if (!upcoming.length) return null;

  return (
    <section aria-labelledby="upcoming-challenges-home-heading">
      <h2 id="upcoming-challenges-home-heading" className="mb-2 px-1 text-base font-semibold">
        Your upcoming challenges
      </h2>
      <ul className="space-y-2">
        {upcoming.map((c) => (
          <li key={c.id}>
            <Card padding="sm" className="space-y-2">
              <p className="font-semibold">{c.title}</p>
              <p className="text-xs text-muted-foreground">
                <ChallengeDateRange
                  startDate={c.startDate}
                  endDate={c.endDate}
                  challengeTimezone={c.challengeTimezone}
                />
              </p>
              <ChallengeStartCountdown
                startAt={c.startAt}
                startDate={c.startDate}
                challengeTimezone={c.challengeTimezone}
                variant="inline"
              />
              <Link
                href={`/challenges/${c.id}`}
                className="flex min-h-10 items-center justify-center rounded-xl border border-border text-sm font-semibold"
              >
                View preparation
              </Link>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}
