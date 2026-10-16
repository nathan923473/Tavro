import { ChallengeParticipantOnboarding } from "@/components/challenges/challenge-participant-onboarding";
import { StandalonePageHeader } from "@/components/layout/standalone-page-header";
import { completeChallengeParticipantOnboardingAction } from "@/app/(app)/member/actions";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import { fetchChallengeLandingByInviteSlug } from "@/lib/data/challenge-landing";
import { challengeTotalDays } from "@/lib/challenge-day";
import {
  challengePhaseFromChallenge,
  resolveChallengeStartAt,
} from "@/lib/timezone/challenge-fields";
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

  const phase = challengePhaseFromChallenge(data.challenge);
  const startAt = resolveChallengeStartAt({
    start_date: data.challenge.startDate,
    start_at: data.challenge.startAt,
    challenge_timezone: data.challenge.challengeTimezone,
  });

  if (phase === "upcoming") {
    await completeChallengeParticipantOnboardingAction(data.challenge.id);
    redirect(`/challenges/${data.challenge.id}`);
  }

  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-background px-4 py-6">
      <StandalonePageHeader pathname={`/join/${slug}/start`} title="You're in" />
      <ChallengeParticipantOnboarding
        challengeId={data.challenge.id}
        challengeTitle={data.challenge.title}
        creatorName={data.communityName ?? data.challenge.creatorName}
        startDate={data.challenge.startDate}
        endDate={data.challenge.endDate}
        startAt={data.challenge.startAt ?? startAt.toISOString()}
        challengeTimezone={data.challenge.challengeTimezone}
        totalDays={challengeTotalDays(data.challenge.startDate, data.challenge.endDate)}
        goalDescription={data.goalDescription}
        shortDescription={data.shortDescription}
        notStarted={false}
      />
    </div>
  );
}
