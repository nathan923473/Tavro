import type { FounderMetric } from "@/types/founder-analytics";
import { MiniTrend } from "@/components/admin/founder-analytics/mini-trend";

function formatValue(m: FounderMetric) {
  if (m.value == null) return "—";
  if (m.unit === "%") return `${m.value.toFixed(1)}%`;
  if (m.unit === "currency") return `$${m.value.toFixed(2)}`;
  if (m.unit === "ratio") return m.value.toFixed(2);
  return Number.isInteger(m.value) ? String(m.value) : m.value.toFixed(2);
}

export function FounderMetricCard({ metric }: { metric: FounderMetric }) {
  const change = metric.changePercent;
  const changeLabel =
    change == null
      ? null
      : `${change >= 0 ? "+" : ""}${change.toFixed(1)}% vs prior period`;

  return (
    <article className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold leading-snug">{metric.label}</h3>
        <span
          className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
          title={metric.definition}
        >
          {metric.status}
        </span>
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{formatValue(metric)}</p>
      {changeLabel ? (
        <p
          className={`mt-1 text-xs ${change != null && change >= 0 ? "text-emerald-700" : "text-amber-700"}`}
        >
          {changeLabel}
        </p>
      ) : null}
      {metric.unavailableReason ? (
        <p className="mt-2 text-xs text-muted-foreground">{metric.unavailableReason}</p>
      ) : null}
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{metric.definition}</p>
      {metric.series?.length ? (
        <div className="mt-3">
          <MiniTrend series={metric.series} />
        </div>
      ) : null}
    </article>
  );
}
