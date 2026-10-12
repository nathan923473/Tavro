"use client";

import {
  deleteHabitAction,
  linkHabitToChallengeAction,
  pauseHabitAction,
  setHabitGroupShareAction,
  updateHabitAction,
} from "@/app/(app)/progress/actions";
import { toggleGoalAction } from "@/app/(app)/member/actions";
import { AddHabitSheet } from "@/components/progress/add-habit-sheet";
import { HabitSchedulePicker } from "@/components/progress/habit-schedule-picker";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { habitScheduleSummary, scheduledDaysPerWeek } from "@/lib/habits/schedule";
import { habitsCompletedToday } from "@/lib/progress/consistency";
import type { Challenge, PersonalGoal } from "@/types";
import { Check, Circle, Pencil, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";

export function HabitManager({
  habits,
  joinedChallenges,
  accountabilityGroup,
}: {
  habits: PersonalGoal[];
  joinedChallenges: Challenge[];
  accountabilityGroup: { id: string; name: string } | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const closeSheet = useCallback(() => setSheetOpen(false), []);

  const active = habits.filter((habit) => !habit.paused);
  const paused = habits.filter((habit) => habit.paused);
  const { done, total } = habitsCompletedToday(habits);
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  function run(action: () => Promise<void>, fallback: string) {
    startTransition(async () => {
      try {
        setMessage(null);
        await action();
        router.refresh();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : fallback);
      }
    });
  }

  return (
    <section aria-labelledby="habits-manage-heading">
      <h2 id="habits-manage-heading" className="mb-2 px-1 text-base font-semibold">
        My habits & goals
      </h2>
      <Card className="space-y-3">
        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium">Today</p>
            <p className="text-sm font-medium text-primary tabular-nums">
              {total === 0 ? "Nothing scheduled" : `${done} of ${total}`}
            </p>
          </div>
          <div
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={Math.max(total, 1)}
            aria-valuenow={done}
            aria-label={
              total === 0
                ? "No habits scheduled today"
                : `${done} of ${total} habits completed today`
            }
          >
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {message ? (
          <p className="text-sm text-red-600" role="alert">
            {message}
          </p>
        ) : null}

        {habits.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No habits yet. Add one to start tracking.
          </p>
        ) : (
          <ul className="space-y-1">
            {active.map((habit) => (
              <HabitRow
                key={habit.id}
                habit={habit}
                pending={pending}
                editing={editingId === habit.id}
                joinedChallenges={joinedChallenges}
                onToggleEdit={() =>
                  setEditingId((current) => (current === habit.id ? null : habit.id))
                }
                onToggleComplete={() =>
                  run(() => toggleGoalAction(habit.id), "Could not update habit.")
                }
                onPause={(next) =>
                  run(() => pauseHabitAction(habit.id, next), "Could not update habit.")
                }
                onRemove={() =>
                  run(async () => {
                    await deleteHabitAction(habit.id);
                    setEditingId(null);
                  }, "Could not remove habit.")
                }
                onUpdate={(patch) =>
                  run(() => updateHabitAction(habit.id, patch), "Could not update habit.")
                }
                onLink={(challengeId) =>
                  run(
                    () => linkHabitToChallengeAction(habit.id, challengeId),
                    "Could not link habit.",
                  )
                }
                accountabilityGroup={accountabilityGroup}
                onShare={(groupId) =>
                  run(
                    () => setHabitGroupShareAction(habit.id, groupId),
                    "Could not update sharing.",
                  )
                }
              />
            ))}
          </ul>
        )}

        {paused.length > 0 ? (
          <div className="space-y-1">
            <p className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Paused
            </p>
            <ul className="space-y-1">
              {paused.map((habit) => (
                <HabitRow
                  key={habit.id}
                  habit={habit}
                  pending={pending}
                  editing={editingId === habit.id}
                  joinedChallenges={joinedChallenges}
                  onToggleEdit={() =>
                    setEditingId((current) => (current === habit.id ? null : habit.id))
                  }
                  onToggleComplete={() => undefined}
                  onPause={(next) =>
                    run(() => pauseHabitAction(habit.id, next), "Could not update habit.")
                  }
                  onRemove={() =>
                    run(async () => {
                      await deleteHabitAction(habit.id);
                      setEditingId(null);
                    }, "Could not remove habit.")
                  }
                  onUpdate={(patch) =>
                    run(() => updateHabitAction(habit.id, patch), "Could not update habit.")
                  }
                  onLink={(challengeId) =>
                    run(
                      () => linkHabitToChallengeAction(habit.id, challengeId),
                      "Could not link habit.",
                    )
                  }
                  accountabilityGroup={accountabilityGroup}
                  onShare={(groupId) =>
                    run(
                      () => setHabitGroupShareAction(habit.id, groupId),
                      "Could not update sharing.",
                    )
                  }
                />
              ))}
            </ul>
          </div>
        ) : null}

        <Button fullWidth onClick={() => setSheetOpen(true)}>
          <Plus className="h-4 w-4" aria-hidden />
          Add habit
        </Button>
      </Card>
      <AddHabitSheet
        open={sheetOpen}
        onClose={closeSheet}
        existingTitles={habits.map((habit) => habit.title)}
      />
    </section>
  );
}

