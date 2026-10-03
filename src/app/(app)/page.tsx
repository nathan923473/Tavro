import { ChallengePreview } from "@/components/dashboard/challenge-preview";
import { CheckInCard } from "@/components/dashboard/check-in-card";
import { ConsistencyCard } from "@/components/dashboard/consistency-card";
import {
  HomeGroupPreview,
  HomeWelcomeBanner,
} from "@/components/dashboard/home-demo-sections";
import { ReferralCard } from "@/components/dashboard/referral-card";
import { TodaysGoals } from "@/components/dashboard/todays-goals";
import { PageHeader } from "@/components/layout/page-header";
import { consistencyMetrics, demoUser } from "@/lib/mock-data";

export default function HomePage() {
  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Home"
        subtitle="Your daily accountability hub"
      />
      <div className="space-y-6 px-4 py-4">
        <HomeWelcomeBanner />
        <CheckInCard />
        <TodaysGoals />
        <ChallengePreview />
        <ReferralCard referralCode={demoUser.referralCode} />
        <HomeGroupPreview />
        <ConsistencyCard metrics={consistencyMetrics} />
      </div>
    </div>
  );
}
