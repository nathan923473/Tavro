import { ChallengeDateRange } from "@/components/challenges/challenge-date-range";
import { ChallengeStartCountdown } from "@/components/challenges/challenge-start-countdown";
import { Card } from "@/components/ui/card";
import type { ChallengeParticipantHub } from "@/lib/data/challenge-participant-hub";
import { challengePhaseFromChallenge } from "@/lib/timezone/challenge-fields";
import type { WorkTowards } from "@/lib/member/preferences";
import { workTowardsLabel } from "@/lib/member/preferences";
import type { Challenge } from "@/types";
import Link from "next/link";

function phaseOf(c: Challenge): "upcoming" | "active" | "completed" {
  return challengePhaseFromChallenge(c);
}

export function HomeChallengesSection({
  challenges,
  activeHub,
  workTowards = null,
}: {
  challenges: Challenge[];
  activeHub: ChallengeParticipantHub | null;
  workTowards?: WorkTowards | null;
}) {
  const joined = challenges.filter((c) => c.joined);
  const active = joined.filter((c) => phaseOf(c) === "active");
  const upcoming = joined.filter((c) => phaseOf(c) === "upcoming");

  if (!active.length && !upcoming.length) {
    return (
      <section aria-labelledby="home-challenges-empty" className="px-1">
        <h2 id="home-challenges-empty" className="text-base font-semibold">
          Creator challenges
        </h2>
        <Card className="mt-2">
          <p className="text-sm text-muted-foreground">
            {workTowards
              ? `Free creator challenges that fit your focus — ${workTowardsLabel(workTowards).toLowerCase()}.`
              : "Join a free creator challenge for structured daily activities."}
          </p>
          <Link
            href="/challenges"
            className="mt-3 flex min-h-11 w-full items-center justify-center rounded-2xl border border-border bg-secondary text-sm font-semibold"
          >
            Browse challenges
          </Link>
        </Card>
      </section>
    );
  }

  const primaryActive = activeHub ?? null;

  return (
    <section aria-labelledby="home-challenges-heading" className="space-y-3">
      <h2 id="home-challenges-heading" className="px-1 text-base font-semibold">
        Creator challenges
      </h2>

      {primaryActive ? (
        <Card className="space-y-2 border-[#3156E8]/20">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Active · {primaryActive.creatorName}
          </p>
          <p className="font-semibold">{primaryActive.title}</p>
          <p className="text-sm text-muted-foreground">
            Day {primaryActive.dayIndex} of {primaryActive.totalDays} ·{" "}
            {primaryActive.progressPercent}% complete
          </p>
          {primaryActive.isRestDay ? (
            <p className="text-sm">Today: rest day</p>
          ) : primaryActive.todayActivities.length ? (
            <ul className="text-sm text-muted-foreground">
              {primaryActive.todayActivities.slice(0, 3).map((a) => (
                <li key={a.key}>
                  {a.completed ? "✓ " : "○ "}
                  {a.title}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">{primaryActive.todayLabel}</p>
          )}
          <Link
            href={`/challenges/${primaryActive.challengeId}?tab=today`}
            className="flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#3156E8] text-sm font-semibold text-white hover:bg-[#2442C4]"
          >
            Continue challenge
          </Link>
        </Card>
      ) : null}

      {active.length > 1
        ? active
            .filter((c) => c.id !== primaryActive?.challengeId)
            .slice(0, 1)
            .map((c) => (
              <Card key={c.id} padding="sm" className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium">{c.title}</p>
                  <p className="text-xs text-muted-foreground">{c.progressPercent}% progress</p>
                </div>
                <Link
                  href={`/challenges/${c.id}?tab=today`}
                  className="shrink-0 text-sm font-semibold text-[#3156E8]"
                >
                  Open
                </Link>
              </Card>
            ))
        : null}

      {upcoming.length ? (
        <div className="space-y-2">
          <p className="px-1 text-sm font-medium text-muted-foreground">Upcoming</p>
          {upcoming.slice(0, 2).map((c) => (
            <Card key={c.id} padding="sm" className="space-y-2">
              <p className="font-medium">{c.title}</p>
              <p className="text-xs text-muted-foreground">{c.creatorName}</p>
              <ChallengeDateRange
                startDate={c.startDate}
                endDate={c.endDate}
                challengeTimezone={c.challengeTimezone}
              />
              <ChallengeStartCountdown
                startAt={c.startAt}
                startDate={c.startDate}
                challengeTimezone={c.challengeTimezone}
                variant="inline"
              />
              <Link
                href={`/challenges/${c.id}`}
                className="flex min-h-9 items-center justify-center rounded-xl border border-border text-sm font-semibold"
              >
                Prepare
              </Link>
            </Card>
          ))}
        </div>
      ) : null}
    </section>
  );
}
