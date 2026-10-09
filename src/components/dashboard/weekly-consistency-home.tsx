import { Card } from "@/components/ui/card";
import type { WeeklyConsistency } from "@/lib/progress/consistency";

const STATUS_STYLES = {
  complete: "bg-[#B8F4DA] ring-1 ring-[#B8F4DA]",
  partial: "bg-[#3156E8]/40 ring-1 ring-[#3156E8]/30",
  none: "bg-muted ring-1 ring-border",
  future: "bg-transparent ring-1 ring-dashed ring-border/60",
} as const;

export function WeeklyConsistencyHome({
  summary,
  weekDayIndicators,
}: {
  summary: WeeklyConsistency;
  weekDayIndicators: {
    day: string;
    dateKey: string;
    status: "none" | "partial" | "complete" | "future";
  }[];
}) {
  const hasData = summary.planned > 0;

  return (
    <section aria-labelledby="weekly-consistency-heading">
      <h2 id="weekly-consistency-heading" className="mb-2 px-1 text-base font-semibold">
        Weekly consistency
      </h2>
      <Card>
        <p className="text-3xl font-semibold tabular-nums text-[#3156E8]">
          {hasData ? `${summary.percent}%` : "—"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {hasData
            ? `${summary.completed} of ${summary.planned} scheduled habits completed this week`
            : "Add habits to track weekly consistency."}
        </p>
        <p className="mt-2 text-sm text-[#1B2440]">{summary.message}</p>
        <div className="mt-4 flex justify-between gap-1">
          {weekDayIndicators.map((d) => (
            <div key={d.dateKey} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={`h-8 w-8 rounded-full ${STATUS_STYLES[d.status]}`}
                title={d.status}
              />
              <span className="text-[10px] text-muted-foreground">{d.day.slice(0, 1)}</span>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}
