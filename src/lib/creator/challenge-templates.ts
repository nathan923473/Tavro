import type { ChallengeCategory } from "@/types/creator-studio";

export type ChallengeTemplateKey =
  | "walking_7"
  | "healthy_habits_14"
  | "consistency_30"
  | "beginner_fitness_14"
  | "movement_21"
  | "kickstart_7"
  | "scratch"
  | "walking"
  | "strength"
  | "running"
  | "healthy_habits"
  | "general_fitness";

export type TemplateScheduleItem = {
  dayLabel: string;
  title: string;
  body: string;
  isRest: boolean;
  weekTheme: string | null;
};

/** A reusable starting point. Applying it copies these fields into a new draft. */
export type ChallengeTemplate = {
  key: string;
  label: string;
  category: ChallengeCategory;
  title: string;
  shortDescription: string;
  description: string;
  goalDescription: string;
  durationDays: number;
  participantSummary: string;
  schedule: TemplateScheduleItem[];
};

export const CATEGORY_LABELS: Record<ChallengeCategory, string> = {
  walking: "Walking",
  strength: "Strength",
  running: "Running",
  general_fitness: "General fitness",
  healthy_habits: "Healthy habits",
  sleep: "Sleep",
  wellness: "Wellness",
  other: "Other",
};

type DayInput = {
  title: string;
  body?: string;
  rest?: boolean;
  week?: string;
};

function plan(days: DayInput[]): TemplateScheduleItem[] {
  let week: string | null = null;
  return days.map((day, index) => {
    if (day.week) week = day.week;
    return {
      dayLabel: `Day ${index + 1}`,
      title: day.title,
      body: day.body ?? "",
      isRest: Boolean(day.rest),
      weekTheme: day.week ?? week,
    };
  });
}

function consistencyPlan(): TemplateScheduleItem[] {
  const weeks = [
    "Week 1 · Show up",
    "Week 2 · Repeat it",
    "Week 3 · Make it easier",
    "Week 4 · Finish steady",
  ];
  return Array.from({ length: 30 }, (_, index) => {
    const day = index + 1;
    const weekIndex = Math.min(3, Math.floor(index / 7));
    const recovery = index % 7 === 6;
    return {
      dayLabel: `Day ${day}`,
      title: recovery ? "Easy recovery day" : "Complete your daily goal",
      body: "",
      isRest: recovery,
      weekTheme: weeks[weekIndex],
    };
  });
}

function movementPlan(): TemplateScheduleItem[] {
  const weeks = [
    "Week 1 · Get moving",
    "Week 2 · Build the rhythm",
    "Week 3 · Keep it going",
  ];
  const sessions = [
    [15, "easy movement"],
    [15, "mobility"],
    [15, "bodyweight strength"],
    [20, "easy cardio"],
    [15, "easy movement"],
    [15, "mobility"],
    [20, "any movement you enjoy"],
  ] as const;
  return Array.from({ length: 21 }, (_, index) => {
    const week = Math.floor(index / 7);
    const [minutes, kind] = sessions[index % 7];
    const duration = minutes + week * 5;
    return {
      dayLabel: `Day ${index + 1}`,
      title: `${duration}-minute ${kind}`,
      body: "",
      isRest: false,
      weekTheme: weeks[week],
    };
  });
}

