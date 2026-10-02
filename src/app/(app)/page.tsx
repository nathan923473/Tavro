import { ChallengePreview } from "@/components/dashboard/challenge-preview";
import { CheckInCard } from "@/components/dashboard/check-in-card";
import { ConsistencyCard } from "@/components/dashboard/consistency-card";
import { GroupActivityPreview } from "@/components/dashboard/group-activity-preview";
import { TodaysGoals } from "@/components/dashboard/todays-goals";
import { WelcomeBanner } from "@/components/dashboard/welcome-banner";
import { PageHeader } from "@/components/layout/page-header";
import {
  accountabilityGroup,
  activeChallenges,
  consistencyMetrics,
  demoUser,
  groupFeed,
  todaysGoals,
} from "@/lib/mock-data";

export default function HomePage() {
  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Home"
        subtitle="Your daily accountability hub"
      />
      <div className="space-y-6 px-4 py-4">
        <WelcomeBanner
          firstName={demoUser.firstName}
          groupName={demoUser.joinedGroup ? demoUser.groupName : undefined}
        />
        <CheckInCard />
        <TodaysGoals goals={todaysGoals} />
        <ChallengePreview challenges={activeChallenges} />
        {demoUser.joinedGroup ? (
          <GroupActivityPreview group={accountabilityGroup} feed={groupFeed} />
        ) : null}
        <ConsistencyCard metrics={consistencyMetrics} />
      </div>
    </div>
  );
}
