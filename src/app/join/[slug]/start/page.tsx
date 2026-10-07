import { ChallengeParticipantOnboarding } from "@/components/challenges/challenge-participant-onboarding";
import { StandalonePageHeader } from "@/components/layout/standalone-page-header";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import { fetchChallengeLandingByInviteSlug } from "@/lib/data/challenge-landing";
import { redirect } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };

export default async function ChallengeParticipantStartPage({ params }: Props) {
  const { slug } = await params;
  const { user } = await getCurrentUserProfile();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/join/${slug}/start`)}`);
  }

  const data = await fetchChallengeLandingByInviteSlug(slug, user.id);
  if (!data?.joined) {
    redirect(`/join/${slug}`);
  }
  if (data.onboardingCompleted) {
    redirect(`/challenges/${data.challenge.id}`);
  }

  const today = new Date().toISOString().slice(0, 10);
  const notStarted = data.challenge.startDate > today;

  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-background px-4 py-6">
      <StandalonePageHeader pathname={`/join/${slug}/start`} title="You're in" />
      <ChallengeParticipantOnboarding
        challengeId={data.challenge.id}
        challengeTitle={data.challenge.title}
        creatorName={data.communityName ?? data.challenge.creatorName}
        startDate={data.challenge.startDate}
        notStarted={notStarted}
      />
    </div>
  );
}
