import { ShareableAchievementCard } from "@/components/share/shareable-achievement-card";
import { CopyLinkButton } from "@/components/share/copy-link-button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { LogWeighInCard } from "@/components/progress/log-weigh-in-card";
import { WeightProgressChart } from "@/components/progress/weight-progress-chart";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import {
  fetchConsistencyMetrics,
  fetchWeeklyProgress,
  fetchWeighIns,
  fetchWeightSummary,
} from "@/lib/data/member";
import type { AchievementCard } from "@/types";
import { Share2 } from "lucide-react";

export const metadata = { title: "Progress" };

export default async function ProgressPage() {
  const { user, profile } = await getCurrentUserProfile();
  const userId = user?.id;
  const firstName =
    profile?.displayName?.split(/\s+/)[0] ??
    user?.email?.split("@")[0] ??
    "Member";

  const [weighIns, summary, weeklyProgress, consistency] = userId
    ? await Promise.all([
        fetchWeighIns(userId),
        fetchWeightSummary(userId),
        fetchWeeklyProgress(userId),
        fetchConsistencyMetrics(userId),
      ])
    : [[], null, [], []];

  const checkInMetric = consistency.find((m) =>
    m.label.includes("Check-in"),
  );
  const achievement: AchievementCard = {
    id: "live",
    headline: `${checkInMetric?.value ?? 0} check-ins this week`,
    subline: "Showing up at your pace — progress over perfection",
    streakDays: checkInMetric?.value ?? 0,
    consistencyPercent: Math.min(
      100,
      Math.round(
        ((checkInMetric?.value ?? 0) / (checkInMetric?.target ?? 7)) * 100,
      ),
    ),
    generatedAt: new Date().toISOString().slice(0, 10),
  };

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Progress"
        subtitle="Private trends · share wins if you want"
      />
      <div className="space-y-4 px-4 py-4">
        <Card>
          <p className="text-sm text-muted-foreground">
            Your data stays private by default. Achievement cards never include
            weight — only habits and consistency you choose to celebrate.
          </p>
        </Card>

        <section aria-labelledby="achievement-heading">
          <h2
            id="achievement-heading"
            className="mb-2 flex items-center gap-2 px-1 text-base font-semibold"
          >
            <Share2 className="h-4 w-4 text-primary" aria-hidden />
            Shareable achievement
          </h2>
          <ShareableAchievementCard
            achievement={achievement}
            userName={firstName}
          />
          <div className="mt-3">
            <CopyLinkButton
              url="/progress"
              label="Copy link to my progress"
              fullWidth
            />
          </div>
        </section>

        <section aria-labelledby="weight-chart-heading">
          <h2
            id="weight-chart-heading"
            className="mb-2 px-1 text-base font-semibold"
          >
            Weight loss progress
          </h2>
          {userId && summary && weighIns.length > 0 ? (
            <WeightProgressChart weighIns={weighIns} summary={summary} />
          ) : userId ? (
            <LogWeighInCard />
          ) : (
            <Card>
              <p className="text-sm text-muted-foreground">
                Log in to track private weigh-ins on your account.
              </p>
            </Card>
          )}
        </section>

        <section aria-labelledby="week-chart-heading">
          <h2 id="week-chart-heading" className="mb-2 px-1 text-base font-semibold">
            This week
          </h2>
          <Card>
            <div className="flex h-36 items-end justify-between gap-2">
              {weeklyProgress.map((day) => {
                const pct =
                  day.total === 0
                    ? 0
                    : Math.round((day.completed / day.total) * 100);
                return (
                  <div
                    key={day.day}
                    className="flex flex-1 flex-col items-center gap-2"
                  >
                    <div className="flex h-24 w-full items-end justify-center">
                      <div
                        className="w-full max-w-[2rem] rounded-t-lg bg-primary/80 transition-all"
                        style={{ height: `${Math.max(pct, 8)}%` }}
                        title={`${day.completed}/${day.total} goals`}
                      />
                    </div>
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {day.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        </section>

        <section aria-labelledby="metrics-heading">
          <h2 id="metrics-heading" className="mb-2 px-1 text-base font-semibold">
            Consistency metrics
          </h2>
          <ul className="space-y-2">
            {consistency.map((metric) => (
              <li key={metric.label}>
                <Card padding="sm">
                  <div className="flex items-center justify-between text-sm">
                    <span>{metric.label}</span>
                    <span className="font-semibold tabular-nums">
                      {metric.value}/{metric.target}
                    </span>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
