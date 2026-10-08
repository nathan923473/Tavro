import { ChallengeHabitActivity } from "@/components/dashboard/challenge-habit-activity";
import { DailyCheckInCard } from "@/components/dashboard/daily-check-in-card";
import {
  HomeGroupPreview,
  HomeWelcomeBanner,
} from "@/components/dashboard/home-sections";
import { TodaysHabits } from "@/components/dashboard/todays-habits";
import { UpcomingChallengesHome } from "@/components/dashboard/upcoming-challenges-home";
import { WeeklyConsistencyHome } from "@/components/dashboard/weekly-consistency-home";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import { fetchJoinedChallengesForHome } from "@/lib/data/challenges";
import { fetchUserGroup } from "@/lib/data/groups";
import { fetchHomeDashboardBundle } from "@/lib/data/member";

const emptyDashboard = {
  goals: [],
  checkIn: { checkedIn: false, mood: null, reflection: null },
  consistency: {
    planned: 0,
    completed: 0,
    percent: 0,
    message: "Log in to track consistency.",
  },
  weekDays: [],
  linkedHabits: [],
  milestones: [],
};

export default async function HomePage() {
  const { user, profile } = await getCurrentUserProfile();
  const userId = user?.id ?? null;
  const firstName =
    profile?.displayName?.split(/\s+/)[0] ??
    user?.email?.split("@")[0] ??
    "there";

  const [dashboard, joinedChallenges, groupData] = await Promise.all([
    userId ? fetchHomeDashboardBundle(userId) : Promise.resolve(emptyDashboard),
    userId ? fetchJoinedChallengesForHome(userId) : Promise.resolve([]),
    userId
      ? fetchUserGroup(userId)
      : Promise.resolve({ group: null, feed: [], pendingJoin: null }),
  ]);

  const {
    goals,
    checkIn,
    consistency,
    weekDays,
    linkedHabits,
    milestones,
  } = dashboard;

  return (
    <div className="animate-fade-up">
      <PageHeader title="Home" subtitle="Your daily accountability hub" />
      <div className="space-y-6 px-4 py-4">
        <HomeWelcomeBanner
          firstName={firstName}
          groupName={groupData.group?.name}
        />
        <UpcomingChallengesHome challenges={joinedChallenges} />
        <TodaysHabits goals={goals} loggedIn={Boolean(userId)} />
        <DailyCheckInCard
          checkedIn={checkIn.checkedIn}
          mood={checkIn.mood}
          loggedIn={Boolean(userId)}
        />
        <ChallengeHabitActivity
          challenges={joinedChallenges}
          linkedHabits={linkedHabits}
          loggedIn={Boolean(userId)}
        />
        <HomeGroupPreview group={groupData.group} feed={groupData.feed} />
        <WeeklyConsistencyHome summary={consistency} weekDays={weekDays} />
        {milestones[0] ? (
          <Card className="border-accent/40 bg-mint-subtle">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              Recent milestone
            </p>
            <p className="mt-1 text-lg font-bold text-foreground">{milestones[0].label}</p>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
