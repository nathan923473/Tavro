"use client";

import { toggleGoalAction } from "@/app/(app)/member/actions";
import { HabitQuickAdd } from "@/components/progress/habit-quick-add";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { habitsCompletedToday } from "@/lib/progress/consistency";
import type { PersonalGoal } from "@/types";
import { Check, Circle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function TodaysHabits({
  goals,
  loggedIn,
}: {
  goals: PersonalGoal[];
  loggedIn: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (!loggedIn) {
    return (
      <Card>
        <h2 className="font-semibold">Today&apos;s habits</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Log in to track habits saved to your account.
        </p>
      </Card>
    );
  }

  const active = goals.filter((g) => !g.paused);
  const { done, total } = habitsCompletedToday(goals);

  if (active.length === 0) {
    return (
      <section aria-labelledby="habits-empty-heading">
        <h2 id="habits-empty-heading" className="mb-2 px-1 text-base font-semibold">
          Today&apos;s habits
        </h2>
        <Card className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Create goals here — they show up on Home each day. You can also pick
            habits in{" "}
            <Link href="/onboarding" className="font-medium text-primary">
              onboarding
            </Link>
            .
          </p>
          <HabitQuickAdd compact showProgressLink />
        </Card>
      </section>
    );
  }

  return (
    <section aria-labelledby="habits-heading">
      <div className="mb-2 flex items-end justify-between gap-2 px-1">
        <h2 id="habits-heading" className="text-base font-semibold">
          Today&apos;s habits
        </h2>
        <p className="text-sm font-medium text-primary tabular-nums">
          {done} of {total} completed
        </p>
      </div>
      <div className="mb-2 px-1">
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{
              width: `${total === 0 ? 0 : Math.round((done / total) * 100)}%`,
            }}
          />
        </div>
      </div>
      <p className="mb-2 px-1">
        <Link
          href="/progress#habits-manage-heading"
          className="text-sm font-medium text-primary"
        >
          Add or edit goals
        </Link>
      </p>
      <ul className="space-y-2">
        {active.map((goal) => (
          <li key={goal.id}>
            <Card padding="sm">
              <button
                type="button"
                disabled={pending}
                className="flex w-full items-center gap-3 text-left"
                onClick={() =>
                  startTransition(async () => {
                    await toggleGoalAction(goal.id);
                    router.refresh();
                  })
                }
              >
                {goal.completedToday ? (
                  <Check className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                ) : (
                  <Circle className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                )}
                <span
                  className={
                    goal.completedToday
                      ? "flex-1 text-sm font-medium line-through opacity-70"
                      : "flex-1 text-sm font-medium"
                  }
                >
                  {goal.title}
                </span>
              </button>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}
