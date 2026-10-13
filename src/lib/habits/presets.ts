import type { GoalCategory } from "@/types";

export type HabitPresetGroup =
  | "movement"
  | "nutrition"
  | "hydration"
  | "sleep"
  | "wellbeing";

export type HabitPreset = {
  key: string;
  label: string;
  group: HabitPresetGroup;
  category: GoalCategory;
  frequencyType: "daily" | "times_per_week";
  frequencyTarget: number;
};

export const HABIT_PRESET_GROUP_LABELS: Record<HabitPresetGroup, string> = {
  movement: "Walking & movement",
  nutrition: "Healthy eating routines",
  hydration: "Hydration habits",
  sleep: "Sleep consistency",
  wellbeing: "General wellbeing",
};

export const HABIT_PRESET_GROUP_ORDER: HabitPresetGroup[] = [
  "movement",
  "nutrition",
  "hydration",
  "sleep",
  "wellbeing",
];

export const HABIT_PRESETS: HabitPreset[] = [
  {
    key: "walk_20_min",
    label: "Walk for 20 minutes",
    group: "movement",
    category: "movement",
    frequencyType: "daily",
    frequencyTarget: 7,
  },
  {
    key: "steps_8000",
    label: "Reach 8,000 steps",
    group: "movement",
    category: "movement",
    frequencyType: "daily",
    frequencyTarget: 7,
  },
  {
    key: "walk_after_meal",
    label: "Take a 10-minute walk after a meal",
    group: "movement",
    category: "movement",
    frequencyType: "daily",
    frequencyTarget: 7,
  },
  {
    key: "complete_workout",
    label: "Complete a workout",
    group: "movement",
    category: "movement",
    frequencyType: "times_per_week",
    frequencyTarget: 3,
  },
  {
    key: "stretch_10",
    label: "Stretch for 10 minutes",
    group: "movement",
    category: "movement",
    frequencyType: "daily",
    frequencyTarget: 7,
  },
  {
    key: "take_stairs",
    label: "Take the stairs",
    group: "movement",
    category: "movement",
    frequencyType: "daily",
    frequencyTarget: 7,
  },
  {
    key: "veg_with_dinner",
    label: "Eat vegetables with dinner",
    group: "nutrition",
    category: "nutrition",
    frequencyType: "daily",
    frequencyTarget: 7,
  },
  {
    key: "eat_fruit",
    label: "Eat a piece of fruit",
    group: "nutrition",
    category: "nutrition",
    frequencyType: "daily",
    frequencyTarget: 7,
  },
  {
    key: "protein_breakfast",
    label: "Include protein with breakfast",
    group: "nutrition",
    category: "nutrition",
    frequencyType: "daily",
    frequencyTarget: 7,
  },
  {
    key: "home_cooked_meal",
    label: "Prepare a home-cooked meal",
    group: "nutrition",
    category: "nutrition",
    frequencyType: "daily",
    frequencyTarget: 7,
  },
  {
    key: "pack_lunch",
    label: "Pack lunch for tomorrow",
    group: "nutrition",
    category: "nutrition",
    frequencyType: "daily",
    frequencyTarget: 7,
  },
  {
    key: "water_each_meal",
    label: "Drink water with each meal",
    group: "hydration",
    category: "nutrition",
    frequencyType: "daily",
    frequencyTarget: 7,
  },
  {
    key: "water_morning",
    label: "Drink a glass of water after waking",
    group: "hydration",
    category: "nutrition",
    frequencyType: "daily",
    frequencyTarget: 7,
  },
  {
    key: "water_bottle",
    label: "Refill my water bottle once today",
    group: "hydration",
    category: "nutrition",
    frequencyType: "daily",
    frequencyTarget: 7,
  },
  {
    key: "bedtime_by_chosen",
    label: "Go to bed by your chosen bedtime",
    group: "sleep",
    category: "routine",
    frequencyType: "daily",
    frequencyTarget: 7,
  },
  {
    key: "avoid_screens_30",
    label: "Avoid screens 30 minutes before bed",
    group: "sleep",
    category: "routine",
    frequencyType: "daily",
    frequencyTarget: 7,
  },
  {
    key: "bedtime_routine_15",
    label: "Follow a 15-minute bedtime routine",
    group: "sleep",
    category: "routine",
    frequencyType: "daily",
    frequencyTarget: 7,
  },
  {
    key: "morning_sunlight",
    label: "Get outside for morning sunlight",
    group: "wellbeing",
    category: "mindfulness",
    frequencyType: "daily",
    frequencyTarget: 7,
  },
  {
    key: "mindful_pause",
    label: "Take a 5-minute mindful pause",
    group: "wellbeing",
    category: "mindfulness",
    frequencyType: "daily",
    frequencyTarget: 7,
  },
  {
    key: "gratitude_note",
    label: "Write one thing that went well today",
    group: "wellbeing",
    category: "mindfulness",
    frequencyType: "daily",
    frequencyTarget: 7,
  },
];

export const CUSTOM_HABIT_PRESET_KEY = "custom";

export function presetByKey(key: string) {
  return HABIT_PRESETS.find((p) => p.key === key);
}

export function presetsForGroup(group: HabitPresetGroup) {
  return HABIT_PRESETS.filter((p) => p.group === group);
}

/** A few popular picks for Home (compact) quick-add. */
export const COMPACT_HABIT_PRESET_KEYS = [
  "walk_20_min",
  "steps_8000",
  "water_each_meal",
  "veg_with_dinner",
  "bedtime_by_chosen",
  "morning_sunlight",
] as const;

export function compactHabitPresets() {
  return COMPACT_HABIT_PRESET_KEYS.map((key) => presetByKey(key)).filter(
    (p): p is HabitPreset => Boolean(p),
  );
}
