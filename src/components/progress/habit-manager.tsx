"use client";

import {
  deleteHabitAction,
  linkHabitToChallengeAction,
  pauseHabitAction,
  updateHabitAction,
} from "@/app/(app)/progress/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { HabitQuickAdd } from "@/components/progress/habit-quick-add";
import { HabitSchedulePicker } from "@/components/progress/habit-schedule-picker";
import { habitScheduleSummary, scheduledDaysPerWeek } from "@/lib/habits/schedule";
import type { Challenge } from "@/types";
import type { PersonalGoal } from "@/types";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function HabitManager({
  habits,
  joinedChallenges,
}: {
  habits: PersonalGoal[];
  joinedChallenges: Challenge[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function saveSchedule(
    habitId: string,
    patch: { scheduleDaysMask?: number; reminderTime?: string | null },
  ) {
    startTransition(async () => {
      try {
        setMessage(null);
        await updateHabitAction(habitId, patch);
        router.refresh();
      } catch (e) {
        setMessage(e instanceof Error ? e.message : "Could not update schedule.");
      }
    });
  }

  return (
    <section aria-labelledby="habits-manage-heading">
      <h2 id="habits-manage-heading" className="mb-2 px-1 text-base font-semibold">
        My habits & goals
      </h2>
      <Card className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Add new goals anytime. Choose the days and an optional time, then edit
          or pause below — no medical targets.
        </p>
        <HabitQuickAdd />
        {message ? (
          <p className="text-sm text-red-600" role="alert">
            {message}
          </p>
        ) : null}
      </Card>

      <ul className="mt-3 space-y-2">
        {habits.map((habit) => (
          <li key={habit.id}>
            <Card padding="sm" className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{habit.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {habitScheduleSummary(habit)} · {habit.weeklyCompletion}/
                    {scheduledDaysPerWeek(habit)} this week
                    {habit.paused ? " · paused" : ""}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={pending}
                  className="text-muted-foreground"
                  aria-label="Remove habit"
                  onClick={() =>
                    startTransition(async () => {
                      await deleteHabitAction(habit.id);
                      router.refresh();
                    })
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-9 text-xs"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await pauseHabitAction(habit.id, !habit.paused);
                      router.refresh();
                    })
                  }
                >
                  {habit.paused ? "Resume" : "Pause"}
                </Button>
                <select
                  className="min-h-9 flex-1 rounded-xl border border-border px-2 text-xs"
                  value={habit.frequencyType}
                  disabled={pending}
                  onChange={(e) =>
                    startTransition(async () => {
                      const frequencyType = e.target.value as "daily" | "times_per_week";
                      await updateHabitAction(habit.id, {
                        frequencyType,
                        frequencyTarget: frequencyType === "daily" ? 7 : 3,
                      });
                      router.refresh();
                    })
                  }
                >
                  <option value="daily">Daily</option>
                  <option value="times_per_week">Times per week</option>
                </select>
              </div>
              <HabitSchedulePicker
                daysMask={habit.scheduleDaysMask}
                reminderTime={habit.reminderTime ?? ""}
                disabled={pending}
                onDaysMaskChange={(mask) =>
                  saveSchedule(habit.id, { scheduleDaysMask: mask })
                }
                onReminderTimeChange={(time) =>
                  saveSchedule(habit.id, { reminderTime: time || null })
                }
              />
              {joinedChallenges.length > 0 ? (
                <label className="block text-xs">
                  <span className="text-muted-foreground">Link to challenge (optional)</span>
                  <select
                    className="mt-1 w-full rounded-xl border border-border px-2 py-2 text-sm"
                    value={habit.linkedChallengeId ?? ""}
                    disabled={pending}
                    onChange={(e) =>
                      startTransition(async () => {
                        const v = e.target.value;
                        await linkHabitToChallengeAction(
                          habit.id,
                          v ? v : null,
                        );
                        router.refresh();
                      })
                    }
                  >
                    <option value="">No linked challenge</option>
                    {joinedChallenges.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}
