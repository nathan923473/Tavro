"use client";

import { createHabitAction } from "@/app/(app)/progress/actions";
import { Button } from "@/components/ui/button";
import {
  compactHabitPresets,
  CUSTOM_HABIT_PRESET_KEY,
  HABIT_PRESET_GROUP_LABELS,
  HABIT_PRESET_GROUP_ORDER,
  presetsForGroup,
  type HabitPreset,
} from "@/lib/habits/presets";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type HabitQuickAddProps = {
  /** Show only a few preset chips (Home). Full categorized list on Progress. */
  compact?: boolean;
  showProgressLink?: boolean;
};

function PresetChip({
  preset,
  pending,
  onAdd,
}: {
  preset: HabitPreset;
  pending: boolean;
  onAdd: (title: string, templateKey: string) => void;
}) {
  return (
    <button
      type="button"
      disabled={pending}
      className="rounded-full border border-border px-3 py-1.5 text-left text-xs font-medium"
      onClick={() => onAdd(preset.label, preset.key)}
    >
      + {preset.label}
    </button>
  );
}

export function HabitQuickAdd({
  compact = false,
  showProgressLink = false,
}: HabitQuickAddProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [customTitle, setCustomTitle] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  function addHabit(title: string, templateKey: string) {
    startTransition(async () => {
      try {
        setMessage(null);
        await createHabitAction({ title, templateKey });
        setCustomTitle("");
        router.refresh();
      } catch (e) {
        setMessage(e instanceof Error ? e.message : "Could not add habit.");
      }
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Tap a preset or type a custom habit{compact ? " — or manage all on Progress." : "."}
      </p>
      {compact ? (
        <div className="flex flex-wrap gap-2">
          {compactHabitPresets().map((preset) => (
            <PresetChip key={preset.key} preset={preset} pending={pending} onAdd={addHabit} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {HABIT_PRESET_GROUP_ORDER.map((group) => (
            <div key={group}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {HABIT_PRESET_GROUP_LABELS[group]}
              </p>
              <div className="flex flex-wrap gap-2">
                {presetsForGroup(group).map((preset) => (
                  <PresetChip key={preset.key} preset={preset} pending={pending} onAdd={addHabit} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          value={customTitle}
          onChange={(e) => setCustomTitle(e.target.value)}
          placeholder="Custom habit"
          className="min-h-11 flex-1 rounded-xl border border-border px-3 py-2 text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter" && customTitle.trim()) {
              addHabit(customTitle.trim(), CUSTOM_HABIT_PRESET_KEY);
            }
          }}
        />
        <Button
          type="button"
          variant="secondary"
          disabled={pending || !customTitle.trim()}
          onClick={() => addHabit(customTitle.trim(), CUSTOM_HABIT_PRESET_KEY)}
        >
          <Plus className="h-4 w-4" aria-hidden />
          Add
        </Button>
      </div>
      {showProgressLink ? (
        <Link
          href="/progress#habits-manage-heading"
          className="text-sm font-medium text-primary"
        >
          Edit frequency, pause, or link to a challenge →
        </Link>
      ) : null}
      {message ? (
        <p className="text-sm text-red-600" role="alert">
          {message}
        </p>
      ) : null}
    </div>
  );
}
