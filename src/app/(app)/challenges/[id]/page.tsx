import { ChallengeParticipantHub } from "@/components/challenges/participant/challenge-participant-hub";
import { BackButton } from "@/components/layout/back-button";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import { fetchChallengeParticipantHub } from "@/lib/data/challenge-participant-hub";
import { redirect } from "next/navigation";
import { Suspense } from "react";

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

  const hub = await fetchChallengeParticipantHub(id, user.id);
  if (!hub) redirect("/challenges");

  return (
    <div className="animate-fade-up pb-6">
      <div className="sticky top-0 z-40 border-b border-border/50 bg-background/90 px-3 py-3 backdrop-blur-md">
        <BackButton fallbackHref="/challenges" />
      </div>
      <div className="px-4 py-4">
        <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
          <ChallengeParticipantHub hub={hub} />
        </Suspense>
      </div>
    </div>
  );
}
