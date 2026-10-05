"use client";

import {
  createHabitAction,
  deleteHabitAction,
  linkHabitToChallengeAction,
  pauseHabitAction,
  updateHabitAction,
} from "@/app/(app)/progress/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { HABIT_PRESETS, CUSTOM_HABIT_PRESET_KEY } from "@/lib/habits/presets";
import type { Challenge } from "@/types";
import type { PersonalGoal } from "@/types";
import { Plus, Trash2 } from "lucide-react";
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
  const [customTitle, setCustomTitle] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  return (
    <section aria-labelledby="habits-manage-heading">
      <h2 id="habits-manage-heading" className="mb-2 px-1 text-base font-semibold">
        My habits
      </h2>
      <Card className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Choose 3–5 habits to start. Edit frequency anytime — no medical targets.
        </p>
        <div className="flex flex-wrap gap-2">
          {HABIT_PRESETS.slice(0, 8).map((preset) => (
            <button
              key={preset.key}
              type="button"
              disabled={pending}
              className="rounded-full border border-border px-3 py-1.5 text-xs font-medium"
              onClick={() =>
                startTransition(async () => {
                  try {
                    await createHabitAction({
                      title: preset.label,
                      templateKey: preset.key,
                    });
                    router.refresh();
                  } catch (e) {
                    setMessage(e instanceof Error ? e.message : "Failed");
                  }
                })
              }
            >
              + {preset.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder="Custom habit"
            className="flex-1 rounded-xl border border-border px-3 py-2 text-sm"
          />
          <Button
            type="button"
            variant="secondary"
            disabled={pending || !customTitle.trim()}
            onClick={() =>
              startTransition(async () => {
                try {
                  await createHabitAction({
                    title: customTitle.trim(),
                    templateKey: CUSTOM_HABIT_PRESET_KEY,
                  });
                  setCustomTitle("");
                  router.refresh();
                } catch (e) {
                  setMessage(e instanceof Error ? e.message : "Failed");
                }
              })
            }
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add
          </Button>
        </div>
      </Card>

      <ul className="mt-3 space-y-2">
        {habits.map((habit) => (
          <li key={habit.id}>
            <Card padding="sm" className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{habit.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {habit.frequencyType === "daily"
                      ? "Every day"
                      : `${habit.frequencyTarget}× per week`}{" "}
                    · {habit.weeklyCompletion}/
                    {habit.frequencyType === "daily" ? 7 : habit.frequencyTarget} this week
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
                  <option value="daily">Every day</option>
                  <option value="times_per_week">Times per week</option>
                </select>
              </div>
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
      {message ? (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {message}
        </p>
      ) : null}
    </section>
  );
}
