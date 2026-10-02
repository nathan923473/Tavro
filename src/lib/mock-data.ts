import type {
  AccountabilityGroup,
  Challenge,
  ConsistencySnapshot,
  DemoUser,
  GroupActivity,
  PersonalGoal,
} from "@/types";

export const demoUser: DemoUser = {
  firstName: "Jordan",
  joinedGroup: true,
  groupName: "Morning Momentum",
  primaryGoals: ["Build consistent movement", "Improve daily energy"],
  habits: ["Daily walk", "Water intake", "Evening wind-down"],
};

export const todaysGoals: PersonalGoal[] = [
  {
    id: "g1",
    title: "20-minute morning walk",
    category: "movement",
    completedToday: true,
    streakDays: 12,
    weeklyCompletion: 6,
  },
  {
    id: "g2",
    title: "Drink 8 glasses of water",
    category: "nutrition",
    completedToday: false,
    streakDays: 5,
    weeklyCompletion: 5,
  },
  {
    id: "g3",
    title: "Strength session or mobility",
    category: "movement",
    completedToday: false,
    streakDays: 8,
    weeklyCompletion: 4,
  },
  {
    id: "g4",
    title: "5-minute gratitude check-in",
    category: "mindfulness",
    completedToday: false,
    streakDays: 21,
    weeklyCompletion: 7,
  },
];

export const activeChallenges: Challenge[] = [
  {
    id: "c1",
    title: "7-Day Gentle Reset",
    creatorName: "Coach Riley",
    description: "Small daily wins: walk, hydrate, and one nourishing meal.",
    startDate: "2026-09-28",
    endDate: "2026-10-05",
    participants: 842,
    joined: true,
    progressPercent: 57,
  },
  {
    id: "c2",
    title: "Walk Before Coffee",
    creatorName: "Alex Fit",
    description: "Start mornings with 10 minutes outside — no perfection required.",
    startDate: "2026-10-01",
    endDate: "2026-10-31",
    participants: 1204,
    joined: false,
    progressPercent: 0,
  },
];

export const accountabilityGroup: AccountabilityGroup = {
  id: "grp1",
  name: "Morning Momentum",
  memberCount: 6,
  checkInStreak: 4,
  recentMessage: "Who’s joining the lunchtime walk today?",
  members: [
    { id: "m1", displayName: "Jordan", checkedInToday: true },
    { id: "m2", displayName: "Sam", checkedInToday: true },
    { id: "m3", displayName: "Priya", checkedInToday: false },
    { id: "m4", displayName: "Marcus", checkedInToday: true },
    { id: "m5", displayName: "Elena", checkedInToday: false },
    { id: "m6", displayName: "Chris", checkedInToday: false },
  ],
};

export const groupFeed: GroupActivity[] = [
  {
    id: "a1",
    author: "Sam",
    message: "Checked in — short walk before work. Small win counts.",
    timeAgo: "2h ago",
    reactions: 4,
  },
  {
    id: "a2",
    author: "Marcus",
    message: "Tough day but I still drank my water goal. Progress > perfect.",
    timeAgo: "4h ago",
    reactions: 6,
  },
  {
    id: "a3",
    author: "Priya",
    message: "Rest day for me — back at it tomorrow.",
    timeAgo: "Yesterday",
    reactions: 3,
  },
];

export const consistencyMetrics: ConsistencySnapshot[] = [
  { label: "Goals completed this week", value: 18, target: 28 },
  { label: "Check-ins logged", value: 5, target: 7 },
  { label: "Active days (30d)", value: 22, target: 30 },
];

export const weeklyProgress = [
  { day: "Mon", completed: 3, total: 4 },
  { day: "Tue", completed: 4, total: 4 },
  { day: "Wed", completed: 2, total: 4 },
  { day: "Thu", completed: 3, total: 4 },
  { day: "Fri", completed: 1, total: 4 },
  { day: "Sat", completed: 0, total: 4 },
  { day: "Sun", completed: 0, total: 4 },
];
