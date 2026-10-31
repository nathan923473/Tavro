"use client";

import { cn } from "@/lib/cn";
import type { WeightUnit } from "@/types";

type WeightUnitToggleProps = {
  value: WeightUnit;
  onChange: (unit: WeightUnit) => void;
};

export function WeightUnitToggle({ value, onChange }: WeightUnitToggleProps) {
  return (
    <div
      className="inline-flex rounded-lg bg-muted p-0.5"
      role="group"
      aria-label="Weight unit"
    >
      {(["kg", "lb"] as const).map((unit) => (
        <button
          key={unit}
          type="button"
          onClick={() => onChange(unit)}
          className={cn(
            "min-h-8 min-w-[2.75rem] rounded-md px-3 text-xs font-semibold uppercase tracking-wide transition-colors",
            value === unit
              ? "bg-surface text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
          aria-pressed={value === unit}
        >
          {unit}
        </button>
      ))}
    </div>
  );
}
