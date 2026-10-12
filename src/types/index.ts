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
  /** Bit 0 = Monday … bit 6 = Sunday. 127 = every day. */
  scheduleDaysMask: number;
  /** `HH:MM`, or null when the habit has no set time. */
  reminderTime: string | null;
  paused: boolean;
  linkedChallengeId: string | null;
  /** Accountability group this habit is shared with. Null stays private. */
  sharedGroupId: string | null;
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
  creatorAvatarUrl?: string | null;
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

export type GroupJoinMode = "approval" | "auto";

export type GroupJoinRequest = {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
};

export type GroupFocusType =
  | "walking"
  | "gym"
  | "nutrition"
  | "weight_loss"
  | "routines"
  | "general"
  | "custom";

export type GroupDailyCheckInStatus = "completed" | "partial" | "missed" | "rest";

export type GroupSharedCommitment = {
  shareId: string;
  goalId: string;
  userId: string;
  displayName: string;
  title: string;
  targetCount: number;
  progressCount: number;
  completedToday: boolean;
  paused: boolean;
  isOwn: boolean;
  celebratedByViewer: boolean;
  celebrationCount: number;
};

export type GroupSharedReflection = {
  userId: string;
  displayName: string;
  body: string;
  isOwn: boolean;
};

export type GroupWeeklyCommitment = {
  id: string;
  userId: string;
  displayName: string;
  title: string;
  targetCount: number;
  progressCount: number;
  isOwn: boolean;
};

export type GroupPersonalScheduleType =
  | "daily"
  | "every_n_days"
  | "weekdays"
  | "times_per_week";

export type GroupMemberPersonalGoal = {
  userId: string;
  title: string;
  scheduleType: GroupPersonalScheduleType;
  scheduleInterval: number;
  scheduleWeekdays: number[];
  timesPerWeek: number;
  scheduleAnchor: string;
  scheduleLabel: string;
};

export type GroupCheckInReactionKey = "clap" | "fire" | "muscle" | "heart";

export type GroupCheckInReactionCounts = Record<GroupCheckInReactionKey, number>;

export const GROUP_CHECK_IN_REACTION_LABELS: Record<
  GroupCheckInReactionKey,
  { emoji: string; label: string }
> = {
  clap: { emoji: "👏", label: "Well done" },
  fire: { emoji: "🔥", label: "Keep going" },
  muscle: { emoji: "💪", label: "Nice work" },
  heart: { emoji: "❤️", label: "Support" },
};

export type GroupCheckInBoardMember = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  status: GroupDailyCheckInStatus | null;
  note: string;
  checkedIn: boolean;
  scheduledToday: boolean;
  personalGoalTitle: string;
  reactions: GroupCheckInReactionCounts;
  viewerReactionKeys: GroupCheckInReactionKey[];
};

export type GroupRecentCheckIn = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  status: GroupDailyCheckInStatus;
  note: string;
  checkInDate: string;
  timeAgo: string;
  reactions: GroupCheckInReactionCounts;
  viewerReactionKeys: GroupCheckInReactionKey[];
};

export type GroupFeedItem = {
  id: string;
  kind: "message" | "achievement" | "check_in" | "commitment" | "encouragement";
  author: string;
  authorId: string;
  message: string;
  timeAgo: string;
  reactions: number;
  messageId?: string;
};

export type GroupWeeklyRecap = {
  weekStart: string;
  commitmentCompletionPct: number;
  checkInsCount: number;
  encouragementsCount: number;
  highlights: string[];
  reflectionPrompt: string;
};

export type AccountabilityGroup = {
  id: string;
  name: string;
  goal: string;
  description: string;
  focusType: GroupFocusType;
  focusCustomLabel: string;
  sharedGoal: string;
  memberCount: number;
  maxMembers: number;
  minMembers: number;
  isActive: boolean;
  members: GroupMember[];
  recentMessage: string;
  checkInStreak: number;
  inviteCode: string;
  joinMode: GroupJoinMode;
  invitesEnabled: boolean;
  ownerId: string;
  isOwner: boolean;
  pendingRequests: GroupJoinRequest[];
  weekStart: string;
  weeklyCommitments: GroupWeeklyCommitment[];
  checkInBoard: GroupCheckInBoardMember[];
  viewerCheckInStatus: GroupDailyCheckInStatus | null;
  viewerPausedUntil: string | null;
  weeklyRecap: GroupWeeklyRecap | null;
  viewerPersonalGoal: GroupMemberPersonalGoal | null;
  memberPersonalGoals: GroupMemberPersonalGoal[];
  recentCheckIns: GroupRecentCheckIn[];
  viewerScheduledToday: boolean;
  sharedCommitments: GroupSharedCommitment[];
  sharedReflections: GroupSharedReflection[];
};

export type GroupActivity = GroupFeedItem;

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
