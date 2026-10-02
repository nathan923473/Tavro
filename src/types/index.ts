export type GoalCategory =
  | "movement"
  | "nutrition"
  | "mindfulness"
  | "routine";

export type PersonalGoal = {
  id: string;
  title: string;
  category: GoalCategory;
  completedToday: boolean;
  streakDays: number;
  weeklyCompletion: number;
};

export type Challenge = {
  id: string;
  title: string;
  creatorName: string;
  description: string;
  startDate: string;
  endDate: string;
  participants: number;
  joined: boolean;
  progressPercent: number;
};

export type GroupMember = {
  id: string;
  displayName: string;
  checkedInToday: boolean;
};

export type AccountabilityGroup = {
  id: string;
  name: string;
  memberCount: number;
  members: GroupMember[];
  recentMessage: string;
  checkInStreak: number;
};

export type GroupActivity = {
  id: string;
  author: string;
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
};
