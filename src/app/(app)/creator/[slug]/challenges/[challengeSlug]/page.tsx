import { ChallengeLandingView } from "@/components/challenges/challenge-landing-view";
import { StandalonePageHeader } from "@/components/layout/standalone-page-header";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import {
  fetchChallengeLandingByCommunityAndSlug,
  landingCanonicalPath,
} from "@/lib/data/challenge-landing";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ slug: string; challengeSlug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug, challengeSlug } = await params;
  const { user } = await getCurrentUserProfile();
  const data = await fetchChallengeLandingByCommunityAndSlug(
    slug,
    challengeSlug,
    user?.id ?? null,
  );
  return { title: data?.challenge.title ?? "Challenge" };
}

export default async function CreatorChallengePublicPage({ params }: Props) {
  const { slug, challengeSlug } = await params;
  const { user } = await getCurrentUserProfile();
  const data = await fetchChallengeLandingByCommunityAndSlug(
    slug,
    challengeSlug,
    user?.id ?? null,
  );

  if (!data?.isLandingVisible) {
    notFound();
  }

  const canonicalPath = landingCanonicalPath(data);
  const joinContinuePath = `/join/${challengeSlug}/start`;

  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-background pb-8">
      <StandalonePageHeader pathname={canonicalPath} title="Challenge" />
      <div className="animate-fade-up px-4">
        <ChallengeLandingView
          data={data}
          loggedIn={Boolean(user)}
          canonicalPath={canonicalPath}
          joinContinuePath={joinContinuePath}
        />
      </div>
    </div>
  );
}
