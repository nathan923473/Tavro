import type { GoalCategory } from "@/types";

export type HabitPreset = {
  key: string;
  label: string;
  category: GoalCategory;
  frequencyType: "daily" | "times_per_week";
  frequencyTarget: number;
};

export const HABIT_PRESETS: HabitPreset[] = [
  {
    key: "walk",
    label: "Walking",
    category: "movement",
    frequencyType: "daily",
    frequencyTarget: 7,
  },
  {
    key: "gym",
    label: "Gym / strength training",
    category: "movement",
    frequencyType: "times_per_week",
    frequencyTarget: 3,
  },
  {
    key: "run",
    label: "Running",
    category: "movement",
    frequencyType: "times_per_week",
    frequencyTarget: 3,
  },
  {
    key: "movement",
    label: "Daily movement",
    category: "movement",
    frequencyType: "daily",
    frequencyTarget: 7,
  },
  {
    key: "hydration",
    label: "Hydration",
    category: "nutrition",
    frequencyType: "daily",
    frequencyTarget: 7,
  },
  {
    key: "sleep",
    label: "Sleep routine",
    category: "routine",
    frequencyType: "daily",
    frequencyTarget: 7,
  },
  {
    key: "meals",
    label: "Healthy meals",
    category: "nutrition",
    frequencyType: "daily",
    frequencyTarget: 7,
  },
  {
    key: "mindfulness",
    label: "Mindfulness",
    category: "mindfulness",
    frequencyType: "times_per_week",
    frequencyTarget: 4,
  },
];

export const CUSTOM_HABIT_PRESET_KEY = "custom";

export function presetByKey(key: string) {
  return HABIT_PRESETS.find((p) => p.key === key);
}
