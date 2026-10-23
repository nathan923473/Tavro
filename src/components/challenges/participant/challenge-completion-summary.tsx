"use client";

import { Card } from "@/components/ui/card";
import type { ChallengeParticipantHub } from "@/lib/data/challenge-participant-hub";
import { ChallengeContinuationSteps } from "@/components/challenges/participant/challenge-continuation-steps";
import { ChallengeCompletionOfferCard } from "@/components/challenges/participant/challenge-completion-offer";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function buildHighlights(hub: ChallengeParticipantHub): string[] {
  const lines: string[] = [];
  if (hub.completedDaysCount >= 7) {
    lines.push(`Showed up on ${hub.completedDaysCount} challenge days.`);
  } else if (hub.completedDaysCount > 0) {
    lines.push(`Completed activities on ${hub.completedDaysCount} days.`);
  }
  if (hub.bestStreak >= 4) {
    lines.push(`Longest consistency run: ${hub.bestStreak} days in a row.`);
  } else if (hub.bestStreak >= 2) {
    lines.push(`Built a ${hub.bestStreak}-day activity streak along the way.`);
  }
  if (hub.progressPercent >= 80) {
    lines.push("Strong overall participation — well done.");
  } else if (hub.progressPercent >= 50) {
    lines.push("Meaningful progress — every check-in counted.");
  }
  const earned = hub.milestones.filter((m) => m.earned);
  if (earned.length > 0) {
    lines.push(`${earned.length} challenge milestone${earned.length === 1 ? "" : "s"} earned.`);
  }
  if (lines.length === 0) {
    lines.push("You finished the challenge — that takes commitment.");
  }
  return lines.slice(0, 4);
}

export function ChallengeCompletionSummary({
  hub,
  hasGroup,
  habitConsistencyPercent,
  onViewProgress,
}: {
  hub: ChallengeParticipantHub;
  hasGroup: boolean;
  habitConsistencyPercent: number | null;
  onViewProgress: () => void;
}) {
  const highlights = buildHighlights(hub);
  const earnedMilestones = hub.milestones.filter((m) => m.earned);

  return (
    <div className="space-y-4">
      <Card className="space-y-4 text-left">
        <div className="text-center">
          <p className="text-3xl" aria-hidden>
            🎉
          </p>
          <h2 className="text-lg font-semibold">You finished this challenge</h2>
          <p className="font-medium text-foreground">{hub.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">Hosted by {hub.creatorName}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-center text-sm">
          <div className="rounded-xl bg-muted/40 px-2 py-3">
            <p className="text-lg font-semibold tabular-nums">{hub.completedDaysCount}</p>
            <p className="text-xs text-muted-foreground">Active days</p>
          </div>
          <div className="rounded-xl bg-muted/40 px-2 py-3">
            <p className="text-lg font-semibold tabular-nums">{hub.progressPercent}%</p>
            <p className="text-xs text-muted-foreground">Participation</p>
          </div>
          {habitConsistencyPercent != null ? (
            <div className="col-span-2 rounded-xl bg-mint-subtle/30 px-2 py-3">
              <p className="text-lg font-semibold tabular-nums">{habitConsistencyPercent}%</p>
              <p className="text-xs text-muted-foreground">Personal habit consistency this week</p>
            </div>
          ) : null}
        </div>

        <div>
          <h3 className="text-sm font-semibold">Highlights</h3>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {highlights.map((line) => (
              <li key={line}>• {line}</li>
            ))}
          </ul>
        </div>

        {earnedMilestones.length > 0 ? (
          <div>
            <h3 className="text-sm font-semibold">Milestones</h3>
            <ul className="mt-2 space-y-1 text-sm">
              {earnedMilestones.map((m) => (
                <li key={m.key}>{m.label}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="rounded-xl border border-dashed border-border px-3 py-3">
          <p className="text-xs font-medium text-muted-foreground">Reflection (private)</p>
          <p className="mt-1 text-sm">
            What helped you stay on track — even a little? Carry that into your next habit or
            group.
          </p>
        </div>

        <Button type="button" variant="outline" fullWidth onClick={onViewProgress}>
          View full challenge progress
        </Button>

        {hub.communitySlug ? (
          <Link
            href={`/creator/${hub.communitySlug}`}
            className="block text-center text-sm font-semibold text-primary"
          >
            View {hub.creatorName}&apos;s community
          </Link>
        ) : null}
      </Card>

      <ChallengeContinuationSteps hasGroup={hasGroup} />

      {hub.completionOffer ? (
        <ChallengeCompletionOfferCard offer={hub.completionOffer} />
      ) : null}
    </div>
  );
}
