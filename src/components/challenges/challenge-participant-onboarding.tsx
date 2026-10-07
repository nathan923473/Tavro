"use client";

import { completeChallengeParticipantOnboardingAction } from "@/app/(app)/member/actions";
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
  notStarted,
}: {
  challengeId: string;
  challengeTitle: string;
  creatorName: string;
  startDate: string;
  notStarted: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Card className="space-y-4">
      <div>
        <p className="text-lg font-semibold">You&apos;re in! 🎉</p>
        <p className="mt-1 text-xl font-semibold">{challengeTitle}</p>
        <p className="text-sm text-muted-foreground">Hosted by {creatorName}</p>
      </div>

      {notStarted ? (
        <div className="space-y-3">
          <ChallengeStartCountdown startDate={startDate} variant="hero" label="Starts in" />
          <p className="text-sm leading-relaxed text-muted-foreground">
            Activities unlock when the timer hits zero. Explore the app and follow the creator until
            then.
          </p>
        </div>
      ) : (
        <div>
          <p className="text-sm font-medium">For this challenge you&apos;ll:</p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            <li>✓ Complete daily activities</li>
            <li>✓ Track your consistency</li>
            <li>✓ Follow your progress</li>
            <li>✓ Receive challenge updates</li>
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
        {notStarted ? "Got it" : "Start challenge"}
      </Button>
    </Card>
  );
}
