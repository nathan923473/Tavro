"use client";

import { ProgressRing } from "@/components/ui/progress-ring";
import { PrimaryLink } from "@/components/ui/link-button";
import {
  applyHabitOverrides,
  getHabitOverrideSnapshot,
  getServerHabitOverrideSnapshot,
  subscribeHabitOverrides,
} from "@/lib/home/habit-overrides";
import { computeTodayCompletion } from "@/lib/home/today-progress";
import { greetingForTimezone } from "@/lib/home/greeting";
import type { HomePrimaryAction } from "@/lib/home/primary-action";
import type { ChallengeParticipantHub } from "@/lib/data/challenge-participant-hub";
import type { AccountabilityGroup, PersonalGoal } from "@/types";
import { workTowardsLabel } from "@/lib/member/preferences";
import type { WorkTowards } from "@/lib/member/preferences";
import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";

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
  const habitSnapshot = useSyncExternalStore(
    subscribeHabitOverrides,
    getHabitOverrideSnapshot,
    getServerHabitOverrideSnapshot,
  );
  const goalsForToday = useMemo(
    () => applyHabitOverrides(goals, habitSnapshot.overrides),
    [goals, habitSnapshot.overrides],
  );

  const greeting = greetingForTimezone(timezone);
  const today = computeTodayCompletion({
    goals: goalsForToday,
    activeChallengeHub,
    group,
    viewerUserId,
  });

  const focusLine = workTowards
    ? `Working toward ${workTowardsLabel(workTowards).toLowerCase()}`
    : activeChallengeHub?.phase === "active"
      ? activeChallengeHub.title
      : group?.sharedGoal?.trim() || null;

  const showedUp = today.hasPlan && today.done === today.total;
  const statusLine = showedUp
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
        className="pointer-events-none absolute -left-16 -top-16 h-32 w-32 rounded-full bg-white/10 blur-2xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 h-24 w-full bg-gradient-to-t from-black/10 to-transparent"
        aria-hidden
      />

      <div className="relative flex gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-medium text-white">{greeting}</p>
          <h2 id="home-hero-heading" className="text-2xl font-bold tracking-tight text-white">
            {firstName}
          </h2>
          {focusLine ? (
            <p className="line-clamp-2 text-sm font-semibold leading-snug text-white">
              {focusLine}
            </p>
          ) : null}
          <p className="text-sm font-medium text-white">{statusLine}</p>

          {loggedIn && today.segments.length > 0 ? (
            <ul className="flex flex-wrap gap-x-3 gap-y-1 text-sm font-medium text-white">
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
          <p className="text-center text-sm font-medium text-white">
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
