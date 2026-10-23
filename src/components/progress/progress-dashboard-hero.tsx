import { ProgressRing } from "@/components/ui/progress-ring";
import { Card } from "@/components/ui/card";
import type { WeeklyConsistency } from "@/lib/progress/consistency";

export function ProgressDashboardHero({
  consistency,
  habitsActive,
  activeChallengeCount,
  completedChallengeCount,
}: {
  consistency: WeeklyConsistency;
  habitsActive: number;
  activeChallengeCount: number;
  completedChallengeCount: number;
}) {
  const hasData = consistency.planned > 0;

  return (
    <Card variant="muted" className="flex gap-4 p-4">
      <ProgressRing
        value={hasData ? consistency.percent : 0}
        size={96}
        label={`Weekly habit consistency ${consistency.percent} percent`}
      />
      <div className="min-w-0 flex-1 space-y-2">
        <p className="text-title">This week</p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {hasData
            ? `${consistency.completed} of ${consistency.planned} planned habits completed. ${consistency.message}`
            : "Add habits on this tab to track consistency — Tavro rewards showing up, not perfection."}
        </p>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <li>
            <span className="font-semibold tabular-nums text-foreground">{habitsActive}</span>
            <span className="text-muted-foreground"> active habits</span>
          </li>
          <li>
            <span className="font-semibold tabular-nums text-foreground">{activeChallengeCount}</span>
            <span className="text-muted-foreground"> challenges in progress</span>
          </li>
          {completedChallengeCount > 0 ? (
            <li>
              <span className="font-semibold tabular-nums text-foreground">
                {completedChallengeCount}
              </span>
              <span className="text-muted-foreground"> completed</span>
            </li>
          ) : null}
        </ul>
      </div>
    </Card>
  );
}
