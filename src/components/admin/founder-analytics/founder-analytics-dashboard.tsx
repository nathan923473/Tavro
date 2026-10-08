"use client";

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
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{snapshot.range.label}</p>
          {snapshot.trackingStartedAt ? (
            <p className="text-xs text-muted-foreground">
              Event tracking from {new Date(snapshot.trackingStartedAt).toLocaleDateString()}
            </p>
          ) : (
            <p className="text-xs text-amber-700">No events recorded yet — metrics may be partial.</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {(["7d", "30d", "90d", "12m"] as const).map((p) => (
            <Link
              key={p}
              href={`/admin/analytics?preset=${p}`}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                preset === p ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
              }`}
            >
              {p === "7d"
                ? "7 days"
                : p === "30d"
                  ? "30 days"
                  : p === "90d"
                    ? "90 days"
                    : "12 months"}
            </Link>
          ))}
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto rounded-xl bg-muted/50 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.id ? "bg-surface shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {!snapshot.schemaReady ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Analytics schema not ready. Run{" "}
          <code className="text-xs">supabase/migrations/023_founder_analytics.sql</code> in Supabase,
          then refresh.
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((m) => (
          <FounderMetricCard key={m.id} metric={m} />
        ))}
      </div>
    </div>
  );
}
