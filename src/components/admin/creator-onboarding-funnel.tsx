import { Card } from "@/components/ui/card";
import type { CreatorOnboardingFunnel } from "@/lib/creator/invitations";

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card padding="sm" className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold tabular-nums">{value.toLocaleString()}</p>
    </Card>
  );
}

export function CreatorOnboardingFunnelSummary({
  stats,
}: {
  stats: CreatorOnboardingFunnel | null;
}) {
  if (!stats) {
    return (
      <Card>
        <p className="text-sm text-muted-foreground">
          Onboarding counts appear after migration 051 is applied.
        </p>
      </Card>
    );
  }

  return (
    <section aria-labelledby="creator-funnel-heading" className="space-y-2">
      <h2 id="creator-funnel-heading" className="text-base font-semibold">
        Creator onboarding
      </h2>
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Invitations sent" value={stats.invitationsCreated} />
        <Stat label="Invitations accepted" value={stats.invitationsAccepted} />
        <Stat label="Applications" value={stats.applications} />
        <Stat label="Approvals" value={stats.approvals} />
        <Stat label="Created a challenge" value={stats.firstChallengeCreated} />
        <Stat label="Published a challenge" value={stats.firstChallengePublished} />
        <Stat label="Shared a challenge" value={stats.challengeShared} />
        <Stat label="First participant joined" value={stats.firstParticipantJoined} />
      </div>
    </section>
  );
}
