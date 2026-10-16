"use client";

import {
  setHabitGroupShareAction,
  unlinkHabitFromGroupAction,
} from "@/app/(app)/progress/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { PersonalGoal } from "@/types";
import { Link2, Unlink } from "lucide-react";
import { useMemo } from "react";

export function GroupHabitLinksPanel({
  groupId,
  groupName,
  habits,
  pending,
  run,
}: {
  groupId: string;
  groupName: string;
  habits: PersonalGoal[];
  pending: boolean;
  run: (action: () => Promise<unknown>) => void;
}) {
  const activeHabits = useMemo(
    () => habits.filter((h) => !h.paused),
    [habits],
  );

  const linkedHere = useMemo(
    () => activeHabits.filter((h) => h.sharedGroupId === groupId),
    [activeHabits, groupId],
  );

  const linkable = useMemo(
    () => activeHabits.filter((h) => h.sharedGroupId !== groupId),
    [activeHabits, groupId],
  );

  return (
    <Card className="space-y-3 border-primary/15">
      <div className="flex items-start gap-2">
        <Link2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
        <div>
          <h3 className="font-semibold">Link Progress habits to this group</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Daily check-offs from Progress show in <strong className="font-medium text-foreground">Shared commitments</strong>{" "}
            above. Linking here does <strong className="font-medium text-foreground">not</strong> add a weekly
            target — use the section below for that.
          </p>
        </div>
      </div>

      {activeHabits.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Add habits on the Progress tab first, then link them here.
        </p>
      ) : null}

      {linkedHere.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Linked to {groupName}
          </p>
          <ul className="space-y-2">
            {linkedHere.map((habit) => (
              <li
                key={habit.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary/25 bg-primary/5 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{habit.title}</p>
                  <p className="text-xs text-muted-foreground">Daily · synced from Progress</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-9 gap-1 text-xs"
                  disabled={pending}
                  onClick={() =>
                    run(() => unlinkHabitFromGroupAction(habit.id, groupId))
                  }
                >
                  <Unlink className="h-3.5 w-3.5" aria-hidden />
                  Unlink
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {linkable.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {linkedHere.length ? "Link another habit" : "Your Progress habits"}
          </p>
          <ul className="space-y-2">
            {linkable.map((habit) => {
              const onOtherGroup = Boolean(
                habit.sharedGroupId && habit.sharedGroupId !== groupId,
              );
              return (
                <li
                  key={habit.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{habit.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {onOtherGroup
                        ? "Currently shared with another group — linking here moves it"
                        : "Not shared with this group"}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    className="min-h-9 gap-1 text-xs"
                    disabled={pending}
                    onClick={() =>
                      run(() =>
                        setHabitGroupShareAction({
                          habitId: habit.id,
                          groupId,
                        }),
                      )
                    }
                  >
                    <Link2 className="h-3.5 w-3.5" aria-hidden />
                    Link
                  </Button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : activeHabits.length > 0 && linkedHere.length === activeHabits.length ? (
        <p className="text-sm text-muted-foreground">
          All active habits are linked to this group.
        </p>
      ) : null}
    </Card>
  );
}
