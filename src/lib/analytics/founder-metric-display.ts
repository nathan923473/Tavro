import type { FounderMetricDisplayState } from "@/types/founder-analytics";

export function resolveMetricDisplayState(input: {
  value: number | null;
  status: "ok" | "partial" | "unavailable";
  unavailableReason?: string;
}): FounderMetricDisplayState {
  if (input.status === "unavailable" || input.unavailableReason?.includes("Not yet available")) {
    return "unavailable";
  }
  if (
    input.unavailableReason &&
    (input.unavailableReason.includes("No signups") ||
      input.unavailableReason.includes("cannot be measured") ||
      input.unavailableReason.includes("No eligible") ||
      input.unavailableReason.includes("No landing views") ||
      input.unavailableReason.includes("Add acquisition"))
  ) {
    return input.value == null ? "insufficient" : "partial_tracking";
  }
  if (input.value == null) {
    return input.status === "partial" ? "partial_tracking" : "insufficient";
  }
  if (input.value === 0) return "zero";
  if (input.status === "partial") return "partial_tracking";
  return "ok";
}
