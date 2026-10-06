export type ChallengePublishStatus = "draft" | "scheduled" | "published" | "archived";

export type ChallengeCategory =
  | "walking"
  | "strength"
  | "running"
  | "general_fitness"
  | "healthy_habits"
  | "sleep"
  | "wellness"
  | "other";

export type StudioChallengeBucket = "active" | "upcoming" | "drafts" | "completed";

export type CreatorStudioChallenge = {
  id: string;
  title: string;
  shortDescription: string | null;
  inviteSlug: string;
  coverUrl: string | null;
  startDate: string;
  endDate: string;
  publishStatus: ChallengePublishStatus;
  category: ChallengeCategory | null;
  participantCount: number;
  activeThisWeek: number;
  bucket: StudioChallengeBucket;
};

export type ChallengeScheduleItem = {
  id: string;
  sortOrder: number;
  dayLabel: string;
  title: string;
  body: string | null;
  isRest: boolean;
  weekTheme: string | null;
};

export type CreatorAnnouncement = {
  id: string;
  title: string;
  body: string;
  imageUrl: string | null;
  publishAt: string;
  challengeId: string | null;
  challengeTitle: string | null;
};

export type CreatorLinkRow = {
  id: string;
  linkType: string;
  label: string;
  url: string;
  sortOrder: number;
  isPublic: boolean;
  clickCount?: number;
};

export type CreatorLinkAnalytics = {
  totalClicks: number;
  clicksLast7Days: number;
  links: Array<
    CreatorLinkRow & {
      clickCount: number;
      clicksLast7Days: number;
    }
  >;
};

export type CreatorStudioOverview = {
  communityName: string | null;
  communitySlug: string | null;
  totalFollowers: number;
  newFollowersThisMonth: number;
  newFollowersThisWeek: number;
  activeChallengeCount: number;
  currentChallenge: CreatorStudioChallenge | null;
  otherActiveChallenges: CreatorStudioChallenge[];
  growthByWeek: { label: string; count: number }[];
  recentActivity: { id: string; label: string; at: string }[];
};
