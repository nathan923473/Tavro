"use client";

import { submitDailyCheckInAction } from "@/app/(app)/member/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { DailyCheckInMood } from "@/types";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

const MOODS: { value: DailyCheckInMood; label: string }[] = [
  { value: "rough", label: "Rough" },
  { value: "okay", label: "Okay" },
  { value: "good", label: "Good" },
  { value: "great", label: "Great" },
];

export function DailyCheckInCard({
  checkedIn,
  mood,
  loggedIn,
}: {
  checkedIn: boolean;
  mood: DailyCheckInMood | null;
  loggedIn: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const [selectedMood, setSelectedMood] = useState<DailyCheckInMood | null>(mood);
  const [reflection, setReflection] = useState("");

  function save(moodValue?: DailyCheckInMood) {
    startTransition(async () => {
      await submitDailyCheckInAction({
        mood: moodValue ?? selectedMood ?? undefined,
        reflection: reflection || undefined,
      });
      router.refresh();
      setExpanded(false);
    });
  }

  return (
    <Card>
      <h2 className="font-semibold">Daily check-in</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Optional — how are you feeling about your progress today?
      </p>

      {checkedIn ? (
        <p className="mt-3 text-sm font-medium text-primary">
          Checked in{mood ? ` · feeling ${mood}` : ""} ✓
        </p>
      ) : null}

      {!loggedIn ? (
        <p className="mt-3 text-sm text-muted-foreground">Log in to check in.</p>
      ) : (
        <div className="mt-3 space-y-3">
          {!expanded ? (
            <Button
              type="button"
              variant={checkedIn ? "secondary" : undefined}
              fullWidth
              disabled={pending}
              onClick={() => setExpanded(true)}
            >
              {checkedIn ? "Update check-in" : "Check in (optional)"}
            </Button>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                {MOODS.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    disabled={pending}
                    onClick={() => setSelectedMood(m.value)}
                    className={`min-h-11 rounded-xl border px-3 text-sm font-medium ${
                      selectedMood === m.value
                        ? "border-primary bg-secondary/60"
                        : "border-border"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <textarea
                rows={2}
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="Optional short reflection…"
                className="w-full rounded-xl border border-border px-3 py-2 text-sm"
              />
              <div className="grid gap-2">
                <Button
                  type="button"
                  fullWidth
                  disabled={pending}
                  onClick={() => save(selectedMood ?? undefined)}
                >
                  Save check-in
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  fullWidth
                  onClick={() => setExpanded(false)}
                >
                  Cancel
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </Card>
  );
}