const LIBRARY_TEMPLATES: ChallengeTemplate[] = [
  {
    key: "walking_7",
    label: "7-Day Walking Challenge",
    category: "walking",
    title: "7-Day Walking Challenge",
    shortDescription: "Build a daily walking habit with step targets you can change.",
    description:
      "Walk each day and check it off when you finish. Split the steps into shorter outings if you need to. A daily check-in is there if you want to note how it felt. Change any step target before you publish.",
    goalDescription:
      "Build a daily walking habit. Finish each day’s step target at an easy pace — consistency matters more than speed.",
    durationDays: 7,
    participantSummary: "Daily step target, check-off, and optional check-in.",
    schedule: plan([
      { title: "Walk 5,000 steps", week: "Week 1 · Build the habit" },
      { title: "Walk 6,000 steps" },
      { title: "Walk 6,000 steps" },
      { title: "Walk 7,000 steps" },
      { title: "Walk 7,000 steps" },
      { title: "Walk 8,000 steps" },
      { title: "Walk 8,000 steps" },
    ]),
  },
  {
    key: "healthy_habits_14",
    label: "14-Day Healthy Habits Challenge",
    category: "healthy_habits",
    title: "14-Day Healthy Habits Challenge",
    shortDescription: "Small daily habits for movement, hydration, sleep, and nutrition.",
    description:
      "Each day has a short list of habits. Check off the ones you complete and leave a check-in if you want. Remove any habit that does not fit, or swap in your own.",
    goalDescription:
      "Develop a few sustainable habits across movement, hydration, sleep, and nutrition. Small repeats beat a perfect week.",
    durationDays: 14,
    participantSummary: "Daily movement, hydration, sleep, and nutrition habits with check-ins.",
    schedule: plan([
      {
        title: "15 minutes of easy movement",
        body: "Drink water with each meal",
        week: "Week 1 · Start small",
      },
      { title: "Add vegetables to one meal", body: "Dim the lights 30 minutes before bed" },
      { title: "10-minute mobility session", body: "Fill a water bottle in the morning" },
      { title: "Include protein with one meal", body: "15 minutes of easy movement" },
      { title: "Screens off 30 minutes before bed", body: "Eat a piece of fruit or some vegetables" },
      { title: "20 minutes of easy movement", body: "Drink water before each meal" },
      { title: "Repeat your easiest habit from this week", body: "Aim for an earlier night" },
      {
        title: "20 minutes of easy movement",
        body: "Drink water with each meal",
        week: "Week 2 · Keep what works",
      },
      { title: "Vegetables with two meals", body: "Keep the same bedtime as last night" },
      { title: "15-minute mobility session", body: "Drink water when you wake up" },
      { title: "Build a plate with protein and plants", body: "20 minutes of easy movement" },
      { title: "No screens 30 minutes before bed", body: "Fruit or vegetables once today" },
      { title: "25 minutes of easy movement", body: "Drink water before meals" },
      { title: "Repeat the habit you want to keep", body: "Note one habit you will continue" },
    ]),
  },
  {
    key: "consistency_30",
    label: "30-Day Consistency Challenge",
    category: "general_fitness",
    title: "30-Day Consistency Challenge",
    shortDescription: "A month of showing up, with a daily goal you define.",
    description:
      "Replace “your daily goal” with the session you want people to repeat. Each week is labeled as a milestone in the plan. Participants check the day off and can leave a check-in. Recovery days are optional — turn them into training days if you prefer.",
    goalDescription:
      "Help people maintain one fitness habit for 30 days. The daily goal should be specific enough to finish, and easy enough to repeat.",
    durationDays: 30,
    participantSummary: "A creator-defined daily goal, weekly milestones, and progress check-offs.",
    schedule: consistencyPlan(),
  },
  {
    key: "beginner_fitness_14",
    label: "14-Day Beginner Fitness Challenge",
    category: "general_fitness",
    title: "14-Day Beginner Fitness Challenge",
    shortDescription: "A simple mix of short workouts, easy cardio, and rest days.",
    description:
      "Workouts are suggestions. Edit the movements, swap a session, or turn a rest day into training. Participants mark each day complete and can add a check-in.",
    goalDescription:
      "Help beginners establish an exercise routine they can repeat. Effort stays moderate, and rest days are part of the plan.",
    durationDays: 14,
    participantSummary: "Short workouts and rest days, with a daily completion check-off.",
    schedule: plan([
      {
        title: "Beginner full-body workout",
        body: "Squats, wall push-ups, and glute bridges",
        week: "Week 1 · Learn the routine",
      },
      { title: "Rest", rest: true },
      { title: "20 minutes of easy cardio" },
      { title: "Beginner full-body workout", body: "Squats, wall push-ups, and a short plank" },
      { title: "Rest", rest: true },
      { title: "15-minute mobility session" },
      { title: "Rest", rest: true },
      {
        title: "Beginner full-body workout",
        body: "Repeat week 1, or add one extra round",
        week: "Week 2 · Repeat the routine",
      },
      { title: "Rest", rest: true },
      { title: "25 minutes of easy cardio" },
      { title: "Beginner full-body workout", body: "Squats, wall push-ups, and glute bridges" },
      { title: "Rest", rest: true },
      { title: "15-minute mobility session" },
      { title: "Easy full-body workout", body: "Finish with the session that felt best" },
    ]),
  },
  {
    key: "movement_21",
    label: "21-Day Movement Challenge",
    category: "general_fitness",
    title: "21-Day Movement Challenge",
    shortDescription: "Daily movement with sessions and durations you can rewrite.",
    description:
      "Every day asks for some movement. Change the exercise, the minutes, or both. Participants check the session off and can leave a daily check-in. Progress is the days they complete.",
    goalDescription:
      "Encourage regular physical activity for 21 days. Any movement counts if it matches the intention of the day.",
    durationDays: 21,
    participantSummary: "A daily movement session with a duration you can edit.",
    schedule: movementPlan(),
  },
  {
    key: "kickstart_7",
    label: "7-Day Fitness Kickstart",
    category: "general_fitness",
    title: "7-Day Fitness Kickstart",
    shortDescription: "One week of simple movement and one healthy habit each day.",
    description:
      "Keep the sessions short. Participants check off the movement and the habit, and can leave a daily check-in. When the challenge ends, they see how many days they completed.",
    goalDescription:
      "Help people begin a healthier routine with simple daily movement and one habit. Finishing the week matters more than intensity.",
    durationDays: 7,
    participantSummary: "Daily movement, one healthy habit, check-ins, and an end-of-challenge summary.",
    schedule: plan([
      {
        title: "15 minutes of easy movement",
        body: "Drink water with breakfast",
        week: "Kickstart week",
      },
      { title: "15-minute mobility session", body: "Add vegetables to one meal" },
      { title: "20 minutes of easy movement", body: "Start winding down 30 minutes earlier" },
      { title: "15-minute beginner workout", body: "Drink water with each meal" },
      { title: "20 minutes of easy movement", body: "Take a calm 10-minute break" },
      { title: "Repeat your favourite session", body: "Keep one simple meal habit" },
      {
        title: "Final 15-minute session",
        body: "Note one habit you will keep",
        week: "Finish · Review the week",
      },
    ]),
  },
];

