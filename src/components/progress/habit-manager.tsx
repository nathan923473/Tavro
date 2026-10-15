"use client";

import {
  deleteHabitAction,
  linkHabitToChallengeAction,
  pauseHabitAction,
  setHabitGroupShareAction,
  updateHabitAction,
} from "@/app/(app)/progress/actions";
import type { UserAccountabilityGroupOption } from "@/lib/data/user-accountability-groups";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { HabitQuickAdd } from "@/components/progress/habit-quick-add";
import { HabitSchedulePicker } from "@/components/progress/habit-schedule-picker";
import {
  formatReminderTimeLocal,
  formatScheduleDaysLabel,
  popcountDays,
  reminderTimeForInput,
} from "@/lib/habits/weekdays";
import type { Challenge } from "@/types";
import type { PersonalGoal } from "@/types";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function HabitManager({
  habits,
  joinedChallenges,
  accountabilityGroups = [],
}: {
  habits: PersonalGoal[];
  joinedChallenges: Challenge[];
  accountabilityGroups?: UserAccountabilityGroupOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(
    null,
  );
  const [editMask, setEditMask] = useState(127);
  const [editTime, setEditTime] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  function openScheduleEdit(habit: PersonalGoal) {
    setEditingScheduleId(habit.id);
    setEditMask(habit.scheduleDaysMask);
    setEditTime(reminderTimeForInput(habit.reminderTimeLocal));
  }

  return (
    <section aria-labelledby="habits-manage-heading">
      <h2 id="habits-manage-heading" className="mb-2 px-1 text-base font-semibold">
        My habits & goals
      </h2>
      <Card className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Small, sustainable habits beat perfect streaks. Choose 3–5 to start; pause
          anytime and pick up after a missed day — no calorie counting or medical targets.
        </p>
        <HabitQuickAdd compact allowExpandAllPresets />
      </Card>

      <ul className="mt-3 space-y-2">
        {habits.map((habit) => (
          <li key={habit.id}>
            <Card padding="sm" className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{habit.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatScheduleDaysLabel(habit.scheduleDaysMask)}
                    {habit.frequencyType === "times_per_week"
                      ? ` · ${habit.frequencyTarget}×/week`
                      : null}{" "}
                    · {habit.weeklyCompletion}/
                    {habit.frequencyType === "times_per_week"
                      ? habit.frequencyTarget
                      : popcountDays(habit.scheduleDaysMask)}{" "}
                    this week
                    {habit.reminderTimeLocal
                      ? ` · ${formatReminderTimeLocal(habit.reminderTimeLocal)}`
                      : ""}
                    {habit.paused ? " · paused" : ""}
                  </p>
                </div>
                {confirmDeleteId === habit.id ? (
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <p className="text-xs font-medium text-red-600">Delete this habit?</p>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        className="min-h-8 px-2 text-xs"
                        disabled={pending}
                        onClick={() => setConfirmDeleteId(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        className="min-h-8 px-2 text-xs text-red-600"
                        disabled={pending}
                        onClick={() =>
                          startTransition(async () => {
                            await deleteHabitAction(habit.id);
                            setConfirmDeleteId(null);
                            router.refresh();
                          })
                        }
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={pending}
                    className="shrink-0 text-muted-foreground"
                    aria-label="Remove habit"
                    onClick={() => setConfirmDeleteId(habit.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
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
                  <option value="daily">Every day</option>
                  <option value="times_per_week">Times per week</option>
                </select>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-9 text-xs"
                  disabled={pending}
                  onClick={() =>
                    editingScheduleId === habit.id
                      ? setEditingScheduleId(null)
                      : openScheduleEdit(habit)
                  }
                >
                  {editingScheduleId === habit.id ? "Close" : "Days & time"}
                </Button>
              </div>
              {editingScheduleId === habit.id ? (
                <div className="rounded-xl border border-border/80 bg-muted/20 p-3">
                  <HabitSchedulePicker
                    compact
                    scheduleDaysMask={editMask}
                    onScheduleDaysMaskChange={setEditMask}
                    reminderTime={editTime}
                    onReminderTimeChange={setEditTime}
                  />
                  <Button
                    type="button"
                    className="mt-3 min-h-9 w-full text-xs"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await updateHabitAction(habit.id, {
                          scheduleDaysMask: editMask,
                          reminderTimeLocal: editTime || null,
                        });
                        setEditingScheduleId(null);
                        router.refresh();
                      })
                    }
                  >
                    Save days & time
                  </Button>
                </div>
              ) : null}
              {accountabilityGroups.length > 0 ? (
                <label className="block text-xs">
                  <span className="text-muted-foreground">
                    Accountability group visibility (shown to your group; choose Keep private to
                    hide)
                  </span>
                  <select
                    className="mt-1 w-full rounded-xl border border-border px-2 py-2 text-sm"
                    value={habit.sharedGroupId ?? ""}
                    disabled={pending}
                    onChange={(e) =>
                      startTransition(async () => {
                        const v = e.target.value;
                        await setHabitGroupShareAction({
                          habitId: habit.id,
                          groupId: v ? v : null,
                        });
                        router.refresh();
                      })
                    }
                  >
                    <option value="">Keep private</option>
                    {accountabilityGroups.map((g) => (
                      <option key={g.id} value={g.id}>
                        Share with {g.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
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
