import type { GroupFocusType } from "@/types";

export const GROUP_FOCUS_OPTIONS: { value: GroupFocusType; label: string }[] = [
  { value: "walking", label: "Walking & daily movement" },
  { value: "gym", label: "Gym & workout consistency" },
  { value: "nutrition", label: "Healthy eating habits" },
  { value: "weight_loss", label: "Weight-loss accountability" },
  { value: "routines", label: "Building healthy routines" },
  { value: "general", label: "General fitness & habits" },
  { value: "custom", label: "Custom focus…" },
];

export function groupFocusLabel(
  focus: GroupFocusType,
  focusCustomLabel?: string | null,
): string {
  if (focus === "custom") {
    const custom = focusCustomLabel?.trim();
    return custom || "Custom focus";
  }
  return GROUP_FOCUS_OPTIONS.find((o) => o.value === focus)?.label ?? "General fitness & habits";
}