const SCRATCH_TEMPLATE: ChallengeTemplate = {
  key: "scratch",
  label: "Start from scratch",
  category: "other",
  title: "",
  shortDescription: "",
  description: "",
  goalDescription: "",
  durationDays: 0,
  participantSummary: "",
  schedule: [],
};

const ALIASES: Record<string, string> = {
  walking: "walking_7",
  healthy_habits: "healthy_habits_14",
  general_fitness: "beginner_fitness_14",
  strength: "beginner_fitness_14",
  running: "movement_21",
};

function cloneTemplate(template: ChallengeTemplate): ChallengeTemplate {
  return {
    ...template,
    schedule: template.schedule.map((item) => ({ ...item })),
  };
}

export const CHALLENGE_TEMPLATES: ChallengeTemplate[] = [
  ...LIBRARY_TEMPLATES,
  SCRATCH_TEMPLATE,
];

export function libraryTemplates(): ChallengeTemplate[] {
  return LIBRARY_TEMPLATES.map(cloneTemplate);
}

export function templateByKey(key: string): ChallengeTemplate {
  if (key === "scratch") return cloneTemplate(SCRATCH_TEMPLATE);
  const canonical = ALIASES[key] ?? key;
  const template = LIBRARY_TEMPLATES.find((item) => item.key === canonical) ?? SCRATCH_TEMPLATE;
  return cloneTemplate(template);
}

export function findLibraryTemplate(key: string): ChallengeTemplate | null {
  if (key === "scratch") return null;
  const canonical = ALIASES[key] ?? key;
  const template = LIBRARY_TEMPLATES.find((item) => item.key === canonical);
  return template ? cloneTemplate(template) : null;
}
