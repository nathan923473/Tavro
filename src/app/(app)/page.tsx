import { ChallengeHabitActivity } from "@/components/dashboard/challenge-habit-activity";
import { DailyCheckInCard } from "@/components/dashboard/daily-check-in-card";
import {
  HomeGroupPreview,
  HomeWelcomeBanner,
} from "@/components/dashboard/home-sections";
import { TodaysHabits } from "@/components/dashboard/todays-habits";
import { WeeklyConsistencyHome } from "@/components/dashboard/weekly-consistency-home";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import { fetchChallengesForUser } from "@/lib/data/challenges";
import { fetchUserGroup } from "@/lib/data/groups";
import {
  fetchLinkedChallengeHabits,
  fetchMemberGoals,
  fetchMilestones,
  fetchTodayCheckIn,
  fetchWeeklyConsistencySummary,
  fetchWeeklyProgress,
} from "@/lib/data/member";

export default async function HomePage() {
  const { user, profile } = await getCurrentUserProfile();
  const userId = user?.id ?? null;
  const firstName =
    profile?.displayName?.split(/\s+/)[0] ??
    user?.email?.split("@")[0] ??
    "there";

  const [
    goals,
    checkIn,
    consistency,
    weekDays,
    challenges,
    groupData,
    linkedHabits,
    milestones,
  ] = await Promise.all([
    userId ? fetchMemberGoals(userId) : Promise.resolve([]),
    userId
      ? fetchTodayCheckIn(userId)
      : Promise.resolve({ checkedIn: false, mood: null, reflection: null }),
    userId
      ? fetchWeeklyConsistencySummary(userId)
      : Promise.resolve({
          planned: 0,
          completed: 0,
          percent: 0,
          message: "Log in to track consistency.",
        }),
    userId ? fetchWeeklyProgress(userId) : Promise.resolve([]),
    fetchChallengesForUser(userId),
    userId ? fetchUserGroup(userId) : Promise.resolve({ group: null, feed: [] }),
    userId ? fetchLinkedChallengeHabits(userId) : Promise.resolve([]),
    userId ? fetchMilestones(userId) : Promise.resolve([]),
  ]);

  return (
    <div className="animate-fade-up">
      <PageHeader title="Home" subtitle="Your daily accountability hub" />
      <div className="space-y-6 px-4 py-4">
        <HomeWelcomeBanner
          firstName={firstName}
          groupName={groupData.group?.name}
        />
        <TodaysHabits goals={goals} loggedIn={Boolean(userId)} />
        <DailyCheckInCard
          checkedIn={checkIn.checkedIn}
          mood={checkIn.mood}
          loggedIn={Boolean(userId)}
        />
        <ChallengeHabitActivity
          challenges={challenges.mine}
          linkedHabits={linkedHabits}
          loggedIn={Boolean(userId)}
        />
        <HomeGroupPreview group={groupData.group} feed={groupData.feed} />
        <WeeklyConsistencyHome summary={consistency} weekDays={weekDays} />
        {milestones[0] ? (
          <Card>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Recent milestone
            </p>
            <p className="mt-1 font-semibold">{milestones[0].label}</p>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
