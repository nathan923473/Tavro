"use client";

import { toggleGoalAction } from "@/app/(app)/member/actions";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { PersonalGoal } from "@/types";
import { Target } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function TodaysGoals({
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
        <h2 className="font-semibold">Today&apos;s goals</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Log in to track goals saved to your account.
        </p>
      </Card>
    );
  }

  if (goals.length === 0) {
    return (
      <Card>
        <h2 className="font-semibold">Today&apos;s goals</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Complete onboarding or add goals from Progress to get started.
        </p>
      </Card>
    );
  }

  return (
    <section aria-labelledby="goals-heading">
      <h2
        id="goals-heading"
        className="mb-2 flex items-center gap-2 px-1 text-base font-semibold"
      >
        <Target className="h-4 w-4 text-primary" aria-hidden />
        Today&apos;s goals
      </h2>
      <ul className="space-y-2">
        {goals.map((goal) => (
          <li key={goal.id}>
            <Card padding="sm">
              <button
                type="button"
                disabled={pending}
                className="flex w-full items-center justify-between gap-3 text-left"
                onClick={() =>
                  startTransition(async () => {
                    await toggleGoalAction(goal.id);
                    router.refresh();
                  })
                }
              >
                <span
                  className={
                    goal.completedToday
                      ? "text-sm font-medium line-through opacity-70"
                      : "text-sm font-medium"
                  }
                >
                  {goal.title}
                </span>
                <Badge tone={goal.completedToday ? "success" : "muted"}>
                  {goal.completedToday ? "Done" : "Tap to complete"}
                </Badge>
              </button>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}
