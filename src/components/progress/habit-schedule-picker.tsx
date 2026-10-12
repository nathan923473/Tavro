"use client";

import {
  ALL_WEEKDAYS_MASK,
  WEEKDAY_OPTIONS,
  habitDaysLabel,
} from "@/lib/habits/schedule";
import { cn } from "@/lib/cn";

type HabitSchedulePickerProps = {
  daysMask: number;
  reminderTime: string;
  onDaysMaskChange: (mask: number) => void;
  onReminderTimeChange: (value: string) => void;
  disabled?: boolean;
};

export function HabitSchedulePicker({
  daysMask,
  reminderTime,
  onDaysMaskChange,
  onReminderTimeChange,
  disabled = false,
}: HabitSchedulePickerProps) {
  const mask = daysMask >= 1 && daysMask <= ALL_WEEKDAYS_MASK ? daysMask : ALL_WEEKDAYS_MASK;

  function toggleDay(bit: number) {
    const next = mask & bit ? mask & ~bit : mask | bit;
    if (next < 1) return;
    onDaysMaskChange(next);
  }

  return (
    <div className="space-y-2">
      <div>
        <p className="mb-1.5 text-sm font-medium">Days</p>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Days">
          {WEEKDAY_OPTIONS.map((day) => {
            const selected = (mask & day.bit) !== 0;
            return (
              <button
                key={day.full}
                type="button"
                disabled={disabled}
                aria-pressed={selected}
                aria-label={day.full}
                className={cn(
                  "min-h-11 min-w-11 rounded-full px-2 text-xs font-semibold disabled:opacity-50",
                  selected
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-foreground",
                )}
                onClick={() => toggleDay(day.bit)}
              >
                {day.label}
              </button>
            );
          })}
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">{habitDaysLabel(mask)}</p>
      </div>
      <label className="block text-sm">
        <span className="font-medium">Time (optional)</span>
        <span className="mt-1.5 flex items-center gap-2">
          <input
            type="time"
            value={reminderTime}
            disabled={disabled}
            onChange={(event) => {
              const value = event.target.value;
              if (value === "" || /^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
                onReminderTimeChange(value);
              }
            }}
            className="min-h-11 rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none ring-primary focus:ring-2 disabled:opacity-50"
          />
          {reminderTime ? (
            <button
              type="button"
              disabled={disabled}
              className="text-sm font-medium text-primary disabled:opacity-50"
              onClick={() => onReminderTimeChange("")}
            >
              Clear
            </button>
          ) : null}
        </span>
      </label>
    </div>
  );
}
