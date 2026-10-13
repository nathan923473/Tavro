"use client";

import { completeChallengeParticipantOnboardingAction } from "@/app/(app)/member/actions";
import { ChallengeDateRange } from "@/components/challenges/challenge-date-range";
import { ChallengeStartCountdown } from "@/components/challenges/challenge-start-countdown";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function ChallengeParticipantOnboarding({
  challengeId,
  challengeTitle,
  creatorName,
  startDate,
  endDate,
  challengeTimezone,
  totalDays,
  goalDescription,
  shortDescription,
  notStarted,
}: {
  challengeId: string;
  challengeTitle: string;
  creatorName: string;
  startDate: string;
  endDate: string;
  challengeTimezone?: string | null;
  totalDays: number;
  goalDescription?: string | null;
  shortDescription?: string | null;
  notStarted: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const about =
    goalDescription?.trim() ||
    shortDescription?.trim() ||
    "Daily or scheduled activities to help you build consistent fitness habits.";

  return (
    <Card className="space-y-4">
      <div>
        <p className="text-lg font-semibold">You&apos;re in!</p>
        <p className="mt-1 text-xl font-semibold text-[#1B2440]">{challengeTitle}</p>
        <p className="text-sm text-muted-foreground">Hosted by {creatorName}</p>
      </div>

      <div className="rounded-xl bg-[#B8F4DA]/25 px-3 py-3 text-sm">
        <p className="font-medium text-[#1B2440]">What you&apos;re working towards</p>
        <p className="mt-1 text-muted-foreground">{about}</p>
      </div>

      <div className="text-sm text-muted-foreground">
        <p className="font-medium text-foreground">How long it runs</p>
        <p className="mt-1">
          <ChallengeDateRange
            startDate={startDate}
            endDate={endDate}
            challengeTimezone={challengeTimezone ?? null}
          />
          {totalDays > 0 ? ` · ${totalDays} days` : null}
        </p>
      </div>

      {notStarted ? (
        <div className="space-y-3">
          <ChallengeStartCountdown
            startDate={startDate}
            variant="hero"
            label="Starts in"
          />
          <p className="text-sm leading-relaxed text-muted-foreground">
            Activities unlock when the countdown ends. You can explore Home and set up habits while
            you wait.
          </p>
        </div>
      ) : (
        <div className="space-y-2 text-sm">
          <p className="font-medium">How it works in Tavro</p>
          <ul className="space-y-1 text-muted-foreground">
            <li>• Open the challenge <strong className="font-medium text-foreground">Today</strong> tab for each day&apos;s activities.</li>
            <li>• Rest days are built in — recovery counts.</li>
            <li>• Check off activities to track progress (no perfection required).</li>
            <li>• Read creator <strong className="font-medium text-foreground">Updates</strong> for encouragement and tips.</li>
            <li>• Optional: add personal habits on Progress to keep routines after the challenge.</li>
          </ul>
        </div>
      )}

      <Button
        type="button"
        fullWidth
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const { nextPath } = await completeChallengeParticipantOnboardingAction(challengeId);
            router.push(nextPath);
            router.refresh();
          })
        }
      >
        {notStarted ? "Got it — see you at the start line" : "Go to today's activities"}
      </Button>
    </Card>
  );
}
