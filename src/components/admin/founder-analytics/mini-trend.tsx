export function MiniTrend({ series }: { series: { date: string; value: number }[] }) {
  const max = Math.max(...series.map((s) => s.value), 1);
  return (
    <div className="flex h-12 items-end gap-0.5" aria-hidden>
      {series.map((s) => (
        <div
          key={s.date}
          className="min-w-[3px] flex-1 rounded-sm bg-primary/70"
          style={{ height: `${Math.max(8, (s.value / max) * 100)}%` }}
          title={`${s.date}: ${s.value}`}
        />
      ))}
    </div>
  );
}
