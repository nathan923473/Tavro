import type { FounderDateRange } from "@/lib/analytics/date-range";

export type FounderMetricStatus = "ok" | "partial" | "unavailable";

/** How the primary value should be read in the UI (distinct from calculation status). */
export type FounderMetricDisplayState =
  | "ok"
  | "zero"
  | "insufficient"
  | "unavailable"
  | "partial_tracking";

export type FounderMetric = {
  id: string;
  label: string;
  definition: string;
  status: FounderMetricStatus;
  displayState: FounderMetricDisplayState;
  value: number | null;
  previousValue: number | null;
  changePercent: number | null;
  unit?: "%" | "count" | "ratio" | "currency";
  unavailableReason?: string;
  series?: { date: string; value: number }[];
  seriesEmptyReason?: string;
  extra?: Record<string, string | number | null>;
};

export type FounderEventHealth = {
  totalEvents: number;
  eventsInRange: number;
  lastEventAt: string | null;
  topTypes: Array<{ eventType: string; count: number }>;
};

export type FounderAnalyticsSnapshot = {
  schemaReady: boolean;
  trackingStartedAt: string | null;
  eventHealth: FounderEventHealth | null;
  range: FounderDateRange;
  overview: FounderMetric[];
  growth: FounderMetric[];
  retention: FounderMetric[];
  defensibility: FounderMetric[];
  revenue: FounderMetric[];
};
