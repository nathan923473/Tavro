import { ChallengeHubAccessDenied } from "@/components/challenges/challenge-hub-access-denied";
import dynamic from "next/dynamic";
import { PageSkeleton } from "@/components/ui/skeleton";

const ChallengeParticipantHub = dynamic(
  () =>
    import("@/components/challenges/participant/challenge-participant-hub").then(
      (m) => m.ChallengeParticipantHub,
    ),
  { loading: () => <PageSkeleton /> },
);
import { BackButton } from "@/components/layout/back-button";
import { ensureChallengeHubAccessAction } from "@/app/(app)/member/actions";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import { fetchMyChallengeFeedback } from "@/lib/challenge-report/challenge-feedback-actions";
import { fetchChallengeParticipantHub } from "@/lib/data/challenge-participant-hub";
import { fetchUserGroup } from "@/lib/data/groups";
import { fetchWeeklyConsistencySummary } from "@/lib/data/member";
import { redirect } from "next/navigation";
type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const { user } = await getCurrentUserProfile();
  if (!user) return { title: "Challenge" };
  const hub = await fetchChallengeParticipantHub(id, user.id);
  return { title: hub?.title ?? "Challenge" };
}

export default async function JoinedChallengePage({ params }: Props) {
  const { id } = await params;
  const { user } = await getCurrentUserProfile();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/challenges/${id}`)}`);
  }

  const [access, hub] = await Promise.all([
    ensureChallengeHubAccessAction(id),
    fetchChallengeParticipantHub(id, user.id),
  ]);

  if (!hub) {
    const reason =
      access.reason === "not_found"
        ? "not_found"
        : access.reason === "private"
          ? "private"
          : access.reason === "not_joined"
            ? "not_joined"
            : "unknown";
    return (
      <div className="animate-fade-up pb-6">
        <div className="sticky top-0 z-40 border-b border-border/50 bg-background/90 px-3 py-3 backdrop-blur-md">
          <BackButton fallbackHref="/challenges" />
        </div>
        <div className="px-4 py-4">
          <ChallengeHubAccessDenied reason={reason} inviteSlug={access.inviteSlug} />
        </div>
      </div>
    );
  }

  const [feedbackInitial, groupState, consistency] = await Promise.all([
    hub.phase === "completed" && !hub.isOwner
      ? fetchMyChallengeFeedback(id, user.id)
      : Promise.resolve(null),
    fetchUserGroup(user.id),
    fetchWeeklyConsistencySummary(user.id),
  ]);

  return (
    <div className="animate-fade-up pb-6">
      <div className="sticky top-0 z-40 border-b border-border/50 bg-background/90 px-3 py-3 backdrop-blur-md">
        <BackButton fallbackHref="/challenges" />
      </div>
      <div className="px-4 py-4">
        <ChallengeParticipantHub
          hub={hub}
          viewerUserId={user.id}
          feedbackInitial={feedbackInitial}
          hasAccountabilityGroup={Boolean(groupState.group)}
          habitConsistencyPercent={
            consistency.planned > 0 ? consistency.percent : null
          }
        />
      </div>
    </div>
  );
}
