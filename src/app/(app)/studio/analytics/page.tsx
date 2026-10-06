import { StudioLayout } from "@/components/creator/studio/studio-layout";
import { Card } from "@/components/ui/card";
import { requireApprovedCreator } from "@/lib/auth/profile";
import {
  fetchChallengeJoinAnalytics,
  fetchCreatorLinkAnalytics,
  fetchCreatorStudioChallenges,
  fetchCreatorStudioOverview,
} from "@/lib/data/creator-studio";
import { fetchCreatorDashboardStats } from "@/lib/data/creator-stats";

export const metadata = { title: "Creator analytics" };

export default async function StudioAnalyticsPage() {
  const { user } = await requireApprovedCreator();
  const [stats, overview, challenges, linkAnalytics, joinAnalytics] =
    await Promise.all([
      fetchCreatorDashboardStats(user.id),
      fetchCreatorStudioOverview(user.id),
      fetchCreatorStudioChallenges(user.id),
      fetchCreatorLinkAnalytics(user.id),
      fetchChallengeJoinAnalytics(user.id),
    ]);

  const published = challenges.filter((c) => c.publishStatus !== "draft");

  return (
    <StudioLayout
      title="Analytics"
      subtitle="Aggregate counts · no private health data"
    >
      <section aria-labelledby="shop-links-analytics">
        <h2 id="shop-links-analytics" className="mb-2 text-base font-semibold">
          Shop &amp; links
        </h2>
        {!linkAnalytics || linkAnalytics.links.length === 0 ? (
          <Card padding="sm">
            <p className="text-sm text-muted-foreground">
              Add links in Studio → Shop &amp; Links. Clicks are counted when
              someone taps a link on your public creator page.
            </p>
          </Card>
        ) : (
          <>
            <ul className="mb-3 space-y-2">
              <Metric label="Total link clicks (all time)" value={linkAnalytics.totalClicks} />
              <Metric label="Link clicks (last 7 days)" value={linkAnalytics.clicksLast7Days} />
            </ul>
            <ul className="space-y-2">
              {linkAnalytics.links.map((link) => (
                <li key={link.id}>
                  <Card padding="sm" className="space-y-1">
                    <p className="font-medium">{link.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{link.url}</p>
                    <p className="text-xs tabular-nums">
                      {link.clickCount} total · {link.clicksLast7Days} this week
                    </p>
                  </Card>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section aria-labelledby="acquisition-analytics">
        <h2 id="acquisition-analytics" className="mb-2 text-base font-semibold">
          Challenge sign-ups
        </h2>
        <ul className="space-y-2">
          <Metric label="Total joins (your public challenges)" value={joinAnalytics.totalJoins} />
          <Metric label="Joins last 7 days" value={joinAnalytics.joinsLast7Days} />
          <Metric label="Joins last 30 days" value={joinAnalytics.joinsLast30Days} />
        </ul>
      </section>

      <section aria-labelledby="community-growth-analytics">
        <h2 id="community-growth-analytics" className="mb-2 text-base font-semibold">
          Community growth
        </h2>
        <ul className="space-y-2">
          <Metric label="Total followers" value={overview.totalFollowers} />
          <Metric label="New followers this week" value={overview.newFollowersThisWeek} />
          <Metric label="New followers this month" value={overview.newFollowersThisMonth} />
          <Metric
            label="Followers who joined a challenge (approx.)"
            value={stats.participationRatePercent}
            suffix="%"
          />
        </ul>
      </section>

      <section aria-labelledby="challenge-performance">
        <h2 id="challenge-performance" className="mb-2 text-base font-semibold">
          Challenge performance
        </h2>
        <ul className="space-y-2">
          {published.length === 0 ? (
            <Card padding="sm">
              <p className="text-sm text-muted-foreground">No published challenges yet.</p>
            </Card>
          ) : (
            published.map((c) => {
              const weeklyEngagement =
                c.participantCount === 0
                  ? 0
                  : Math.min(
                      100,
                      Math.round((c.activeThisWeek / c.participantCount) * 100),
                    );
              return (
                <li key={c.id}>
                  <Card padding="sm" className="space-y-1">
                    <p className="font-medium">{c.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.participantCount} joined · {c.activeThisWeek} active this week ·{" "}
                      {c.bucket}
                    </p>
                    <p className="text-xs">
                      Weekly habit activity (linked goals): ~{weeklyEngagement}%
                    </p>
                  </Card>
                </li>
              );
            })
          )}
        </ul>
      </section>

      <Card className="border-dashed text-xs text-muted-foreground">
        Challenge page views are not tracked yet. Link clicks only count when visitors use
        links on your <strong className="font-medium text-foreground">/creator/…</strong>{" "}
        page (tracked redirect).
      </Card>
    </StudioLayout>
  );
}

function Metric({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number;
  suffix?: string;
}) {
  return (
    <li>
      <Card padding="sm" className="flex justify-between gap-3 text-sm">
        <span>{label}</span>
        <span className="font-semibold tabular-nums shrink-0">
          {value.toLocaleString()}
          {suffix ?? ""}
        </span>
      </Card>
    </li>
  );
}
