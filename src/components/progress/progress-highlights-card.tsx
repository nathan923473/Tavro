import { Card } from "@/components/ui/card";
import type { Challenge } from "@/types";
import Link from "next/link";

export function ProgressHighlightsCard({
  consistencyPercent,
  consistencyMessage,
  habitsActive,
  joinedChallenges,
  completedChallengeCount,
}: {
  consistencyPercent: number;
  consistencyMessage: string;
  habitsActive: number;
  joinedChallenges: Challenge[];
  completedChallengeCount: number;
}) {
  const active = joinedChallenges.filter((c) => c.progressPercent < 100);

  return (
    <Card className="space-y-3 border-[#3156E8]/15">
      <h2 className="text-base font-semibold text-[#1B2440]">Your consistency story</h2>
      <p className="text-sm text-muted-foreground">
        Tavro celebrates showing up — not perfect streaks. Missing a day doesn&apos;t erase what
        you&apos;ve already done.
      </p>
      <ul className="space-y-2 text-sm">
        <li>
          <span className="font-medium tabular-nums">{consistencyPercent}%</span> habit consistency
          this week — {consistencyMessage.toLowerCase()}
        </li>
        <li>
          <span className="font-medium tabular-nums">{habitsActive}</span> active habit
          {habitsActive === 1 ? "" : "s"}
        </li>
        <li>
          <span className="font-medium tabular-nums">{active.length}</span> creator challenge
          {active.length === 1 ? "" : "s"} in progress
          {completedChallengeCount > 0
            ? ` · ${completedChallengeCount} completed`
            : null}
        </li>
      </ul>
      <Link href="/" className="text-sm font-semibold text-[#3156E8]">
        Back to today&apos;s goals →
      </Link>
    </Card>
  );
}
