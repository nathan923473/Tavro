import { ChallengePreview } from "@/components/dashboard/challenge-preview";
import { CheckInCard } from "@/components/dashboard/check-in-card";
import { ConsistencyCard } from "@/components/dashboard/consistency-card";
import {
  HomeGroupPreview,
  HomeWelcomeBanner,
} from "@/components/dashboard/home-sections";
import { ReferralCard } from "@/components/dashboard/referral-card";
import { TodaysGoals } from "@/components/dashboard/todays-goals";
import { PageHeader } from "@/components/layout/page-header";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import { fetchChallengesForUser } from "@/lib/data/challenges";
import { fetchUserGroup } from "@/lib/data/groups";
import {
  fetchConsistencyMetrics,
  fetchMemberGoals,
  hasCheckedInToday,
} from "@/lib/data/member";

export default async function HomePage() {
  const { user, profile } = await getCurrentUserProfile();
  const userId = user?.id ?? null;
  const firstName =
    profile?.displayName?.split(/\s+/)[0] ??
    user?.email?.split("@")[0] ??
    "there";

  const [goals, checkedIn, consistency, challenges, groupData] =
    await Promise.all([
      userId ? fetchMemberGoals(userId) : Promise.resolve([]),
      userId ? hasCheckedInToday(userId) : Promise.resolve(false),
      userId
        ? fetchConsistencyMetrics(userId)
        : Promise.resolve([
            { label: "Check-ins this week", value: 0, target: 7 },
            { label: "Goals completed", value: 0, target: 1 },
          ]),
      fetchChallengesForUser(userId),
      userId ? fetchUserGroup(userId) : Promise.resolve({ group: null, feed: [] }),
    ]);

  return (
    <div className="animate-fade-up">
      <PageHeader title="Home" subtitle="Your daily accountability hub" />
      <div className="space-y-6 px-4 py-4">
        <HomeWelcomeBanner
          firstName={firstName}
          groupName={groupData.group?.name}
        />
        <CheckInCard checkedIn={checkedIn} loggedIn={Boolean(userId)} />
        <TodaysGoals goals={goals} loggedIn={Boolean(userId)} />
        <ChallengePreview
          challenges={challenges.mine}
          viewerName={firstName}
          loggedIn={Boolean(userId)}
        />
        <ReferralCard
          referralCode={profile?.referralCode ?? "sign-in-for-code"}
        />
        <HomeGroupPreview group={groupData.group} feed={groupData.feed} />
        <ConsistencyCard metrics={consistency} />
      </div>
    </div>
  );
}
