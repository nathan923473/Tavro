"use client";

export function MiniTrend({ series }: { series: { date: string; value: number }[] }) {
  const max = Math.max(...series.map((s) => s.value), 1);
  const showLabels = series.length <= 14;

  return (
    <div>
      <div className="flex h-10 items-end gap-px sm:gap-0.5" role="img" aria-label="Trend chart">
        {series.map((s) => (
          <div
            key={s.date}
            className="min-w-0 flex-1 rounded-sm bg-primary/75"
            style={{ height: `${Math.max(4, (s.value / max) * 100)}%` }}
            title={`${s.date}: ${s.value}`}
          />
        ))}
      </div>
      {showLabels ? (
        <div className="mt-1 flex justify-between text-[9px] text-muted-foreground">
          <span>{series[0]?.date.slice(5)}</span>
          <span>{series[series.length - 1]?.date.slice(5)}</span>
        </div>
      ) : null}
    </div>
  );
}
