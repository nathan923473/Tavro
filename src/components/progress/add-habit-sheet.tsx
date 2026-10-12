"use client";

import { createHabitAction } from "@/app/(app)/progress/actions";
import { HabitSchedulePicker } from "@/components/progress/habit-schedule-picker";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { ALL_WEEKDAYS_MASK } from "@/lib/habits/schedule";
import {
  CUSTOM_HABIT_PRESET_KEY,
  HABIT_PRESETS,
  HABIT_PRESET_GROUP_LABELS,
  HABIT_PRESET_GROUP_ORDER,
  presetsForGroup,
  type HabitPreset,
  type HabitPresetGroup,
} from "@/lib/habits/presets";
import type { HabitFrequencyType } from "@/types";
import { ChevronLeft, Plus, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState, useTransition } from "react";
import { createPortal } from "react-dom";

type Draft = {
  title: string;
  templateKey: string;
  frequencyType: HabitFrequencyType;
  frequencyTarget: number;
};

export function AddHabitSheet({
  open,
  onClose,
  existingTitles,
}: {
  open: boolean;
  onClose: () => void;
  existingTitles: string[];
}) {
  const router = useRouter();
  const titleId = useId();
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState<"browse" | "frequency">("browse");
  const [tab, setTab] = useState<HabitPresetGroup>("movement");
  const [search, setSearch] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [daysMask, setDaysMask] = useState(ALL_WEEKDAYS_MASK);
  const [reminderTime, setReminderTime] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setStep("browse");
    setSearch("");
    setCustomTitle("");
    setDraft(null);
    setDaysMask(ALL_WEEKDAYS_MASK);
    setReminderTime("");
    setMessage(null);
    setTab("movement");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  const query = search.trim().toLowerCase();
  const taken = new Set(existingTitles.map((title) => title.trim().toLowerCase()));
  const presets = (query ? HABIT_PRESETS : presetsForGroup(tab)).filter((preset) =>
    preset.label.toLowerCase().includes(query),
  );

  function choosePreset(preset: HabitPreset) {
    setMessage(null);
    setDraft({
      title: preset.label,
      templateKey: preset.key,
      frequencyType: preset.frequencyType,
      frequencyTarget: preset.frequencyTarget,
    });
    setDaysMask(ALL_WEEKDAYS_MASK);
    setReminderTime("");
    setStep("frequency");
  }

  function chooseCustom() {
    const title = customTitle.trim();
    if (!title) return;
    setMessage(null);
    setDraft({
      title,
      templateKey: CUSTOM_HABIT_PRESET_KEY,
      frequencyType: "daily",
      frequencyTarget: 7,
    });
    setDaysMask(ALL_WEEKDAYS_MASK);
    setReminderTime("");
    setStep("frequency");
  }

  function addHabit() {
    if (!draft) return;
    startTransition(async () => {
      try {
        setMessage(null);
        await createHabitAction({
          title: draft.title,
          templateKey: draft.templateKey,
          frequencyType: draft.frequencyType,
          frequencyTarget:
            draft.frequencyType === "daily" ? 7 : draft.frequencyTarget,
          scheduleDaysMask: daysMask,
          reminderTime: reminderTime || null,
        });
        router.refresh();
        onClose();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Could not add habit.");
      }
    });
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[min(88dvh,720px)] w-full max-w-lg flex-col rounded-t-3xl border border-border/70 bg-surface pb-[max(1rem,env(safe-area-inset-bottom))] shadow-card"
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-border" aria-hidden />
        <div className="flex items-center gap-2 px-4 pb-2 pt-3">
          {step === "frequency" ? (
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-xl text-foreground"
              aria-label="Back"
              onClick={() => {
                setMessage(null);
                setStep("browse");
              }}
            >
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>
          ) : (
            <span className="w-11" aria-hidden />
          )}
          <h2 id={titleId} className="min-w-0 flex-1 truncate text-center text-base font-semibold">
            {step === "frequency" ? "How often?" : "Add habit"}
          </h2>
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground"
            aria-label="Close"
            onClick={onClose}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        {step === "browse" ? (
          <>
            <div className="space-y-3 px-4 pb-3">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search habits"
                  aria-label="Search habits"
                  className="min-h-11 w-full rounded-2xl border border-border bg-surface py-2 pl-9 pr-3 text-sm outline-none ring-primary focus:ring-2"
                />
              </div>
              <div role="tablist" aria-label="Habit categories" className="flex gap-1 rounded-xl bg-muted p-1">
                {HABIT_PRESET_GROUP_ORDER.map((group) => (
                  <button
                    key={group}
                    type="button"
                    role="tab"
                    aria-selected={!query && tab === group}
                    className={cn(
                      "min-h-9 flex-1 rounded-lg text-xs font-semibold",
                      !query && tab === group
                        ? "bg-surface text-foreground shadow-sm"
                        : "text-muted-foreground",
                    )}
                    onClick={() => {
                      setTab(group);
                      setSearch("");
                    }}
                  >
                    {HABIT_PRESET_GROUP_LABELS[group]}
                  </button>
                ))}
              </div>
            </div>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-4">
              {presets.length === 0 ? (
                <p className="text-sm text-muted-foreground">No habits match that search.</p>
              ) : (
                <ul className="space-y-1">
                  {presets.map((preset) => {
                    const added = taken.has(preset.label.trim().toLowerCase());
                    return (
                      <li key={preset.key}>
                        <button
                          type="button"
                          disabled={added || pending}
                          className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-3 text-left text-sm disabled:opacity-60"
                          onClick={() => choosePreset(preset)}
                        >
                          <span>
                            <span className="block font-medium">{preset.label}</span>
                            {query ? (
                              <span className="block text-xs text-muted-foreground">
                                {HABIT_PRESET_GROUP_LABELS[preset.group]}
                              </span>
                            ) : null}
                          </span>
                          <span className="shrink-0 text-xs font-semibold text-primary">
                            {added ? "Added" : <Plus className="h-4 w-4" aria-hidden />}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              <form
                className="space-y-2 border-t border-border/70 pt-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  chooseCustom();
                }}
              >
                <label className="block text-sm font-medium" htmlFor="custom-habit-name">
                  Or create your own
                </label>
                <input
                  id="custom-habit-name"
                  value={customTitle}
                  onChange={(event) => setCustomTitle(event.target.value)}
                  placeholder="Custom habit"
                  className="min-h-11 w-full rounded-2xl border border-border bg-surface px-3 py-2 text-sm outline-none ring-primary focus:ring-2"
                />
                <Button type="submit" variant="secondary" fullWidth disabled={!customTitle.trim()}>
                  Continue
                </Button>
              </form>
            </div>
          </>
        ) : draft ? (
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-4">
            <p className="text-sm font-medium">{draft.title}</p>
            <div>
              <p className="mb-1.5 text-sm font-medium">Frequency</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  aria-pressed={draft.frequencyType === "daily"}
                  className={cn(
                    "min-h-11 rounded-2xl px-3 text-sm font-semibold",
                    draft.frequencyType === "daily"
                      ? "bg-primary text-primary-foreground"
                      : "border border-border",
                  )}
                  onClick={() =>
                    setDraft({ ...draft, frequencyType: "daily", frequencyTarget: 7 })
                  }
                >
                  Daily
                </button>
                <button
                  type="button"
                  aria-pressed={draft.frequencyType === "times_per_week"}
                  className={cn(
                    "min-h-11 rounded-2xl px-3 text-sm font-semibold",
                    draft.frequencyType === "times_per_week"
                      ? "bg-primary text-primary-foreground"
                      : "border border-border",
                  )}
                  onClick={() =>
                    setDraft({
                      ...draft,
                      frequencyType: "times_per_week",
                      frequencyTarget:
                        draft.frequencyType === "times_per_week"
                          ? draft.frequencyTarget
                          : 3,
                    })
                  }
                >
                  Times per week
                </button>
              </div>
              {draft.frequencyType === "times_per_week" ? (
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-sm text-muted-foreground">Times each week</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-border text-lg font-semibold"
                      aria-label="Fewer times per week"
                      onClick={() =>
                        setDraft({
                          ...draft,
                          frequencyTarget: Math.max(1, draft.frequencyTarget - 1),
                        })
                      }
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-sm font-semibold tabular-nums">
                      {draft.frequencyTarget}
                    </span>
                    <button
                      type="button"
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-border text-lg font-semibold"
                      aria-label="More times per week"
                      onClick={() =>
                        setDraft({
                          ...draft,
                          frequencyTarget: Math.min(7, draft.frequencyTarget + 1),
                        })
                      }
                    >
                      +
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
            <HabitSchedulePicker
              daysMask={daysMask}
              reminderTime={reminderTime}
              disabled={pending}
              onDaysMaskChange={setDaysMask}
              onReminderTimeChange={setReminderTime}
            />
            {message ? (
              <p className="text-sm text-red-600" role="alert">
                {message}
              </p>
            ) : null}
            <Button fullWidth disabled={pending} onClick={addHabit}>
              {pending ? "Adding…" : "Add habit"}
            </Button>
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
