import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { consistencyMetrics, weeklyProgress } from "@/lib/mock-data";

export const metadata = {
  title: "Progress",
};

export default function ProgressPage() {
  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Progress"
        subtitle="Private trends · celebrate consistency"
      />
      <div className="space-y-4 px-4 py-4">
        <Card>
          <p className="text-sm text-muted-foreground">
            Your progress is visible only to you unless you choose to share
            encouragement in a group. Skipped days are part of a sustainable
            journey.
          </p>
        </Card>

        <section aria-labelledby="week-chart-heading">
          <h2 id="week-chart-heading" className="mb-2 px-1 text-base font-semibold">
            This week
          </h2>
          <Card>
            <div className="flex items-end justify-between gap-2 h-36">
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
            {consistencyMetrics.map((metric) => (
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
