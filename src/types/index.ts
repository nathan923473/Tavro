export type GoalCategory =
  | "movement"
  | "nutrition"
  | "mindfulness"
  | "routine";

export type HabitFrequencyType = "daily" | "times_per_week";

export type PersonalGoal = {
  id: string;
  title: string;
  category: GoalCategory;
  completedToday: boolean;
  streakDays: number;
  weeklyCompletion: number;
  templateKey: string | null;
  frequencyType: HabitFrequencyType;
  frequencyTarget: number;
  paused: boolean;
  linkedChallengeId: string | null;
};

export type DailyCheckInMood = "rough" | "okay" | "good" | "great";

export type MemberMilestone = {
  key: string;
  label: string;
  unlockedAt: string;
};

/** Launch model: all challenges are free; no paid tiers in MVP. */
export type Challenge = {
  id: string;
  title: string;
  creatorName: string;
  creatorId: string;
  description: string;
  startDate: string;
  endDate: string;
  startAt?: string | null;
  endAt?: string | null;
  challengeTimezone?: string | null;
  participants: number;
  joined: boolean;
  progressPercent: number;
  inviteSlug: string;
  focusAreas: string[];
  coverUrl: string | null;
  galleryPhotos: string[];
  /** When loaded for public/join pages — used for content reports */
  galleryPhotoItems?: { id: string; imageUrl: string }[];
};

export type GroupMember = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  checkedInToday: boolean;
};

export type AccountabilityGroup = {
  id: string;
  name: string;
  memberCount: number;
  maxMembers: number;
  members: GroupMember[];
  recentMessage: string;
  checkInStreak: number;
  inviteCode: string;
};

export type GroupActivity = {
  id: string;
  author: string;
  authorId: string;
  message: string;
  timeAgo: string;
  reactions: number;
};

export type ConsistencySnapshot = {
  label: string;
  value: number;
  target: number;
};

export type DemoUser = {
  firstName: string;
  joinedGroup: boolean;
  groupName?: string;
  primaryGoals: string[];
  habits: string[];
  isCreator: boolean;
  referralCode: string;
};

/** Voluntary social share — no weight numbers required. */
export type AchievementCard = {
  id: string;
  headline: string;
  subline: string;
  streakDays: number;
  consistencyPercent: number;
  generatedAt: string;
};

export type WeightUnit = "lb" | "kg";

export type WeeklyWeighIn = {
  id: string;
  date: string;
  label: string;
  weight: number;
};

export type WeightProgressSummary = {
  unit: WeightUnit;
  startWeight: number;
  currentWeight: number;
  goalWeight?: number;
};

export type CreatorAnalyticsSnapshot = {
  inviteLinkClicks: number;
  signUpsFromInvites: number;
  dailyActiveParticipants: number;
  challengeJoins: number;
  referralSignUps: number;
  periodLabel: string;
};
