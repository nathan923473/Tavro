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
  const [pending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const [selectedMood, setSelectedMood] = useState<DailyCheckInMood | null>(mood);
  const [reflection, setReflection] = useState("");

  if (!loggedIn) return null;

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

  if (checkedIn && !expanded) {
    return (
      <section aria-labelledby="home-reflection-heading" className="px-1">
        <h2 id="home-reflection-heading" className="sr-only">
          Daily reflection
        </h2>
        <Card padding="sm" className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-[#1B2440]">
            {mood ? `${MOOD_LABEL[mood]} ✓` : "Reflection saved ✓"}
          </p>
          <button
            type="button"
            className="text-sm font-semibold text-[#3156E8]"
            onClick={() => setExpanded(true)}
          >
            Edit reflection
          </button>
        </Card>
      </section>
    );
  }

  return (
    <section aria-labelledby="home-reflection-open-heading" className="px-1">
      <h2 id="home-reflection-open-heading" className="mb-2 text-base font-semibold">
        Daily reflection
      </h2>
      <Card className="space-y-3">
        <p className="text-sm text-muted-foreground">
          How are you feeling about your progress today?
        </p>
        {!expanded ? (
          <Button type="button" fullWidth disabled={pending} onClick={() => setExpanded(true)}>
            Check in
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
                  className={`min-h-10 rounded-xl border px-3 text-sm font-medium ${
                    selectedMood === m.value
                      ? "border-[#3156E8] bg-[#3156E8]/10"
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
              placeholder="Optional note (private to you)"
              className="w-full rounded-xl border border-border px-3 py-2 text-sm"
            />
            <div className="grid gap-2">
              <Button type="button" fullWidth disabled={pending} onClick={() => save()}>
                Save reflection
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
