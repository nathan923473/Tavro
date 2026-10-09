import { HomeAccountabilityGroups } from "@/components/dashboard/home-accountability-groups";
import { HomeChallengesSection } from "@/components/dashboard/home-challenges-section";
import { HomeDailyCheckIn } from "@/components/dashboard/home-daily-check-in";
import { HomeDailySummary } from "@/components/dashboard/home-daily-summary";
import { TodaysHabits } from "@/components/dashboard/todays-habits";
import { WeeklyConsistencyHome } from "@/components/dashboard/weekly-consistency-home";
import { PageHeader } from "@/components/layout/page-header";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import { fetchChallengeParticipantHub } from "@/lib/data/challenge-participant-hub";
import { fetchJoinedChallengesForHome } from "@/lib/data/challenges";
import { fetchUserGroup } from "@/lib/data/groups";
import { fetchHomeDashboardBundle } from "@/lib/data/member";
import { resolveHomePrimaryAction } from "@/lib/home/primary-action";
import { createClient } from "@/lib/supabase/server";
import { challengePhaseFromInstants } from "@/lib/timezone/challenge-calendar";
import { resolveChallengeEndAt, resolveChallengeStartAt } from "@/lib/timezone/challenge-fields";
import { DEFAULT_FALLBACK_TIMEZONE } from "@/lib/timezone/constants";

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
  weekDayIndicators: [] as {
    day: string;
    dateKey: string;
    status: "none" | "partial" | "complete" | "future";
  }[],
  linkedHabits: [],
  milestones: [],
};

function challengeIsActive(
  c: Awaited<ReturnType<typeof fetchJoinedChallengesForHome>>[number],
): boolean {
  if (!c.startAt || !c.endAt) {
    const today = new Date().toISOString().slice(0, 10);
    return c.startDate <= today && c.endDate >= today;
  }
  const start = resolveChallengeStartAt({
    start_date: c.startDate,
    start_at: c.startAt,
    challenge_timezone: c.challengeTimezone ?? null,
  });
  const end = resolveChallengeEndAt({
    end_date: c.endDate,
    end_at: c.endAt,
    challenge_timezone: c.challengeTimezone ?? null,
  });
  return challengePhaseFromInstants(start, end) === "active";
}

export default async function HomePage() {
  const { user, profile } = await getCurrentUserProfile();
  const userId = user?.id ?? null;
  const firstName =
    profile?.displayName?.split(/\s+/)[0] ??
    user?.email?.split("@")[0] ??
    "there";

  let timezone: string | null = DEFAULT_FALLBACK_TIMEZONE;
  if (userId) {
    const supabase = await createClient();
    const { data: tzRow } = await supabase
      .from("profiles")
      .select("timezone")
      .eq("id", userId)
      .maybeSingle();
    if (tzRow?.timezone) timezone = tzRow.timezone as string;
  }

  const [dashboard, joinedChallenges, groupData] = await Promise.all([
    userId ? fetchHomeDashboardBundle(userId) : Promise.resolve(emptyDashboard),
    userId ? fetchJoinedChallengesForHome(userId) : Promise.resolve([]),
    userId
      ? fetchUserGroup(userId)
      : Promise.resolve({ group: null, feed: [], pendingJoin: null }),
  ]);

  const activeChallenge = joinedChallenges.find((c) => c.joined && challengeIsActive(c));
  const activeChallengeHub =
    userId && activeChallenge
      ? await fetchChallengeParticipantHub(activeChallenge.id, userId)
      : null;

  const { goals, checkIn, consistency, weekDayIndicators } = dashboard;

  const primaryAction = resolveHomePrimaryAction({
    goals,
    group: groupData.group,
    viewerUserId: userId,
    activeChallengeHub,
    loggedIn: Boolean(userId),
  });

  const hasActiveChallenge = activeChallengeHub?.phase === "active";

  return (
    <div className="animate-fade-up">
      <PageHeader title="Home" subtitle="Your daily accountability hub" />
      <div className="space-y-5 px-4 py-4">
        <HomeDailySummary
          firstName={firstName}
          timezone={timezone}
          goals={goals}
          group={groupData.group}
          primaryAction={primaryAction}
          loggedIn={Boolean(userId)}
        />

        <TodaysHabits goals={goals} loggedIn={Boolean(userId)} />

        {hasActiveChallenge ? (
          <>
            <HomeChallengesSection
              challenges={joinedChallenges}
              activeHub={activeChallengeHub}
            />
            <HomeAccountabilityGroups group={groupData.group} viewerUserId={userId} />
          </>
        ) : (
          <>
            <HomeAccountabilityGroups group={groupData.group} viewerUserId={userId} />
            <HomeChallengesSection
              challenges={joinedChallenges}
              activeHub={null}
            />
          </>
        )}

        <HomeDailyCheckIn
          checkedIn={checkIn.checkedIn}
          mood={checkIn.mood}
          loggedIn={Boolean(userId)}
        />

        <WeeklyConsistencyHome
          summary={consistency}
          weekDayIndicators={weekDayIndicators}
        />
      </div>
    </div>
  );
}
