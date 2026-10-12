"use client";

import {
  ALL_DAYS_MASK,
  formatReminderTimeLocal,
  normalizeScheduleMask,
  selectedDaysFromMask,
  toggleDayInMask,
  WEEKDAY_SHORT,
} from "@/lib/habits/weekdays";
import { cn } from "@/lib/cn";

type HabitSchedulePickerProps = {
  scheduleDaysMask: number;
  onScheduleDaysMaskChange: (mask: number) => void;
  reminderTime: string;
  onReminderTimeChange: (hhmm: string) => void;
  compact?: boolean;
  className?: string;
};

export function HabitSchedulePicker({
  scheduleDaysMask,
  onScheduleDaysMaskChange,
  reminderTime,
  onReminderTimeChange,
  compact = false,
  className,
}: HabitSchedulePickerProps) {
  const mask = normalizeScheduleMask(scheduleDaysMask);
  const selected = selectedDaysFromMask(mask);

  return (
    <div className={cn("space-y-3", className)}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Which days?
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {WEEKDAY_SHORT.map((label, index) => {
            const on = selected[index];
            return (
              <button
                key={label}
                type="button"
                aria-pressed={on}
                className={cn(
                  "min-h-9 min-w-[2.75rem] rounded-xl border px-2 text-xs font-semibold transition-colors",
                  on
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-surface text-muted-foreground",
                )}
                onClick={() =>
                  onScheduleDaysMaskChange(toggleDayInMask(mask, index))
                }
              >
                {label}
              </button>
            );
          })}
        </div>
        {!selected.some(Boolean) ? (
          <p className="mt-1 text-xs text-red-600">Select at least one day.</p>
        ) : null}
      </div>

      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Reminder time {compact ? "" : "(optional)"}
        </span>
        <div className="mt-2 flex items-center gap-2">
          <input
            type="time"
            value={reminderTime}
            onChange={(e) => onReminderTimeChange(e.target.value)}
            className="min-h-11 flex-1 rounded-xl border border-border bg-surface px-3 text-sm"
          />
          {reminderTime ? (
            <button
              type="button"
              className="text-xs font-medium text-muted-foreground underline-offset-2 hover:underline"
              onClick={() => onReminderTimeChange("")}
            >
              Clear
            </button>
          ) : null}
        </div>
        {!compact ? (
          <p className="mt-1 text-xs text-muted-foreground">
            Shown on Today&apos;s goals for now — push reminders may come later.
            {reminderTime
              ? ` (${formatReminderTimeLocal(`${reminderTime}:00`) ?? reminderTime})`
              : ""}
          </p>
        ) : null}
      </label>
    </div>
  );
}

export const defaultHabitScheduleMask = ALL_DAYS_MASK;
