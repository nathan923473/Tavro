"use client";

import { cn } from "@/lib/cn";
import type { DailyCheckInMood } from "@/types";

export const MOOD_OPTIONS: {
  value: DailyCheckInMood;
  emoji: string;
  label: string;
}[] = [
  { value: "rough", emoji: "😣", label: "Rough" },
  { value: "okay", emoji: "😐", label: "Okay" },
  { value: "good", emoji: "🙂", label: "Good" },
  { value: "great", emoji: "🔥", label: "Great" },
];

export function MoodPicker({
  value,
  onChange,
  disabled,
  size = "default",
}: {
  value: DailyCheckInMood | null;
  onChange: (mood: DailyCheckInMood) => void;
  disabled?: boolean;
  size?: "default" | "compact";
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-4 gap-2",
        size === "compact" && "gap-1.5",
      )}
      role="group"
      aria-label="How did today go?"
    >
      {MOOD_OPTIONS.map((m) => {
        const selected = value === m.value;
        return (
          <button
            key={m.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(m.value)}
            className={cn(
              "focus-ring rounded-xl border px-2 py-2 text-center transition-colors",
              size === "compact" ? "min-h-10 text-xs" : "min-h-11 text-xs",
              selected
                ? "border-primary bg-brand-subtle text-foreground"
                : "border-border bg-surface text-muted-foreground hover:bg-muted/60",
            )}
          >
            <span className="text-lg leading-none" aria-hidden>
              {m.emoji}
            </span>
            <span className="mt-1 block font-medium">{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}
