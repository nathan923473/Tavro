import type { FounderMetricDisplayState } from "@/types/founder-analytics";

export function resolveMetricDisplayState(input: {
  value: number | null;
  status: "ok" | "partial" | "unavailable";
  unavailableReason?: string;
  denominator?: number | null;
}): FounderMetricDisplayState {
  if (input.status === "unavailable" || input.unavailableReason?.includes("Not yet available")) {
    return "unavailable";
  }

  const denom = input.denominator;
  if (denom != null && denom <= 0) {
    return "insufficient";
  }

  if (input.value == null) {
    if (
      input.unavailableReason &&
      /no signups|cannot be measured|no eligible|no landing|add acquisition|not mature|mature portion/i.test(
        input.unavailableReason,
      )
    ) {
      return "insufficient";
    }
    return input.status === "partial" ? "partial_tracking" : "insufficient";
  }

  if (input.value === 0) {
    return "zero";
  }

  if (input.status === "partial") {
    return "partial_tracking";
  }

  return "ok";
}

/** Hide period-over-period change unless both periods have measurable data. */
export function comparisonChangePercent(
  current: number | null,
  previous: number | null,
  currentDenom: number,
  previousDenom: number,
): number | null {
  if (currentDenom <= 0 || previousDenom <= 0) return null;
  if (current == null || previous == null) return null;
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}
