import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { activeChallenges } from "@/lib/mock-data";
import { CalendarRange, Users } from "lucide-react";

export const metadata = {
  title: "Challenges",
};

export default function ChallengesPage() {
  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Challenges"
        subtitle="Creator-hosted habits · join at your pace"
      />
      <div className="space-y-4 px-4 py-4">
        <Card className="border-dashed">
          <p className="text-sm text-muted-foreground">
            Discover challenges from fitness creators. Track daily or weekly
            activities — your personal measurements stay private.
          </p>
        </Card>

        <ul className="space-y-3">
          {activeChallenges.map((challenge) => (
            <li key={challenge.id}>
              <Card>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-semibold">{challenge.title}</h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      Hosted by {challenge.creatorName}
                    </p>
                  </div>
                  {challenge.joined ? (
                    <Badge tone="success">Joined</Badge>
                  ) : (
                    <Badge tone="muted">Open</Badge>
                  )}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {challenge.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <CalendarRange className="h-3.5 w-3.5" aria-hidden />
                    {challenge.startDate} → {challenge.endDate}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" aria-hidden />
                    {challenge.participants.toLocaleString()} participants
                  </span>
                </div>
                {challenge.joined ? (
                  <div className="mt-4">
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="text-muted-foreground">Your progress</span>
                      <span className="font-semibold">
                        {challenge.progressPercent}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${challenge.progressPercent}%` }}
                      />
                    </div>
                    <Button className="mt-4" variant="secondary" fullWidth>
                      Log today&apos;s activity
                    </Button>
                  </div>
                ) : (
                  <Button className="mt-4" fullWidth>
                    Join challenge
                  </Button>
                )}
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
