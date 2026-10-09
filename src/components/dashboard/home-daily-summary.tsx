import { habitsCompletedToday } from "@/lib/progress/consistency";
import { computeTodayAccountabilityStats } from "@/lib/groups/check-in-board-stats";
import { greetingForTimezone } from "@/lib/home/greeting";
import type { HomePrimaryAction } from "@/lib/home/primary-action";
import type { AccountabilityGroup, PersonalGoal } from "@/types";
import Link from "next/link";

export function HomeDailySummary({
  firstName,
  timezone,
  goals,
  group,
  primaryAction,
  loggedIn,
}: {
  firstName: string;
  timezone: string | null;
  goals: PersonalGoal[];
  group: AccountabilityGroup | null;
  primaryAction: HomePrimaryAction;
  loggedIn: boolean;
}) {
  const greeting = greetingForTimezone(timezone);
  const { done, total } = habitsCompletedToday(goals);
  const groupStats = group ? computeTodayAccountabilityStats(group.checkInBoard) : null;

  return (
    <section
      aria-labelledby="home-daily-summary"
      className="relative overflow-hidden rounded-2xl bg-[#3156E8] px-4 py-4 text-white shadow-md shadow-[#3156E8]/25"
    >
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#B8F4DA]/25" aria-hidden />
      <div className="absolute bottom-0 right-0 h-12 w-24 rounded-tl-full bg-white/10" aria-hidden />
      <div className="relative space-y-3">
        <div>
          <p id="home-daily-summary" className="text-sm text-white/90">
            {greeting}, {firstName}
          </p>
          <p className="text-base font-semibold leading-snug">
            {primaryAction.allComplete
              ? "Nice work — you showed up today."
              : "Keep your momentum going."}
          </p>
        </div>

        {loggedIn ? (
          <ul className="space-y-1 text-sm text-white/95">
            <li>
              Today&apos;s progress:{" "}
              <span className="font-semibold tabular-nums">
                {total > 0 ? `${done} of ${total} habits completed` : "No habits scheduled today"}
              </span>
            </li>
            {groupStats && groupStats.scheduledCount > 0 ? (
              <li>
                Group check-ins:{" "}
                <span className="font-semibold tabular-nums">
                  {groupStats.checkedInCount} of {groupStats.scheduledCount} members checked in
                </span>
              </li>
            ) : group ? (
              <li className="text-white/80">No group check-ins scheduled today</li>
            ) : null}
          </ul>
        ) : (
          <p className="text-sm text-white/90">Log in to see your personalised dashboard.</p>
        )}

        <Link
          href={primaryAction.href}
          className="flex min-h-11 w-full items-center justify-center rounded-2xl bg-white text-sm font-semibold text-[#3156E8] hover:bg-white/90"
        >
          {primaryAction.label}
        </Link>

        {!loggedIn ? null : total === 0 && !group ? (
          <p className="text-center text-xs text-white/80">
            <Link href="/progress" className="underline underline-offset-2">
              Add a goal
            </Link>
            {" · "}
            <Link href="/challenges" className="underline underline-offset-2">
              Join a challenge
            </Link>
            {" · "}
            <Link href="/groups" className="underline underline-offset-2">
              Start a group
            </Link>
          </p>
        ) : null}
      </div>
    </section>
  );
}
