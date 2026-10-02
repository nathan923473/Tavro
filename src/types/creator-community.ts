export type ChallengeTimeline = "current" | "upcoming" | "previous";

export type SocialPlatform =
  | "instagram"
  | "tiktok"
  | "youtube"
  | "website";

export type CreatorSocialLink = {
  platform: SocialPlatform;
  label: string;
  url: string;
};

export type CreatorCommunityChallenge = {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  participants: number;
  inviteSlug: string;
  timeline: ChallengeTimeline;
  coverGradient: string;
};

export type CreatorCommunity = {
  id: string;
  slug: string;
  communityName: string;
  creatorDisplayName: string;
  bio: string;
  memberCount: number;
  challengesHosted: number;
  brandColor: string;
  avatarInitials: string;
  bannerGradient: string;
  isApproved: boolean;
  ownerUserId: string;
  socialLinks: CreatorSocialLink[];
  shopUrl?: string;
  shopLabel?: string;
  affiliateDisclosure?: string;
  challenges: CreatorCommunityChallenge[];
  announcement?: string;
};

export type CreatorDashboardStats = {
  totalFollowers: number;
  activeChallenges: number;
  totalParticipants: number;
  participationRatePercent: number;
  periodLabel: string;
};
