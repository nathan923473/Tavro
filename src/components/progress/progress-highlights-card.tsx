import { ProgressDashboardHero } from "@/components/progress/progress-dashboard-hero";
import type { Challenge } from "@/types";
import type { WeeklyConsistency } from "@/lib/progress/consistency";
import Link from "next/link";

export function ProgressHighlightsCard({
  consistency,
  habitsActive,
  joinedChallenges,
  completedChallengeCount,
}: {
  consistency: WeeklyConsistency;
  habitsActive: number;
  joinedChallenges: Challenge[];
  completedChallengeCount: number;
}) {
  const active = joinedChallenges.filter((c) => c.progressPercent < 100);

  return (
    <section aria-labelledby="progress-hero-heading" className="section-stack">
      <h2 id="progress-hero-heading" className="sr-only">
        Progress overview
      </h2>
      <ProgressDashboardHero
        consistency={consistency}
        habitsActive={habitsActive}
        activeChallengeCount={active.length}
        completedChallengeCount={completedChallengeCount}
      />
      <p className="px-0.5 text-center text-sm">
        <Link href="/" className="font-medium text-primary">
          Back to today&apos;s plan →
        </Link>
      </p>
    </section>
  );
}
