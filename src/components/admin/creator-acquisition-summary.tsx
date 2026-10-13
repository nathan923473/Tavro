import { Card } from "@/components/ui/card";
import type { CreatorAcquisitionStats } from "@/lib/data/creator-acquisition";

function Stat({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <Card padding="sm" className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold tabular-nums">{value.toLocaleString()}</p>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </Card>
  );
}

export function CreatorAcquisitionSummary({ stats }: { stats: CreatorAcquisitionStats }) {
  return (
    <section aria-labelledby="creator-acquisition-heading" className="mb-6 space-y-2">
      <h2 id="creator-acquisition-heading" className="text-base font-semibold">
        Creator acquisition
      </h2>
      <p className="text-xs text-muted-foreground">
        Counts from creator applications and published public challenges — not link clicks.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Total applications" value={stats.totalApplications} />
        <Stat
          label="From creator referrals"
          value={stats.fromCreatorReferral}
          hint="Attributed at apply time"
        />
        <Stat
          label="From /creators landing"
          value={stats.fromCreatorLanding}
        />
        <Stat label="Approved creators" value={stats.approvedCreators} />
        <Stat
          label="Creators with a public challenge"
          value={stats.activeCreatorsWithPublishedChallenge}
        />
        <Stat
          label="Creators with 2+ public challenges"
          value={stats.creatorsWithRepeatPublishedChallenge}
          hint="Repeat launchers"
        />
      </div>
    </section>
  );
}
