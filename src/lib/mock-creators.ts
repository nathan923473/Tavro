import type {
  CreatorCommunity,
  CreatorDashboardStats,
} from "@/types/creator-community";

export const demoFollowingSlugs: string[] = ["sarahfitness"];

/** Demo: Coach Riley owns sarahfitness; Jordan is a follower. */
export const demoManagedCreatorSlug = "sarahfitness";

export const creatorCommunities: CreatorCommunity[] = [
  {
    id: "comm-sarah",
    slug: "sarahfitness",
    communityName: "Sarah's Steady Squad",
    creatorDisplayName: "Coach Sarah",
    bio: "Building sustainable habits with kindness — free challenges, zero crash diets. Join us for walks, water, and wins that last.",
    memberCount: 4820,
    challengesHosted: 14,
    brandColor: "#c45c4a",
    avatarInitials: "CS",
    bannerGradient: "linear-gradient(135deg, #c45c4a 0%, #8b3d32 50%, #2f6f58 100%)",
    isApproved: true,
    ownerUserId: "creator-sarah",
    socialLinks: [
      {
        platform: "instagram",
        label: "Instagram",
        url: "https://instagram.com/",
      },
      {
        platform: "tiktok",
        label: "TikTok",
        url: "https://tiktok.com/",
      },
      {
        platform: "youtube",
        label: "YouTube",
        url: "https://youtube.com/",
      },
    ],
    shopUrl: "https://example.com/sarah-shop",
    shopLabel: "Sarah's wellness shop",
    affiliateDisclosure:
      "Some shop links may earn Sarah a commission at no extra cost to you. Challenges are always free on Streakly.",
    announcement:
      "New challenge drops Monday — 14 days of gentle movement. Follow to get notified!",
    challenges: [
      {
        id: "cc1",
        title: "7-Day Gentle Reset",
        description: "Walk, hydrate, one nourishing meal — small wins daily.",
        startDate: "2026-09-28",
        endDate: "2026-10-05",
        participants: 842,
        inviteSlug: "gentle-reset-riley",
        timeline: "current",
        coverGradient: "linear-gradient(145deg, #3d8b6e, #2f6f58)",
      },
      {
        id: "cc2",
        title: "Hydration & High-Fives",
        description: "Water goal + one encouragement message to a squad mate.",
        startDate: "2026-10-08",
        endDate: "2026-10-22",
        participants: 0,
        inviteSlug: "hydration-high-fives",
        timeline: "upcoming",
        coverGradient: "linear-gradient(145deg, #5b9bd5, #3d6fa8)",
      },
      {
        id: "cc3",
        title: "Spring Step Challenge",
        description: "Daily steps at your pace — celebrate consistency.",
        startDate: "2026-03-01",
        endDate: "2026-03-31",
        participants: 2104,
        inviteSlug: "spring-step-2026",
        timeline: "previous",
        coverGradient: "linear-gradient(145deg, #e07a5f, #c45c4a)",
      },
    ],
  },
  {
    id: "comm-alex",
    slug: "alexfit",
    communityName: "Walk Before Coffee Club",
    creatorDisplayName: "Alex Fit",
    bio: "Morning movement for real life — ten minutes outside beats perfect plans.",
    memberCount: 9200,
    challengesHosted: 22,
    brandColor: "#3d6fa8",
    avatarInitials: "AF",
    bannerGradient: "linear-gradient(135deg, #3d6fa8 0%, #2f6f58 100%)",
    isApproved: true,
    ownerUserId: "creator-alex",
    socialLinks: [
      {
        platform: "instagram",
        label: "Instagram",
        url: "https://instagram.com/",
      },
    ],
    challenges: [
      {
        id: "cc4",
        title: "Walk Before Coffee",
        description: "10 minutes outside before your first cup.",
        startDate: "2026-10-01",
        endDate: "2026-10-31",
        participants: 1204,
        inviteSlug: "walk-before-coffee",
        timeline: "current",
        coverGradient: "linear-gradient(145deg, #3d6fa8, #2a4d75)",
      },
    ],
  },
];

export const demoCreatorDashboard: CreatorDashboardStats = {
  totalFollowers: 4820,
  activeChallenges: 1,
  totalParticipants: 2946,
  participationRatePercent: 68,
  periodLabel: "Last 30 days",
};

export function getCreatorCommunityBySlug(
  slug: string,
): CreatorCommunity | undefined {
  return creatorCommunities.find((c) => c.slug === slug);
}

export function isDemoCommunityOwner(slug: string): boolean {
  return slug === demoManagedCreatorSlug;
}
