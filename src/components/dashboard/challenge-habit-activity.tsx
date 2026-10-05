"use client";

import { toggleGoalAction } from "@/app/(app)/member/actions";
import { Card } from "@/components/ui/card";
import type { Challenge } from "@/types";
import type { PersonalGoal } from "@/types";
import { Circle, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function ChallengeHabitActivity({
  challenges,
  linkedHabits,
  loggedIn,
}: {
  challenges: Challenge[];
  linkedHabits: PersonalGoal[];
  loggedIn: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const active = challenges.filter((c) => c.joined);
  if (active.length === 0) return null;

  return (
    <section aria-labelledby="challenge-activity-heading">
      <h2 id="challenge-activity-heading" className="mb-2 px-1 text-base font-semibold">
        Current creator challenge
      </h2>
      <ul className="space-y-3">
        {active.slice(0, 2).map((challenge) => {
          const linked = linkedHabits.find(
            (h) => h.linkedChallengeId === challenge.id,
          );
          return (
            <li key={challenge.id}>
              <Card>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {challenge.creatorName}&apos;s challenge
                </p>
                <h3 className="font-semibold">{challenge.title}</h3>
                {linked ? (
                  <button
                    type="button"
                    disabled={pending || !loggedIn}
                    className="mt-3 flex w-full items-center gap-3 rounded-xl border border-border px-3 py-3 text-left"
                    onClick={() =>
                      startTransition(async () => {
                        await toggleGoalAction(linked.id);
                        router.refresh();
                      })
                    }
                  >
                    {linked.completedToday ? (
                      <Check className="h-5 w-5 text-primary" aria-hidden />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" aria-hidden />
                    )}
                    <span className="text-sm">
                      Today&apos;s activity: {linked.title}
                    </span>
                  </button>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Link a habit on{" "}
                    <Link href="/progress" className="font-medium text-primary">
                      Progress
                    </Link>{" "}
                    to complete challenge activities from Home.
                  </p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  Challenge progress: {challenge.progressPercent}%
                </p>
              </Card>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
