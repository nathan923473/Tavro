"use client";

import {
  saveChallengeDailyCheckInAction,
  toggleChallengeScheduleCompletionAction,
} from "@/app/(app)/member/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { TodayChallengeView } from "@/lib/data/challenge-daily";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

const MOODS = [
  { value: "rough", emoji: "😣", label: "Rough" },
  { value: "okay", emoji: "😐", label: "Okay" },
  { value: "good", emoji: "🙂", label: "Good" },
  { value: "great", emoji: "🔥", label: "Great" },
] as const;

export function ChallengeTodayView({ initial }: { initial: TodayChallengeView }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [view, setView] = useState(initial);
  const [note, setNote] = useState("");

  const pct =
    view.totalDays > 0 ? Math.round((view.dayIndex / view.totalDays) * 100) : view.progressPercent;

  function toggleActivity(scheduleItemId: string, completed: boolean) {
    startTransition(async () => {
      await toggleChallengeScheduleCompletionAction(
        view.challengeId,
        scheduleItemId,
        !completed,
      );
      router.refresh();
      setView((v) => ({
        ...v,
        completedTodayCount: !completed ? 1 : 0,
        extraActivities: v.extraActivities.map((a) =>
          a.id === scheduleItemId || a.id.startsWith(scheduleItemId)
            ? { ...a, completed: !completed }
            : a,
        ),
      }));
    });
  }

  return (
    <div className="space-y-4">
      <Card>
        <p className="text-sm text-muted-foreground">
          Day {view.dayIndex} of {view.totalDays}
        </p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Overall progress {view.progressPercent}%
        </p>
        {view.streakDays > 0 ? (
          <Badge tone="success" className="mt-2">
            🔥 {view.streakDays}-day consistency streak
          </Badge>
        ) : null}
      </Card>

      <Card>
        <h2 className="font-semibold">Today&apos;s activities</h2>
        {view.scheduleItem?.isRest ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Rest day — {view.scheduleItem.title}. Recover and hydrate.
          </p>
        ) : view.scheduleItem ? (
          <ul className="mt-3 space-y-2">
            <li className="flex items-start gap-3 rounded-xl border border-border p-3">
              <button
                type="button"
                disabled={pending}
                aria-pressed={view.extraActivities[0]?.completed}
                onClick={() =>
                  toggleActivity(view.scheduleItem!.id, view.extraActivities[0]?.completed ?? false)
                }
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border text-sm"
              >
                {view.extraActivities[0]?.completed ? "✓" : "○"}
              </button>
              <div>
                <p className="font-medium">{view.scheduleItem.title}</p>
                {view.scheduleItem.body ? (
                  <p className="mt-1 text-sm text-muted-foreground">{view.scheduleItem.body}</p>
                ) : null}
              </div>
            </li>
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            No scheduled activity for today. Log consistency from your challenge card on Home.
          </p>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          {view.completedTodayCount} / {Math.max(view.totalTodayCount, 1)} completed today
        </p>
      </Card>

      {view.announcement ? (
        <Card className="border-primary/30 bg-primary/5">
          <p className="text-xs font-medium uppercase text-primary">Message from {view.creatorName}</p>
          <p className="mt-1 font-semibold">{view.announcement.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{view.announcement.body}</p>
        </Card>
      ) : null}

      <Card className="space-y-3">
        <h2 className="font-semibold">How did today go?</h2>
        <p className="text-xs text-muted-foreground">Private to you — creators don&apos;t see this.</p>
        <div className="grid grid-cols-4 gap-2">
          {MOODS.map((m) => (
            <button
              key={m.value}
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await saveChallengeDailyCheckInAction(view.challengeId, m.value, note);
                  setView((v) => ({ ...v, todayMood: m.value }));
                })
              }
              className={`rounded-xl border px-2 py-2 text-center text-xs ${
                view.todayMood === m.value ? "border-primary bg-primary/10" : "border-border"
              }`}
            >
              <span className="text-lg">{m.emoji}</span>
              <span className="mt-1 block">{m.label}</span>
            </button>
          ))}
        </div>
        <textarea
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Anything you want to remember? (optional, private)"
          className="w-full rounded-xl border border-border px-3 py-2 text-sm"
        />
      </Card>
    </div>
  );
}
