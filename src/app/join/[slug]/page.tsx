import { redirect } from "next/navigation";
import { ChallengeLandingView } from "@/components/challenges/challenge-landing-view";
import { StandalonePageHeader } from "@/components/layout/standalone-page-header";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import {
  fetchChallengeLandingByInviteSlug,
  landingCanonicalPath,
} from "@/lib/data/challenge-landing";
import { creatorChallengePath } from "@/lib/data/creator-studio";
import { challengeLandingMetadata } from "@/lib/seo/challenge-open-graph";
import { notFound } from "next/navigation";

type JoinChallengePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: JoinChallengePageProps) {
  const { slug } = await params;
  const data = await fetchChallengeLandingByInviteSlug(slug, null);
  if (!data) return { title: "Challenge invite" };
  const canonicalPath = landingCanonicalPath(data);
  return challengeLandingMetadata({
    title: data.challenge.title,
    description: data.shortDescription ?? data.challenge.description,
    canonicalPath,
    coverUrl: data.challenge.coverUrl,
  });
}

export default async function JoinChallengePage({ params }: JoinChallengePageProps) {
  const { slug } = await params;
  const { user } = await getCurrentUserProfile();
  const data = await fetchChallengeLandingByInviteSlug(slug, user?.id ?? null);

  if (!data?.isLandingVisible) {
    notFound();
  }

  if (user && data.joined && data.onboardingCompleted) {
    redirect(`/challenges/${data.challenge.id}`);
  }

  if (data.communitySlug) {
    redirect(creatorChallengePath(data.communitySlug, slug));
  }

  const canonicalPath = landingCanonicalPath(data);
  const joinContinuePath = `/join/${slug}/start`;

  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-background px-4 py-8 pt-[env(safe-area-inset-top)]">
      <div className="animate-fade-up space-y-4">
        <StandalonePageHeader pathname={canonicalPath} title="Challenge invite" />
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
