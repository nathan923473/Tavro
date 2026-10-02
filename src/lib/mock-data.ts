import type {
  AccountabilityGroup,
  AchievementCard,
  Challenge,
  ConsistencySnapshot,
  CreatorAnalyticsSnapshot,
  DemoUser,
  GroupActivity,
  PersonalGoal,
  WeightProgressSummary,
  WeeklyWeighIn,
} from "@/types";

export const demoUser: DemoUser = {
  firstName: "Jordan",
  joinedGroup: true,
  groupName: "Morning Momentum",
  primaryGoals: ["Build consistent movement", "Improve daily energy"],
  habits: ["Daily walk", "Water intake", "Evening wind-down"],
  isCreator: false,
  referralCode: "jordan-7k2m",
};

export const demoCreatorAnalytics: CreatorAnalyticsSnapshot = {
  inviteLinkClicks: 1240,
  signUpsFromInvites: 186,
  dailyActiveParticipants: 94,
  challengeJoins: 312,
  referralSignUps: 48,
  periodLabel: "Last 7 days",
};

export const latestAchievement: AchievementCard = {
  id: "ach1",
  headline: "12 days of showing up",
  subline: "Movement & mindfulness — at my own pace",
  streakDays: 12,
  consistencyPercent: 78,
  generatedAt: "2026-10-02",
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

export const myChallenges: Challenge[] = [
  {
    id: "c1",
    title: "7-Day Gentle Reset",
    creatorName: "Coach Riley",
    creatorId: "creator-riley",
    description:
      "Small daily wins: walk, hydrate, and one nourishing meal. No weigh-ins.",
    startDate: "2026-09-28",
    endDate: "2026-10-05",
    participants: 842,
    joined: true,
    progressPercent: 57,
    inviteSlug: "gentle-reset-riley",
    focusAreas: ["Consistency", "Hydration", "Gentle movement"],
  },
];

export const discoverChallenges: Challenge[] = [
  {
    id: "c2",
    title: "Walk Before Coffee",
    creatorName: "Alex Fit",
    creatorId: "creator-alex",
    description:
      "Start mornings with 10 minutes outside — no perfection required.",
    startDate: "2026-10-01",
    endDate: "2026-10-31",
    participants: 1204,
    joined: false,
    progressPercent: 0,
    inviteSlug: "walk-before-coffee",
    focusAreas: ["Morning routine", "Steps"],
  },
  {
    id: "c3",
    title: "Hydration & High-Fives",
    creatorName: "Coach Riley",
    creatorId: "creator-riley",
    description:
      "Hit your water goal and send one encouragement to a group mate daily.",
    startDate: "2026-10-08",
    endDate: "2026-10-22",
    participants: 456,
    joined: false,
    progressPercent: 0,
    inviteSlug: "hydration-high-fives",
    focusAreas: ["Hydration", "Community"],
  },
  {
    id: "c4",
    title: "Evening Wind-Down Club",
    creatorName: "Sam Wellness",
    creatorId: "creator-sam",
    description:
      "Five minutes to stretch, breathe, or journal — build a calmer night routine.",
    startDate: "2026-10-01",
    endDate: "2026-11-01",
    participants: 678,
    joined: false,
    progressPercent: 0,
    inviteSlug: "evening-wind-down",
    focusAreas: ["Sleep hygiene", "Mindfulness"],
  },
];

/** @deprecated Use myChallenges + discoverChallenges */
export const activeChallenges: Challenge[] = [
  ...myChallenges,
  ...discoverChallenges,
];

export const accountabilityGroup: AccountabilityGroup = {
  id: "grp1",
  name: "Morning Momentum",
  memberCount: 6,
  maxMembers: 8,
  checkInStreak: 4,
  recentMessage: "Who’s joining the lunchtime walk today?",
  inviteCode: "morning-momentum-x3",
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

/** Private weekly weigh-ins — demo only; never shown on achievement cards or groups. */
export const weightProgressSummary: WeightProgressSummary = {
  unit: "lb",
  startWeight: 198,
  currentWeight: 191.2,
  goalWeight: 180,
};

export const weeklyWeighIns: WeeklyWeighIn[] = [
  { id: "w1", date: "2026-08-08", label: "Aug 8", weight: 198 },
  { id: "w2", date: "2026-08-15", label: "Aug 15", weight: 197.2 },
  { id: "w3", date: "2026-08-22", label: "Aug 22", weight: 196.8 },
  { id: "w4", date: "2026-08-29", label: "Aug 29", weight: 195.5 },
  { id: "w5", date: "2026-09-05", label: "Sep 5", weight: 195.1 },
  { id: "w6", date: "2026-09-12", label: "Sep 12", weight: 194.0 },
  { id: "w7", date: "2026-09-19", label: "Sep 19", weight: 193.4 },
  { id: "w8", date: "2026-09-26", label: "Sep 26", weight: 192.5 },
  { id: "w9", date: "2026-10-03", label: "Oct 3", weight: 191.2 },
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

export function getChallengeBySlug(slug: string): Challenge | undefined {
  return activeChallenges.find((c) => c.inviteSlug === slug);
}
