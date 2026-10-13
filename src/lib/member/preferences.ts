export const WORK_TOWARDS_OPTIONS = [
  { value: "manage_weight", label: "Manage my weight" },
  { value: "healthier_habits", label: "Build healthier habits" },
  { value: "improve_fitness", label: "Improve my fitness" },
  { value: "more_active", label: "Become more active" },
  { value: "stay_consistent", label: "Stay consistent with my goals" },
] as const;

export type WorkTowards = (typeof WORK_TOWARDS_OPTIONS)[number]["value"];

export const GROWTH_FRICTION_OPTIONS = [
  { value: "motivation", label: "Staying motivated" },
  { value: "consistency", label: "Being consistent" },
  { value: "knowing_what_to_do", label: "Knowing what to do" },
  { value: "support", label: "Finding people to support me" },
  { value: "getting_back_on_track", label: "Getting back on track after missing days" },
] as const;

export type GrowthFriction = (typeof GROWTH_FRICTION_OPTIONS)[number]["value"];

export type MemberGoalPreferences = {
  workTowards: WorkTowards | null;
  growthFriction: GrowthFriction | null;
};

export function isWorkTowards(v: string): v is WorkTowards {
  return WORK_TOWARDS_OPTIONS.some((o) => o.value === v);
}

export function isGrowthFriction(v: string): v is GrowthFriction {
  return GROWTH_FRICTION_OPTIONS.some((o) => o.value === v);
}

export function workTowardsLabel(value: WorkTowards | null | undefined): string {
  if (!value) return "";
  return WORK_TOWARDS_OPTIONS.find((o) => o.value === value)?.label ?? "";
}

export function growthFrictionLabel(value: GrowthFriction | null | undefined): string {
  if (!value) return "";
  return GROWTH_FRICTION_OPTIONS.find((o) => o.value === value)?.label ?? "";
}

/** Rule-based challenge focus hints for sorting (not AI). */
export function challengeFocusHintsForWorkTowards(
  workTowards: WorkTowards | null,
): string[] {
  switch (workTowards) {
    case "manage_weight":
      return ["movement", "nutrition", "habits", "walking", "weight"];
    case "healthier_habits":
      return ["nutrition", "habits", "routine", "wellness"];
    case "improve_fitness":
      return ["fitness", "workout", "strength", "training"];
    case "more_active":
      return ["walking", "movement", "steps", "active"];
    case "stay_consistent":
      return ["accountability", "habits", "consistency"];
    default:
      return [];
  }
}

export function scoreChallengeForPreferences(
  focusAreas: string[],
  workTowards: WorkTowards | null,
  growthFriction: GrowthFriction | null,
): number {
  const hints = challengeFocusHintsForWorkTowards(workTowards);
  let score = 0;
  const joined = focusAreas.join(" ").toLowerCase();
  for (const h of hints) {
    if (joined.includes(h)) score += 2;
  }
  if (growthFriction === "support" || growthFriction === "consistency") {
    if (joined.includes("accountability") || joined.includes("group")) score += 1;
  }
  return score;
}
