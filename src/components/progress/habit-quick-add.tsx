"use client";

import { createHabitAction } from "@/app/(app)/progress/actions";
import { Button } from "@/components/ui/button";
import {
  HabitSchedulePicker,
  defaultHabitScheduleMask,
} from "@/components/progress/habit-schedule-picker";
import {
  compactHabitPresets,
  CUSTOM_HABIT_PRESET_KEY,
  HABIT_PRESET_GROUP_LABELS,
  HABIT_PRESET_GROUP_ORDER,
  presetsForGroup,
  type HabitPreset,
} from "@/lib/habits/presets";
import { popcountDays } from "@/lib/habits/weekdays";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type HabitQuickAddProps = {
  /** Show only a few preset chips (Home / Progress by default). */
  compact?: boolean;
  /** When compact, allow expanding to the full categorized preset list. */
  allowExpandAllPresets?: boolean;
  showProgressLink?: boolean;
};

function PresetChip({
  preset,
  pending,
  onPick,
}: {
  preset: HabitPreset;
  pending: boolean;
  onPick: (title: string, templateKey: string) => void;
}) {
  return (
    <button
      type="button"
      disabled={pending}
      className="rounded-full border border-border px-3 py-1.5 text-left text-xs font-medium"
      onClick={() => onPick(preset.label, preset.key)}
    >
      + {preset.label}
    </button>
  );
}

export function HabitQuickAdd({
  compact = false,
  allowExpandAllPresets = false,
  showProgressLink = false,
}: HabitQuickAddProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showAllPresets, setShowAllPresets] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [draftTitle, setDraftTitle] = useState("");
  const [draftTemplateKey, setDraftTemplateKey] = useState(CUSTOM_HABIT_PRESET_KEY);
  const [scheduleDaysMask, setScheduleDaysMask] = useState(defaultHabitScheduleMask);
  const [reminderTime, setReminderTime] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const canSubmit =
    draftTitle.trim().length > 0 && popcountDays(scheduleDaysMask) >= 1;

  function startDraft(title: string, templateKey: string) {
    setDraftTitle(title);
    setDraftTemplateKey(templateKey);
    setMessage(null);
    if (templateKey === CUSTOM_HABIT_PRESET_KEY) {
      setCustomTitle(title);
    }
  }

  function submitHabit() {
    if (!canSubmit) return;
    startTransition(async () => {
      try {
        setMessage(null);
        await createHabitAction({
          title: draftTitle.trim(),
          templateKey: draftTemplateKey,
          scheduleDaysMask,
          reminderTimeLocal: reminderTime || null,
        });
        setCustomTitle("");
        setDraftTitle("");
        setDraftTemplateKey(CUSTOM_HABIT_PRESET_KEY);
        setScheduleDaysMask(defaultHabitScheduleMask);
        setReminderTime("");
        router.refresh();
      } catch (e) {
        setMessage(e instanceof Error ? e.message : "Could not add habit.");
      }
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Tap a preset or type a custom habit, then choose days and an optional
        time{compact ? " — or manage all on Progress." : "."}
      </p>
      {compact && !(allowExpandAllPresets && showAllPresets) ? (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {compactHabitPresets().map((preset) => (
              <PresetChip
                key={preset.key}
                preset={preset}
                pending={pending}
                onPick={startDraft}
              />
            ))}
          </div>
          {allowExpandAllPresets ? (
            <button
              type="button"
              className="text-xs font-semibold text-primary"
              onClick={() => setShowAllPresets(true)}
            >
              Browse all habit ideas →
            </button>
          ) : null}
        </div>
      ) : (
        <div className="space-y-4">
          {compact && allowExpandAllPresets ? (
            <button
              type="button"
              className="text-xs font-semibold text-muted-foreground"
              onClick={() => setShowAllPresets(false)}
            >
              ← Show fewer ideas
            </button>
          ) : null}
          {HABIT_PRESET_GROUP_ORDER.map((group) => (
            <div key={group}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {HABIT_PRESET_GROUP_LABELS[group]}
              </p>
              <div className="flex flex-wrap gap-2">
                {presetsForGroup(group).map((preset) => (
                  <PresetChip
                    key={preset.key}
                    preset={preset}
                    pending={pending}
                    onPick={startDraft}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          value={customTitle}
          onChange={(e) => {
            setCustomTitle(e.target.value);
            startDraft(e.target.value, CUSTOM_HABIT_PRESET_KEY);
          }}
          placeholder="Custom habit"
          className="min-h-11 flex-1 rounded-xl border border-border px-3 py-2 text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter" && canSubmit) submitHabit();
          }}
        />
      </div>

      {draftTitle.trim() ? (
        <div className="rounded-2xl border border-border/80 bg-muted/30 p-3">
          <p className="text-sm font-medium">
            Add: <span className="text-primary">{draftTitle.trim()}</span>
          </p>
          <HabitSchedulePicker
            className="mt-3"
            compact={compact}
            scheduleDaysMask={scheduleDaysMask}
            onScheduleDaysMaskChange={setScheduleDaysMask}
            reminderTime={reminderTime}
            onReminderTimeChange={setReminderTime}
          />
          <Button
            type="button"
            className="mt-3"
            fullWidth
            disabled={pending || !canSubmit}
            onClick={submitHabit}
          >
            <Plus className="h-4 w-4" aria-hidden />
            Save habit
          </Button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Pick a preset or type a name to set days and time.
        </p>
      )}

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
