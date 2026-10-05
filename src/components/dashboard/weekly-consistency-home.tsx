import { Card } from "@/components/ui/card";
import type { WeeklyConsistency } from "@/lib/progress/consistency";

export function WeeklyConsistencyHome({
  summary,
  weekDays,
}: {
  summary: WeeklyConsistency;
  weekDays: { day: string; completed: number; total: number }[];
}) {
  return (
    <section aria-labelledby="weekly-consistency-heading">
      <h2 id="weekly-consistency-heading" className="mb-2 px-1 text-base font-semibold">
        Weekly consistency
      </h2>
      <Card>
        <p className="text-3xl font-semibold tabular-nums text-primary">
          {summary.percent}%
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {summary.completed} of {summary.planned} planned habits completed
        </p>
        <p className="mt-2 text-sm">{summary.message}</p>
        <div className="mt-4 flex h-16 items-end justify-between gap-1">
          {weekDays.map((d) => {
            const pct =
              d.total === 0 ? 0 : Math.min(100, Math.round((d.completed / d.total) * 100));
            return (
              <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full max-w-[1.75rem] rounded-t-md bg-primary/80"
                  style={{ height: `${Math.max(12, pct)}%` }}
                  title={`${d.completed} habits`}
                />
                <span className="text-[10px] text-muted-foreground">{d.day.slice(0, 1)}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </section>
  );
}
