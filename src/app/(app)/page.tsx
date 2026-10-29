import { HomeAccountabilityGroups } from "@/components/dashboard/home-accountability-groups";
import { HomeChallengesSection } from "@/components/dashboard/home-challenges-section";
import { HomeDailyCheckIn } from "@/components/dashboard/home-daily-check-in";
import { HomeHero } from "@/components/dashboard/home-hero";
import { HomeChallengeSpotlightFromList } from "@/components/dashboard/home-challenge-spotlight";
import { TodaysGoals } from "@/components/dashboard/todays-goals";
import { fetchMemberGoalPreferences } from "@/lib/data/member-preferences";
import { WeeklyConsistencyHome } from "@/components/dashboard/weekly-consistency-home";
import { PageHeader } from "@/components/layout/page-header";
import { RouteFallback } from "@/components/layout/route-fallback";
import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { HomeInstallBanner } from "@/components/pwa/home-install-banner";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import { fetchChallengeParticipantHub } from "@/lib/data/challenge-participant-hub";
import { fetchJoinedChallengesForHome } from "@/lib/data/challenges";
import { fetchUserGroup } from "@/lib/data/groups";
import { fetchHomeDashboardBundle } from "@/lib/data/member";
import { resolveHomePrimaryAction } from "@/lib/home/primary-action";
import { createClient } from "@/lib/supabase/server";
import { challengePhaseFromChallenge } from "@/lib/timezone/challenge-fields";
import { DEFAULT_FALLBACK_TIMEZONE } from "@/lib/timezone/constants";
import { Suspense } from "react";

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

function challengePhase(
  c: Awaited<ReturnType<typeof fetchJoinedChallengesForHome>>[number],
): "upcoming" | "active" | "completed" {
  return challengePhaseFromChallenge(c);
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <RouteFallback
          title="Today"
          subtitle="Habits, challenges & your crew"
        />
      }
    >
      <HomePageContent />
    </Suspense>
  );
}

async function HomePageContent() {
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

  const [dashboard, joinedChallenges, groupData, memberPrefs] = await Promise.all([
    userId ? fetchHomeDashboardBundle(userId) : Promise.resolve(emptyDashboard),
    userId ? fetchJoinedChallengesForHome(userId) : Promise.resolve([]),
    userId
      ? fetchUserGroup(userId)
      : Promise.resolve({ group: null, feed: [], pendingJoin: null }),
    userId ? fetchMemberGoalPreferences(userId) : Promise.resolve({ workTowards: null, growthFriction: null }),
  ]);

  const joined = joinedChallenges.filter((c) => c.joined);
  const primaryChallenge =
    joined.find((c) => challengePhase(c) === "active") ??
    joined.find((c) => challengePhase(c) === "upcoming") ??
    null;
  const activeChallengeHub =
    userId && primaryChallenge
      ? await fetchChallengeParticipantHub(primaryChallenge.id, userId)
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
  const isCreator = profile?.role === "creator" || profile?.role === "admin";

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Today"
        subtitle={memberPrefs.workTowards ? undefined : "Habits, challenges & your crew"}
        action={
          isCreator ? (
            <Link
              href="/studio"
              className="focus-ring flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-primary"
              aria-label="Creator Studio"
            >
              <LayoutDashboard className="h-5 w-5" aria-hidden />
            </Link>
          ) : undefined
        }
      />
      <div className="page-stack-compact px-4 py-3 pb-4">
        <HomeInstallBanner />
        <HomeHero
          firstName={firstName}
          timezone={timezone}
          goals={goals}
          group={groupData.group}
          activeChallengeHub={activeChallengeHub}
          primaryAction={primaryAction}
          loggedIn={Boolean(userId)}
          viewerUserId={userId}
          workTowards={memberPrefs.workTowards}
        />

        {activeChallengeHub ? (
          <HomeChallengeSpotlightFromList
            activeHub={activeChallengeHub}
            challenges={joinedChallenges}
          />
        ) : null}

        <TodaysGoals
          goals={goals}
          group={groupData.group}
          activeChallengeHub={activeChallengeHub}
          viewerUserId={userId}
          loggedIn={Boolean(userId)}
        />

        {memberPrefs.growthFriction === "support" ||
        memberPrefs.growthFriction === "consistency" ? (
          <>
            <HomeAccountabilityGroups group={groupData.group} viewerUserId={userId} />
            <HomeChallengesSection
              challenges={joinedChallenges}
              activeHub={activeChallengeHub}
              workTowards={memberPrefs.workTowards}
              spotlightShown={Boolean(activeChallengeHub)}
            />
          </>
        ) : hasActiveChallenge ? (
          <>
            <HomeChallengesSection
              challenges={joinedChallenges}
              activeHub={activeChallengeHub}
              workTowards={memberPrefs.workTowards}
              spotlightShown={Boolean(activeChallengeHub)}
            />
            <HomeAccountabilityGroups group={groupData.group} viewerUserId={userId} />
          </>
        ) : (
          <>
            <HomeAccountabilityGroups group={groupData.group} viewerUserId={userId} />
            <HomeChallengesSection
              challenges={joinedChallenges}
              activeHub={activeChallengeHub}
              workTowards={memberPrefs.workTowards}
              spotlightShown={Boolean(activeChallengeHub)}
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
