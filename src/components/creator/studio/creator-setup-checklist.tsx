import { completeCreatorOnboardingAction } from "@/app/(app)/studio/onboarding/actions";
import { ShareChallengeButton } from "@/components/share/share-challenge-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { SetupChecklistStep } from "@/lib/creator/onboarding-rules";
import { Check } from "lucide-react";
import Link from "next/link";

export function CreatorSetupChecklist({
  steps,
  welcome,
  shareChallengeId,
  sharePath,
  shareTitle,
}: {
  steps: SetupChecklistStep[];
  welcome: "invite" | "approved";
  shareChallengeId: string | null;
  sharePath: string | null;
  shareTitle: string | null;
}) {
  return (
    <Card className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">
          {welcome === "invite" ? "Welcome to Creator Studio" : "Optional setup"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {welcome === "invite"
            ? "Your invite is already approved. Create your first challenge whenever you want — nothing else has to be finished first."
            : "Creator Studio is unlocked. Work through this when you like, or create a challenge now."}
        </p>
      </div>
      <ol className="space-y-3">
        {steps.map((step, index) => (
          <li key={step.id} className="flex gap-3">
            <span
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                step.done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {step.done ? <Check className="h-3.5 w-3.5" aria-hidden /> : index + 1}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">{step.title}</p>
              <p className="text-sm text-muted-foreground">{step.detail}</p>
              {step.href && step.id !== "share" ? (
                <Link href={step.href} className="mt-1 inline-block text-sm font-semibold text-primary">
                  {step.done ? "Review" : "Start"} →
                </Link>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
      {shareChallengeId && sharePath && shareTitle ? (
        <ShareChallengeButton
          path={sharePath}
          title={shareTitle}
          challengeId={shareChallengeId}
          fullWidth
        />
      ) : null}
      <form action={completeCreatorOnboardingAction}>
        <Button type="submit" variant="ghost" fullWidth>
          Hide this checklist
        </Button>
      </form>
    </Card>
  );
}
