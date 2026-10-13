import type { ChallengeCategory } from "@/types/creator-studio";
import type { ChallengeScheduleItem } from "@/types/creator-studio";

export type ChallengeTemplateKey =
  | "walking"
  | "strength"
  | "running"
  | "healthy_habits"
  | "general_fitness"
  | "scratch";

export type ChallengeTemplate = {
  key: ChallengeTemplateKey;
  label: string;
  category: ChallengeCategory;
  title: string;
  shortDescription: string;
  goalDescription: string;
  schedule: Omit<ChallengeScheduleItem, "id">[];
};

function day(
  sortOrder: number,
  dayLabel: string,
  title: string,
  body: string,
  isRest = false,
): Omit<ChallengeScheduleItem, "id"> {
  return {
    sortOrder,
    dayLabel,
    title,
    body,
    isRest,
    weekTheme: null,
  };
}

export const CHALLENGE_TEMPLATES: ChallengeTemplate[] = [
  {
    key: "walking",
    label: "Walking Challenge",
    category: "walking",
    title: "30-Day Walking Challenge",
    shortDescription: "Build a steady walking habit at your own pace.",
    goalDescription:
      "Aim for about 30 minutes of walking on most days this month. Rest when you need it — consistency beats intensity.",
    schedule: [
      day(0, "Day 1", "30-minute walk", "Easy pace. Notice how you feel before and after."),
      day(1, "Day 2", "30-minute walk", "Same duration — choose a route you enjoy."),
      day(2, "Day 3", "Recovery / rest", "Optional gentle stretch or short stroll."),
      day(3, "Day 4", "30-minute walk", "Invite a friend or listen to a favorite podcast."),
    ],
  },
  {
    key: "strength",
    label: "Strength Challenge",
    category: "strength",
    title: "4-Week Strength Foundations",
    shortDescription: "Simple bodyweight or light resistance sessions.",
    goalDescription:
      "Complete short strength sessions several days per week. Modify movements to match your level — no extreme targets.",
    schedule: [
      day(0, "Day 1", "Full-body session", "Squats, push-ups (incline ok), rows — 2 rounds."),
      day(1, "Day 2", "Rest or mobility", "5–10 minutes of stretching."),
      day(2, "Day 3", "Full-body session", "Repeat Day 1 or swap in lunges and planks."),
    ],
  },
  {
    key: "running",
    label: "Running Challenge",
    category: "running",
    title: "Couch-to-Consistency Run",
    shortDescription: "Run/walk intervals to build endurance gently.",
    goalDescription:
      "Alternate running and walking for short blocks. Stop if something hurts — this is about showing up, not speed records.",
    schedule: [
      day(0, "Day 1", "Run/walk intervals", "1 min jog / 2 min walk × 8."),
      day(1, "Day 2", "Rest", "Hydrate and sleep well."),
      day(2, "Day 3", "Run/walk intervals", "Same structure — keep effort conversational."),
    ],
  },
  {
    key: "healthy_habits",
    label: "Healthy Habits Challenge",
    category: "healthy_habits",
    title: "Daily Healthy Habits Reset",
    shortDescription: "Small daily actions: movement, hydration, sleep wind-down.",
    goalDescription:
      "Pick one or two habits from the daily prompts. Link them in Personal Progress if you want them on Home.",
    schedule: [
      day(0, "Day 1", "Hydration check-in", "A glass of water with each meal."),
      day(1, "Day 2", "Movement snack", "10-minute walk or stretch break."),
      day(2, "Day 3", "Sleep wind-down", "Screens off 30 minutes before bed."),
    ],
  },
  {
    key: "general_fitness",
    label: "General Fitness Challenge",
    category: "general_fitness",
    title: "Move More This Month",
    shortDescription: "Mix cardio, strength, and recovery across the week.",
    goalDescription:
      "Complete the daily activity or swap in something equivalent that feels good for your body.",
    schedule: [
      day(0, "Mon", "Cardio", "20–30 minutes brisk walk or bike."),
      day(1, "Tue", "Strength", "15-minute bodyweight circuit."),
      day(2, "Wed", "Rest", "Optional light walk."),
    ],
  },
  {
    key: "scratch",
    label: "Start From Scratch",
    category: "other",
    title: "",
    shortDescription: "",
    goalDescription: "",
    schedule: [],
  },
];

export function templateByKey(key: ChallengeTemplateKey): ChallengeTemplate {
  return CHALLENGE_TEMPLATES.find((t) => t.key === key) ?? CHALLENGE_TEMPLATES[5];
}