function HabitRow({
  habit,
  pending,
  editing,
  joinedChallenges,
  onToggleEdit,
  onToggleComplete,
  onPause,
  onRemove,
  onUpdate,
  onLink,
  accountabilityGroup,
  onShare,
}: {
  habit: PersonalGoal;
  pending: boolean;
  editing: boolean;
  joinedChallenges: Challenge[];
  onToggleEdit: () => void;
  onToggleComplete: () => void;
  onPause: (paused: boolean) => void;
  onRemove: () => void;
  onUpdate: (patch: {
    frequencyType?: "daily" | "times_per_week";
    frequencyTarget?: number;
    scheduleDaysMask?: number;
    reminderTime?: string | null;
  }) => void;
  onLink: (challengeId: string | null) => void;
  accountabilityGroup: { id: string; name: string } | null;
  onShare: (groupId: string | null) => void;
}) {
  const sharedHere =
    accountabilityGroup != null && habit.sharedGroupId === accountabilityGroup.id;
  return (
    <li
      className={cn(
        "rounded-xl",
        habit.completedToday && !habit.paused && "bg-[#B8F4DA]/25",
      )}
    >
      <div className="flex items-center gap-1">
        {habit.paused ? (
          <span className="w-11 shrink-0" aria-hidden />
        ) : (
          <button
            type="button"
            role="checkbox"
            aria-checked={habit.completedToday}
            aria-label={`${habit.completedToday ? "Completed" : "Mark complete"}: ${habit.title}`}
            disabled={pending}
            className="flex h-11 w-11 shrink-0 items-center justify-center"
            onClick={onToggleComplete}
          >
            {habit.completedToday ? (
              <Check className="h-5 w-5 text-[#1B2440]" aria-hidden />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground" aria-hidden />
            )}
          </button>
        )}
        <div className="min-w-0 flex-1 py-2">
          <p className="text-sm font-medium leading-snug">{habit.title}</p>
          <p className="text-xs text-muted-foreground">
            {habit.paused ? "Paused · " : ""}
            {habitScheduleSummary(habit)} · {habit.weeklyCompletion}/
            {scheduledDaysPerWeek(habit)} this week
            {sharedHere ? " · Shared with group" : ""}
          </p>
        </div>
        <button
          type="button"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground"
          aria-label={`Edit ${habit.title}`}
          aria-expanded={editing}
          onClick={onToggleEdit}
        >
          <Pencil className="h-4 w-4" aria-hidden />
        </button>
      </div>
      {editing ? (
        <div className="space-y-3 px-3 pb-3">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="min-h-9 text-xs"
              disabled={pending}
              onClick={() => onPause(!habit.paused)}
            >
              {habit.paused ? "Resume" : "Pause"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-h-9 text-xs"
              disabled={pending}
              onClick={onRemove}
            >
              Remove
            </Button>
            <select
              className="min-h-9 flex-1 rounded-xl border border-border px-2 text-xs"
              value={habit.frequencyType}
              disabled={pending}
              aria-label={`Frequency for ${habit.title}`}
                onChange={(event) => {
                  const frequencyType = event.target.value as "daily" | "times_per_week";
                  onUpdate({
                    frequencyType,
                    frequencyTarget: frequencyType === "daily" ? 7 : 3,
                  });
                }}
            >
              <option value="daily">Daily</option>
              <option value="times_per_week">Times per week</option>
            </select>
          </div>
          {habit.frequencyType === "times_per_week" ? (
            <label className="block text-xs">
              <span className="text-muted-foreground">Times each week</span>
              <select
                className="mt-1 w-full rounded-xl border border-border px-2 py-2 text-sm"
                value={habit.frequencyTarget}
                disabled={pending}
                aria-label={`Times per week for ${habit.title}`}
                onChange={(event) => onUpdate({ frequencyTarget: Number(event.target.value) })}
              >
                {[1, 2, 3, 4, 5, 6, 7].map((count) => (
                  <option key={count} value={count}>
                    {count}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <HabitSchedulePicker
            daysMask={habit.scheduleDaysMask}
            reminderTime={habit.reminderTime ?? ""}
            disabled={pending}
            onDaysMaskChange={(mask) => onUpdate({ scheduleDaysMask: mask })}
            onReminderTimeChange={(time) => onUpdate({ reminderTime: time || null })}
          />
          <label className="block text-xs">
            <span className="text-muted-foreground">Share with accountability group</span>
            <select
              className="mt-1 w-full rounded-xl border border-border px-2 py-2 text-sm"
              value={sharedHere && accountabilityGroup ? accountabilityGroup.id : ""}
              disabled={pending || !accountabilityGroup}
              aria-label={`Share ${habit.title} with accountability group`}
              onChange={(event) => onShare(event.target.value || null)}
            >
              <option value="">Private</option>
              {accountabilityGroup ? (
                <option value={accountabilityGroup.id}>{accountabilityGroup.name}</option>
              ) : null}
            </select>
            <span className="mt-1 block text-muted-foreground">
              {accountabilityGroup
                ? "Private unless you pick your group. Weight and check-in notes stay private."
                : "Join an accountability group to share this habit."}
            </span>
          </label>
          {joinedChallenges.length > 0 ? (
            <label className="block text-xs">
              <span className="text-muted-foreground">Link to challenge (optional)</span>
              <select
                className="mt-1 w-full rounded-xl border border-border px-2 py-2 text-sm"
                value={habit.linkedChallengeId ?? ""}
                disabled={pending}
                onChange={(event) => onLink(event.target.value ? event.target.value : null)}
              >
                <option value="">No linked challenge</option>
                {joinedChallenges.map((challenge) => (
                  <option key={challenge.id} value={challenge.id}>
                    {challenge.title}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}
