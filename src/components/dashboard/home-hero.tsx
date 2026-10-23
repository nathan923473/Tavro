import { ProgressRing } from "@/components/ui/progress-ring";
import { PrimaryLink } from "@/components/ui/link-button";
import { computeTodayCompletion } from "@/lib/home/today-progress";
import { greetingForTimezone } from "@/lib/home/greeting";
import type { HomePrimaryAction } from "@/lib/home/primary-action";
import type { ChallengeParticipantHub } from "@/lib/data/challenge-participant-hub";
import type { AccountabilityGroup, PersonalGoal } from "@/types";
import { workTowardsLabel } from "@/lib/member/preferences";
import type { WorkTowards } from "@/lib/member/preferences";
import Link from "next/link";

export function HomeHero({
  firstName,
  timezone,
  goals,
  group,
  activeChallengeHub,
  primaryAction,
  loggedIn,
  viewerUserId,
  workTowards = null,
}: {
  firstName: string;
  timezone: string | null;
  goals: PersonalGoal[];
  group: AccountabilityGroup | null;
  activeChallengeHub: ChallengeParticipantHub | null;
  primaryAction: HomePrimaryAction;
  loggedIn: boolean;
  viewerUserId: string | null;
  workTowards?: WorkTowards | null;
}) {
  const greeting = greetingForTimezone(timezone);
  const today = computeTodayCompletion({
    goals,
    activeChallengeHub,
    group,
    viewerUserId,
  });

  const focusLine = workTowards
    ? `Working toward ${workTowardsLabel(workTowards).toLowerCase()}`
    : activeChallengeHub?.phase === "active"
      ? activeChallengeHub.title
      : group?.sharedGoal?.trim() || null;

  const statusLine = primaryAction.allComplete
    ? "You showed up today — momentum saved."
    : today.hasPlan
      ? `${today.done} of ${today.total} daily items complete`
      : "Set up habits or join a challenge to build your day.";

  return (
    <section
      aria-labelledby="home-hero-heading"
      className="surface-hero relative overflow-hidden px-4 py-4 text-primary-foreground"
    >
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent/25 blur-2xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 h-24 w-full bg-gradient-to-t from-black/10 to-transparent"
        aria-hidden
      />

      <div className="relative flex gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-caption text-white/85">{greeting}</p>
          <h2 id="home-hero-heading" className="text-title-lg text-white">
            {firstName}
          </h2>
          {focusLine ? (
            <p className="text-sm font-medium leading-snug text-white/95 line-clamp-2">
              {focusLine}
            </p>
          ) : null}
          <p className="text-sm text-white/85">{statusLine}</p>

          {loggedIn && today.segments.length > 0 ? (
            <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-white/90">
              {today.segments.map((s) => (
                <li key={s.id}>
                  <span className="font-medium">{s.label}</span>{" "}
                  <span className="tabular-nums">
                    {s.done}/{s.total}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {loggedIn ? (
          <ProgressRing
            value={today.hasPlan ? today.percent : 0}
            onDark
            size={92}
            label={`Today's progress ${today.percent} percent`}
          />
        ) : null}
      </div>

      <div className="relative mt-4 space-y-2">
        {loggedIn ? (
          <PrimaryLink
            href={primaryAction.href}
            fullWidth
            className="rounded-2xl bg-surface text-primary shadow-elevated hover:bg-surface/95"
          >
            {primaryAction.label}
          </PrimaryLink>
        ) : (
          <PrimaryLink href="/login" fullWidth className="rounded-2xl bg-surface text-primary">
            Log in to continue
          </PrimaryLink>
        )}

        {loggedIn && !today.hasPlan ? (
          <p className="text-center text-xs text-white/80">
            <Link href="/progress" className="underline underline-offset-2">
              Add habits
            </Link>
            {" · "}
            <Link href="/challenges" className="underline underline-offset-2">
              Join a challenge
            </Link>
          </p>
        ) : null}
      </div>
    </section>
  );
}
