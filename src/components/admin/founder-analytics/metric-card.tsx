"use client";

import { MiniTrend } from "@/components/admin/founder-analytics/mini-trend";
import type { FounderMetric, FounderMetricDisplayState } from "@/types/founder-analytics";
import { ChevronDown, Info } from "lucide-react";
import { useState } from "react";

const STATE_LABELS: Record<FounderMetricDisplayState, string> = {
  ok: "Live",
  zero: "Measured 0%",
  insufficient: "Insufficient data",
  unavailable: "Unavailable",
  partial_tracking: "Partial",
};

const STATE_STYLES: Record<FounderMetricDisplayState, string> = {
  ok: "bg-emerald-100 text-emerald-900",
  zero: "bg-muted text-foreground",
  insufficient: "bg-amber-100 text-amber-950",
  unavailable: "bg-muted text-muted-foreground",
  partial_tracking: "bg-sky-100 text-sky-950",
};

function formatPrimaryValue(m: FounderMetric): string {
  switch (m.displayState) {
    case "unavailable":
      return "Unavailable";
    case "insufficient":
      return "Insufficient data";
    case "zero":
      return m.unit === "%" ? "0%" : "0";
    default:
      break;
  }
  if (m.value == null) return "—";
  if (m.unit === "%") return `${m.value.toFixed(1)}%`;
  if (m.unit === "currency") return `$${m.value.toFixed(2)}`;
  if (m.unit === "ratio") return m.value.toFixed(2);
  return Number.isInteger(m.value) ? String(m.value) : m.value.toFixed(2);
}

export function FounderMetricCard({ metric }: { metric: FounderMetric }) {
  const [open, setOpen] = useState(false);
  const change = metric.changePercent;
  const showTrend = change != null;

  return (
    <article className="flex h-full min-w-0 flex-col rounded-xl border border-border bg-surface p-3.5 shadow-sm">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 flex-1 text-sm font-semibold leading-snug text-foreground [overflow-wrap:anywhere]">
            {metric.label}
          </h3>
          <button
            type="button"
            className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={`Definition for ${metric.label}`}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <Info className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <span
          className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATE_STYLES[metric.displayState]}`}
        >
          {STATE_LABELS[metric.displayState]}
        </span>

        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <p
            className={`text-2xl font-semibold tabular-nums leading-none tracking-tight ${
              metric.displayState === "zero" ? "text-muted-foreground" : "text-foreground"
            }`}
          >
            {formatPrimaryValue(metric)}
          </p>
          {showTrend ? (
            <p
              className={`text-xs font-medium ${
                change >= 0 ? "text-emerald-700" : "text-amber-800"
              }`}
            >
              {change >= 0 ? "+" : ""}
              {change.toFixed(1)}% vs prior period
            </p>
          ) : null}
        </div>
      </div>

      {metric.unavailableReason &&
      metric.displayState !== "ok" &&
      metric.displayState !== "zero" ? (
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
          {metric.unavailableReason}
        </p>
      ) : null}

      {metric.series?.length ? (
        <div className="mt-3 border-t border-border/60 pt-2">
          <MiniTrend series={metric.series} />
          {metric.seriesSource ? (
            <p className="mt-1.5 text-[10px] leading-snug text-muted-foreground">
              Chart source: {metric.seriesSource}. Event pipeline counts may differ.
            </p>
          ) : null}
        </div>
      ) : metric.seriesEmptyReason ? (
        <p className="mt-3 border-t border-border/60 pt-2 text-[10px] leading-snug text-muted-foreground">
          {metric.seriesEmptyReason}
        </p>
      ) : null}

      {open ? (
        <div className="mt-3 rounded-lg bg-muted/40 p-2.5 text-xs leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
          <p>{metric.definition}</p>
          {metric.extra ? (
            <dl className="mt-2 space-y-1 border-t border-border/50 pt-2">
              {Object.entries(metric.extra).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3">
                  <dt className="capitalize">{k.replace(/([A-Z])/g, " $1")}</dt>
                  <dd className="shrink-0 font-medium tabular-nums text-foreground">
                    {v == null ? "—" : String(v)}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
          <button
            type="button"
            className="mt-2 flex items-center gap-1 text-[11px] font-medium text-primary"
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
