import { ChallengeDateRange } from "@/components/challenges/challenge-date-range";
import { ChallengeStartCountdown } from "@/components/challenges/challenge-start-countdown";
import { Card } from "@/components/ui/card";
import { challengePhaseFromChallenge } from "@/lib/timezone/challenge-fields";
import type { Challenge } from "@/types";
import Link from "next/link";

export function UpcomingChallengesHome({ challenges }: { challenges: Challenge[] }) {
  const upcoming = challenges.filter(
    (c) => challengePhaseFromChallenge(c) === "upcoming",
  );

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
                Open challenge
              </Link>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}
