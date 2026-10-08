import type { FounderDateRange } from "@/lib/analytics/date-range";

export type FounderMetricStatus = "ok" | "partial" | "unavailable";

export type FounderMetric = {
  id: string;
  label: string;
  definition: string;
  status: FounderMetricStatus;
  value: number | null;
  previousValue: number | null;
  changePercent: number | null;
  unit?: "%" | "count" | "ratio" | "currency";
  unavailableReason?: string;
  series?: { date: string; value: number }[];
  extra?: Record<string, string | number | null>;
};

export type FounderAnalyticsSnapshot = {
  schemaReady: boolean;
  trackingStartedAt: string | null;
  range: FounderDateRange;
  overview: FounderMetric[];
  growth: FounderMetric[];
  retention: FounderMetric[];
  defensibility: FounderMetric[];
  revenue: FounderMetric[];
};
