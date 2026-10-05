import { HabitManager } from "@/components/progress/habit-manager";
import { LogWeighInCard } from "@/components/progress/log-weigh-in-card";
import { WeightProgressChart } from "@/components/progress/weight-progress-chart";
import { WeightTrackingSettings } from "@/components/progress/weight-tracking-settings";
import { ShareWithGroupCard } from "@/components/progress/share-with-group-card";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import { fetchChallengesForUser } from "@/lib/data/challenges";
import {
  fetchAllMemberGoals,
  fetchMilestones,
  fetchWeeklyConsistencySummary,
  fetchWeeklyProgress,
  fetchWeighIns,
  fetchWeightSummary,
  fetchWeightTrackingEnabled,
} from "@/lib/data/member";

export const metadata = { title: "Progress" };

export default async function ProgressPage() {
  const { user, profile } = await getCurrentUserProfile();
  const userId = user?.id;

  const [
    habits,
    milestones,
    consistency,
    weekDays,
    challenges,
    weighIns,
    summary,
    weightEnabled,
  ] = userId
    ? await Promise.all([
        fetchAllMemberGoals(userId),
        fetchMilestones(userId),
        fetchWeeklyConsistencySummary(userId),
        fetchWeeklyProgress(userId),
        fetchChallengesForUser(userId),
        fetchWeighIns(userId),
        fetchWeightSummary(userId),
        fetchWeightTrackingEnabled(userId),
      ])
    : [
        [],
        [],
        { planned: 0, completed: 0, percent: 0, message: "" },
        [],
        { mine: [], discover: [] },
        [],
        null,
        true,
      ];

  const joined = challenges.mine;
  const completedChallenges = joined.filter((c) => c.progressPercent >= 100);

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Progress"
        subtitle="Private habits & consistency · share wins if you want"
      />
      <div className="space-y-4 px-4 py-4">
        <Card>
          <p className="text-sm text-muted-foreground">
            Personal progress stays private by default. Weight, mood, and reflections
            are never shared unless you choose to celebrate a milestone with your
            group.
          </p>
        </Card>

        {userId ? (
          <HabitManager habits={habits} joinedChallenges={joined} />
        ) : null}

        <section aria-labelledby="this-week-heading">
          <h2 id="this-week-heading" className="mb-2 px-1 text-base font-semibold">
            This week
          </h2>
          <Card className="space-y-2">
            <p className="text-2xl font-semibold tabular-nums text-primary">
              {consistency.percent}% consistency
            </p>
            <p className="text-sm text-muted-foreground">
              {consistency.completed} of {consistency.planned} planned habits completed
            </p>
            <p className="text-sm">{consistency.message}</p>
            <p className="text-sm text-muted-foreground">
              Active challenges: {joined.length} · Check-ins tracked on Home
            </p>
          </Card>
        </section>

        <section aria-labelledby="week-viz-heading">
          <h2 id="week-viz-heading" className="mb-2 px-1 text-base font-semibold">
            Last 7 days
          </h2>
          <Card>
            <div className="flex h-36 items-end justify-between gap-2">
              {weekDays.map((day) => {
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
                        className="w-full max-w-[2rem] rounded-t-lg bg-primary/80"
                        style={{ height: `${Math.max(pct, 8)}%` }}
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

        <section aria-labelledby="habit-progress-heading">
          <h2 id="habit-progress-heading" className="mb-2 px-1 text-base font-semibold">
            Habit progress
          </h2>
          <ul className="space-y-2">
            {habits.filter((h) => !h.paused).map((h) => (
              <li key={h.id}>
                <Card padding="sm">
                  <p className="font-medium">{h.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {h.weeklyCompletion}/
                    {h.frequencyType === "daily" ? 7 : h.frequencyTarget} this week
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="milestones-heading">
          <h2 id="milestones-heading" className="mb-2 px-1 text-base font-semibold">
            Milestones
          </h2>
          {milestones.length === 0 ? (
            <Card padding="sm">
              <p className="text-sm text-muted-foreground">
                Complete habits to unlock milestones — focused on showing up, not
                perfection.
              </p>
            </Card>
          ) : (
            <ul className="space-y-2">
              {milestones.map((m) => (
                <li key={m.key}>
                  <Card padding="sm">
                    <p className="font-medium">{m.label}</p>
                    <p className="text-xs text-muted-foreground">
                      Unlocked {new Date(m.unlockedAt).toLocaleDateString()}
                    </p>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>

        <ShareWithGroupCard loggedIn={Boolean(userId)} />

        <section aria-labelledby="challenges-history-heading">
          <h2
            id="challenges-history-heading"
            className="mb-2 px-1 text-base font-semibold"
          >
            Challenge history
          </h2>
          <Card className="space-y-2 text-sm">
            <p>
              <span className="font-medium">Current:</span>{" "}
              {joined.length
                ? joined.map((c) => c.title).join(", ")
                : "None joined yet"}
            </p>
            <p>
              <span className="font-medium">Completed:</span>{" "}
              {completedChallenges.length
                ? completedChallenges.map((c) => c.title).join(", ")
                : "Keep going — progress counts"}
            </p>
          </Card>
        </section>

        {userId ? (
          <WeightTrackingSettings enabled={weightEnabled} weighIns={weighIns} />
        ) : null}

        {userId && weightEnabled ? (
          <section aria-labelledby="weight-chart-heading">
            <h2
              id="weight-chart-heading"
              className="mb-2 px-1 text-base font-semibold"
            >
              Optional private weight
            </h2>
            {summary && weighIns.length > 0 ? (
              <WeightProgressChart weighIns={weighIns} summary={summary} />
            ) : (
              <LogWeighInCard />
            )}
          </section>
        ) : null}
      </div>
    </div>
  );
}
