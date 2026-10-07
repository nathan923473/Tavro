"use client";

import { completeChallengeParticipantOnboardingAction } from "@/app/(app)/member/actions";
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
        <p className="rounded-xl bg-muted px-3 py-3 text-sm leading-relaxed">
          This challenge begins on{" "}
          <strong className="text-foreground">{startDate}</strong>. We&apos;ll let you know when
          it&apos;s time to start. You can explore the app and follow the creator in the meantime.
        </p>
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
