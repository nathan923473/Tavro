"use client";

import { EventHealthStrip } from "@/components/admin/founder-analytics/event-health-strip";
import { FounderMetricCard } from "@/components/admin/founder-analytics/metric-card";
import type { FounderAnalyticsSnapshot } from "@/types/founder-analytics";
import Link from "next/link";
import { useMemo, useState } from "react";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "growth", label: "Growth" },
  { id: "retention", label: "Retention" },
  { id: "defensibility", label: "Defensibility" },
  { id: "revenue", label: "Revenue" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const PRESETS = [
  { id: "7d", label: "7d" },
  { id: "30d", label: "30d" },
  { id: "90d", label: "90d" },
  { id: "12m", label: "12m" },
] as const;

export function FounderAnalyticsDashboard({
  snapshot,
  preset,
}: {
  snapshot: FounderAnalyticsSnapshot;
  preset: string;
}) {
  const [tab, setTab] = useState<TabId>("overview");

  const metrics = useMemo(() => {
    if (tab === "growth") return snapshot.growth;
    if (tab === "retention") return snapshot.retention;
    if (tab === "defensibility") return snapshot.defensibility;
    if (tab === "revenue") return snapshot.revenue;
    return snapshot.overview;
  }, [tab, snapshot]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-foreground">{snapshot.range.label}</p>
          <div className="-mx-1 grid grid-cols-4 gap-1.5 sm:mx-0 sm:flex sm:flex-wrap sm:gap-2">
            {PRESETS.map((p) => (
              <Link
                key={p.id}
                href={`/admin/analytics?preset=${p.id}`}
                className={`flex min-h-9 items-center justify-center rounded-lg px-2 text-center text-xs font-semibold sm:rounded-full sm:px-3 ${
                  preset === p.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {p.label}
              </Link>
            ))}
          </div>
        </div>
        <EventHealthStrip
          health={snapshot.eventHealth}
          trackingStartedAt={snapshot.trackingStartedAt}
        />
      </div>

      <nav
        className="flex gap-1 overflow-x-auto rounded-xl bg-muted/50 p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Metric categories"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold sm:text-sm ${
              tab === t.id ? "bg-surface shadow-sm" : "text-muted-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {!snapshot.schemaReady ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Run{" "}
          <code className="text-xs">supabase/migrations/023_founder_analytics.sql</code> in Supabase,
          then refresh.
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 md:gap-3 xl:grid-cols-3">
        {metrics.map((m) => (
          <FounderMetricCard key={`${tab}-${m.id}`} metric={m} />
        ))}
      </div>
    </div>
  );
}
