"use client";

import { submitDailyCheckInAction } from "@/app/(app)/member/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MoodPicker } from "@/components/ui/mood-picker";
import { SectionHeader } from "@/components/ui/section-header";
import type { DailyCheckInMood } from "@/types";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

const MOOD_LABEL: Record<DailyCheckInMood, string> = {
  rough: "A tough day",
  okay: "Okay",
  good: "Good",
  great: "Great",
};

export function HomeDailyCheckIn({
  checkedIn,
  mood,
  loggedIn,
}: {
  checkedIn: boolean;
  mood: DailyCheckInMood | null;
  loggedIn: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const [selectedMood, setSelectedMood] = useState<DailyCheckInMood | null>(mood);
  const [reflection, setReflection] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [saveError, setSaveError] = useState<string | null>(null);

  if (!loggedIn) return null;

  const confirmed = checkedIn || saveState === "saved";

  function save(moodValue?: DailyCheckInMood) {
    setSaveState("saving");
    setSaveError(null);
    startTransition(async () => {
      try {
        await submitDailyCheckInAction({
          mood: moodValue ?? selectedMood ?? undefined,
          reflection: reflection || undefined,
        });
        setSaveState("saved");
        setExpanded(false);
        router.refresh();
      } catch (error) {
        setSaveState("error");
        setSaveError(error instanceof Error ? error.message : "Could not save check-in.");
      }
    });
  }

  if (confirmed && !expanded) {
    return (
      <section aria-labelledby="home-reflection-heading" className="px-1">
        <h2 id="home-reflection-heading" className="sr-only">
          Daily reflection
        </h2>
        <Card padding="sm" className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-foreground">
            {saveState === "saving"
              ? "Saving check-in…"
              : selectedMood || mood
                ? `${MOOD_LABEL[(selectedMood ?? mood) as DailyCheckInMood]} · saved`
                : "Check-in saved"}
          </p>
          <button
            type="button"
            className="focus-ring rounded-lg text-sm font-semibold text-primary"
            onClick={() => setExpanded(true)}
          >
            Edit reflection
          </button>
        </Card>
      </section>
    );
  }

  return (
    <section aria-labelledby="home-reflection-open-heading" className="section-stack">
      <SectionHeader
        titleId="home-reflection-open-heading"
        title="Daily reflection"
        description="Private — only you see this."
      />
      <Card className="section-stack">
        {saveState === "saving" ? (
          <p className="text-sm font-medium text-foreground" role="status">
            Saving check-in…
          </p>
        ) : null}
        {saveState === "error" ? (
          <p className="text-sm text-destructive" role="alert">
            {saveError ?? "Could not save."} Your check-in was not saved.
          </p>
        ) : null}
        {!expanded ? (
          <Button type="button" fullWidth disabled={saveState === "saving"} onClick={() => setExpanded(true)}>
            {saveState === "error" ? "Try check-in again" : "Check in"}
          </Button>
        ) : (
          <>
            <MoodPicker
              value={selectedMood}
              onChange={setSelectedMood}
              disabled={saveState === "saving"}
            />
            <textarea
              rows={2}
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="Optional note (private to you)"
              className="w-full rounded-xl border border-border px-3 py-2 text-sm"
            />
            <div className="grid gap-2">
              <Button type="button" fullWidth disabled={saveState === "saving"} onClick={() => save()}>
                {saveState === "saving" ? "Saving…" : "Save reflection"}
              </Button>
              <Button type="button" variant="ghost" fullWidth onClick={() => setExpanded(false)}>
                Cancel
              </Button>
            </div>
          </>
        )}
      </Card>
    </section>
  );
}
