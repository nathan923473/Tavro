"use client";

import { toggleGoalAction } from "@/app/(app)/member/actions";
import { cn } from "@/lib/cn";
import { HabitQuickAdd } from "@/components/progress/habit-quick-add";
import { Card } from "@/components/ui/card";
import type { ChallengeParticipantHub } from "@/lib/data/challenge-participant-hub";
import { habitsScheduledToday } from "@/lib/habits/schedule";
import { formatReminderTimeLocal } from "@/lib/habits/weekdays";
import { habitsCompletedToday } from "@/lib/progress/consistency";
import type { AccountabilityGroup, PersonalGoal } from "@/types";
import { Check, Circle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

type GoalRow =
  | {
      kind: "habit";
      id: string;
      label: string;
      timeHint: string | null;
      done: boolean;
      goalId: string;
    }
  | { kind: "challenge"; id: string; label: string; done: boolean; href: string }
  | { kind: "group"; id: string; label: string; done: boolean; href: string };

export function TodaysGoals({
  goals,
  group,
  activeChallengeHub,
  viewerUserId,
  loggedIn,
}: {
  goals: PersonalGoal[];
  group: AccountabilityGroup | null;
  activeChallengeHub: ChallengeParticipantHub | null;
  viewerUserId: string | null;
  loggedIn: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [pulseGoalId, setPulseGoalId] = useState<string | null>(null);

  const scheduled = habitsScheduledToday(goals);
  const { done: habitsDone, total: habitsTotal } = habitsCompletedToday(goals);

  const rows = useMemo((): GoalRow[] => {
    const list: GoalRow[] = [];

    for (const g of scheduled) {
      list.push({
        kind: "habit",
        id: `habit-${g.id}`,
        label: g.title,
        timeHint: formatReminderTimeLocal(g.reminderTimeLocal),
        done: g.completedToday,
        goalId: g.id,
      });
    }

    if (activeChallengeHub?.phase === "active" && !activeChallengeHub.isRestDay) {
      for (const a of activeChallengeHub.todayActivities) {
        list.push({
          kind: "challenge",
          id: `challenge-${a.key}`,
          label: a.title,
          done: a.completed,
          href: `/challenges/${activeChallengeHub.challengeId}?tab=today`,
        });
      }
    }

    if (group && viewerUserId && group.viewerScheduledToday) {
      const viewerRow = group.checkInBoard.find((m) => m.userId === viewerUserId);
      const checkedIn = Boolean(viewerRow?.checkedIn);
      list.push({
        kind: "group",
        id: "group-check-in",
        label: "Check in with your accountability group",
        done: checkedIn,
        href: "/groups",
      });
    }

    return list;
  }, [scheduled, activeChallengeHub, group, viewerUserId]);

  const doneCount = rows.filter((r) => r.done).length;
  const totalCount = rows.length;

  if (!loggedIn) {
    return (
      <Card>
        <h2 className="font-semibold">Today&apos;s goals</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Log in to see habits, challenge activities and group check-ins for today.
        </p>
      </Card>
    );
  }

  if (goals.filter((g) => !g.paused).length === 0 && rows.length === 0) {
    return (
      <section aria-labelledby="todays-goals-empty">
        <h2 id="todays-goals-empty" className="mb-2 px-1 text-base font-semibold">
          Today&apos;s goals
        </h2>
        <Card className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Add a small habit or join a creator challenge — your daily list will show up here.
          </p>
          <HabitQuickAdd compact showProgressLink />
        </Card>
      </section>
    );
  }

  return (
    <section aria-labelledby="todays-goals-heading">
      <div className="mb-2 flex items-end justify-between gap-2 px-1">
        <h2 id="todays-goals-heading" className="text-title">
          Today&apos;s goals
        </h2>
        {totalCount > 0 ? (
          <p className="text-sm font-medium text-primary tabular-nums">
            {doneCount} of {totalCount} done
          </p>
        ) : null}
      </div>
      {totalCount > 0 ? (
        <div className="mb-2 px-1">
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{
                width: `${Math.round((doneCount / totalCount) * 100)}%`,
              }}
            />
          </div>
        </div>
      ) : null}

      {rows.length === 0 ? (
        <Card padding="sm">
          <p className="text-sm text-muted-foreground">
            Nothing scheduled today — rest day or weekly targets already met. Small steps still
            count when you&apos;re ready.
          </p>
        </Card>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={row.id}>
              <Card
                padding="sm"
                className={
                  row.done ||
                  (row.kind === "habit" && pulseGoalId === row.goalId)
                    ? cn(
                        "border-accent bg-mint-subtle/20",
                        row.kind === "habit" &&
                          pulseGoalId === row.goalId &&
                          "animate-success-pulse",
                      )
                    : undefined
                }
              >
                {row.kind === "habit" ? (
                  <button
                    type="button"
                    disabled={pending}
                    className="focus-ring flex min-h-11 w-full items-center gap-3 rounded-xl text-left"
                    onClick={() =>
                      startTransition(async () => {
                        const wasDone = row.done;
                        await toggleGoalAction(row.goalId);
                        if (!wasDone) {
                          setPulseGoalId(row.goalId);
                          window.setTimeout(() => setPulseGoalId(null), 600);
                        }
                        router.refresh();
                      })
                    }
                  >
                    {row.done ? (
                      <Check className="h-5 w-5 shrink-0 text-foreground" aria-hidden />
                    ) : (
                      <Circle className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                    )}
                    <span className="flex-1 text-sm font-medium">
                      {row.label}
                      {row.timeHint ? (
                        <span className="block text-xs font-normal text-muted-foreground">
                          {row.timeHint}
                        </span>
                      ) : null}
                    </span>
                  </button>
                ) : (
                  <Link
                    href={row.href}
                    className="flex items-center gap-3"
                  >
                    {row.done ? (
                      <Check className="h-5 w-5 shrink-0 text-foreground" aria-hidden />
                    ) : (
                      <Circle className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                    )}
                    <span className="flex-1 text-sm font-medium">{row.label}</span>
                    {!row.done ? (
                      <span className="text-xs font-semibold text-primary">Open</span>
                    ) : null}
                  </Link>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}

      {habitsTotal > 0 && habitsDone === habitsTotal && rows.some((r) => r.kind === "habit") ? (
        <p className="mt-2 px-1 text-sm text-muted-foreground">
          Habits done for today — missing a day doesn&apos;t erase your progress; pick up when you
          can.
        </p>
      ) : null}

      <p className="mt-2 px-1">
        <Link href="/progress#habits-manage-heading" className="text-sm font-medium text-primary">
          Manage habits
        </Link>
      </p>
    </section>
  );
}
