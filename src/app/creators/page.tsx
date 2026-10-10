import { CreatorReferralCapture } from "@/components/analytics/creator-referral-capture";
import { CreatorsLanding } from "@/components/creators/creators-landing";
import { APP_NAME, APP_TAGLINE } from "@/lib/branding";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import { Suspense } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `Creators · ${APP_NAME}`,
  description: APP_TAGLINE,
  openGraph: {
    title: `Run free fitness challenges on ${APP_NAME}`,
    description:
      "Turn your followers into a community that makes progress. Free for approved creators at launch.",
    type: "website",
  },
};

export default async function CreatorsLandingPage() {
  const { user } = await getCurrentUserProfile();

  return (
    <>
      <Suspense fallback={null}>
        <CreatorReferralCapture />
      </Suspense>
      <CreatorsLanding loggedIn={Boolean(user)} />
    </>
  );
}
