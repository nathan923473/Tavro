"use client";

import { MiniTrend } from "@/components/admin/founder-analytics/mini-trend";
import type { FounderMetric, FounderMetricDisplayState } from "@/types/founder-analytics";
import { ChevronDown, Info } from "lucide-react";
import { useState } from "react";

const STATE_LABELS: Record<FounderMetricDisplayState, string> = {
  ok: "Live",
  zero: "0%",
  insufficient: "Insufficient",
  unavailable: "Unavailable",
  partial_tracking: "Partial",
};

const STATE_STYLES: Record<FounderMetricDisplayState, string> = {
  ok: "bg-emerald-100 text-emerald-900",
  zero: "bg-muted text-muted-foreground",
  insufficient: "bg-amber-100 text-amber-950",
  unavailable: "bg-muted text-muted-foreground",
  partial_tracking: "bg-sky-100 text-sky-950",
};

function formatValue(m: FounderMetric): string {
  if (m.displayState === "unavailable" || m.displayState === "insufficient") {
    return "—";
  }
  if (m.value == null) return "—";
  if (m.unit === "%") return `${m.value.toFixed(1)}%`;
  if (m.unit === "currency") return `$${m.value.toFixed(2)}`;
  if (m.unit === "ratio") return m.value.toFixed(2);
  return Number.isInteger(m.value) ? String(m.value) : m.value.toFixed(2);
}

function trendLabel(m: FounderMetric): string | null {
  const change = m.changePercent;
  if (change != null) {
    return `${change >= 0 ? "+" : ""}${change.toFixed(1)}% vs prior`;
  }
  if (m.previousValue != null && m.unit === "%") {
    return `Prior cohort ${m.previousValue.toFixed(1)}%`;
  }
  return null;
}

export function FounderMetricCard({ metric }: { metric: FounderMetric }) {
  const [open, setOpen] = useState(false);
  const trend = trendLabel(metric);
  const stateLabel = STATE_LABELS[metric.displayState];

  return (
    <article className="flex min-w-0 flex-col rounded-xl border border-border bg-surface p-3 shadow-sm">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-xs font-semibold leading-tight text-foreground">
              {metric.label}
            </h3>
            <button
              type="button"
              className="shrink-0 rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              title={metric.definition}
              aria-label={`About ${metric.label}`}
              onClick={() => setOpen((v) => !v)}
            >
              <Info className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <p
              className={`text-xl font-semibold tabular-nums tracking-tight ${
                metric.displayState === "zero" ? "text-muted-foreground" : ""
              }`}
            >
              {formatValue(metric)}
            </p>
            {trend ? (
              <p
                className={`text-[11px] font-medium ${
                  metric.changePercent != null && metric.changePercent >= 0
                    ? "text-emerald-700"
                    : "text-amber-800"
                }`}
              >
                {trend}
              </p>
            ) : null}
          </div>
        </div>
        <span
          className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATE_STYLES[metric.displayState]}`}
        >
          {stateLabel}
        </span>
      </div>

      {metric.unavailableReason && metric.displayState !== "ok" ? (
        <p className="mt-1.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
          {metric.unavailableReason}
        </p>
      ) : null}

      {metric.series?.length ? (
        <div className="mt-2 border-t border-border/60 pt-2">
          <MiniTrend series={metric.series} />
        </div>
      ) : metric.seriesEmptyReason ? (
        <p className="mt-2 border-t border-border/60 pt-2 text-[10px] text-muted-foreground">
          {metric.seriesEmptyReason}
        </p>
      ) : null}

      {open ? (
        <div className="mt-2 rounded-lg bg-muted/40 p-2 text-[11px] leading-relaxed text-muted-foreground">
          {metric.definition}
          {metric.extra ? (
            <dl className="mt-2 space-y-0.5 border-t border-border/50 pt-2">
              {Object.entries(metric.extra).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2">
                  <dt className="capitalize">{k.replace(/([A-Z])/g, " $1")}</dt>
                  <dd className="font-medium tabular-nums text-foreground">
                    {v == null ? "—" : String(v)}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
          <button
            type="button"
            className="mt-2 flex items-center gap-1 text-[10px] font-medium text-primary"
            onClick={() => setOpen(false)}
          >
            <ChevronDown className="h-3 w-3" aria-hidden />
            Hide details
          </button>
        </div>
      ) : null}
    </article>
  );
}
