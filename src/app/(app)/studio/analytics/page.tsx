import { StudioLayout } from "@/components/creator/studio/studio-layout";
import { Card } from "@/components/ui/card";
import { requireApprovedCreator } from "@/lib/auth/profile";
import { fetchCreatorStudioChallenges, fetchCreatorStudioOverview } from "@/lib/data/creator-studio";
import { fetchCreatorDashboardStats } from "@/lib/data/creator-stats";

export const metadata = { title: "Creator analytics" };

export default async function StudioAnalyticsPage() {
  const { user } = await requireApprovedCreator();
  const [stats, overview, challenges] = await Promise.all([
    fetchCreatorDashboardStats(user.id),
    fetchCreatorStudioOverview(user.id),
    fetchCreatorStudioChallenges(user.id),
  ]);

  const published = challenges.filter((c) => c.publishStatus !== "draft");

  return (
    <StudioLayout
      title="Analytics"
      subtitle="Counts from Supabase · no private health data"
    >
      <Card className="border-dashed text-sm text-muted-foreground">
        Acquisition metrics (page views) are not tracked yet — this dashboard uses
        follows, joins, and habit activity linked to challenges.
      </Card>

      <section aria-labelledby="community-growth-analytics">
        <h2 id="community-growth-analytics" className="mb-2 text-base font-semibold">
          Community growth
        </h2>
        <ul className="space-y-2">
          <Metric label="Total followers" value={overview.totalFollowers} />
          <Metric label="New this week" value={overview.newFollowersThisWeek} />
          <Metric label="New this month" value={overview.newFollowersThisMonth} />
        </ul>
      </section>

      <section aria-labelledby="challenge-performance">
        <h2 id="challenge-performance" className="mb-2 text-base font-semibold">
          Challenge performance
        </h2>
        <p className="mb-2 text-xs text-muted-foreground">
          Participation rate (followers who joined a challenge):{" "}
          {stats.participationRatePercent}%
        </p>
        <ul className="space-y-2">
          {published.length === 0 ? (
            <Card padding="sm">
              <p className="text-sm text-muted-foreground">No published challenges yet.</p>
            </Card>
          ) : (
            published.map((c) => {
              const completionRate =
                c.participantCount === 0
                  ? 0
                  : Math.round(
                      (c.participantCount > 0
                        ? Math.min(
                            100,
                            Math.round((c.activeThisWeek / c.participantCount) * 100),
                          )
                        : 0),
                    );
              return (
                <li key={c.id}>
                  <Card padding="sm" className="space-y-1">
                    <p className="font-medium">{c.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.participantCount} joined · {c.activeThisWeek} active this week
                      · {c.bucket}
                    </p>
                    <p className="text-xs">
                      Weekly engagement (linked habits): ~{completionRate}%
                    </p>
                  </Card>
                </li>
              );
            })
          )}
        </ul>
      </section>
    </StudioLayout>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <li>
      <Card padding="sm" className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-semibold tabular-nums">{value.toLocaleString()}</span>
      </Card>
    </li>
  );
}
