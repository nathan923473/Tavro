import { ChallengeCoverImage } from "@/components/challenges/challenge-cover-image";
import { ChallengeStartCountdown } from "@/components/challenges/challenge-start-countdown";
import { OpenChallengeButton } from "@/components/challenges/open-challenge-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PrimaryLink } from "@/components/ui/link-button";
import type { ChallengeParticipantHub } from "@/lib/data/challenge-participant-hub";
import { resolveChallengeEndAt } from "@/lib/timezone/challenge-fields";
import type { Challenge } from "@/types";
import Link from "next/link";

function daysRemaining(hub: ChallengeParticipantHub): number | null {
  const end = resolveChallengeEndAt({
    end_date: hub.endDate,
    end_at: hub.endAt ?? null,
    challenge_timezone: hub.challengeTimezone ?? null,
  });
  const ms = end.getTime() - Date.now();
  if (ms <= 0) return 0;
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

function nextActivityLabel(hub: ChallengeParticipantHub): string {
  if (hub.phase === "upcoming") return "Explore the plan while you wait";
  if (hub.isRestDay) return "Rest day — recovery counts too";
  const open = hub.todayActivities.find((a) => !a.completed);
  if (open) return `Next: ${open.title}`;
  if (hub.todayActivities.length) return "Today's activities complete";
  return hub.todayLabel;
}

export function HomeChallengeSpotlight({
  hub,
  coverUrl,
}: {
  hub: ChallengeParticipantHub;
  coverUrl?: string | null;
}) {
  const daysLeft = hub.phase === "active" ? daysRemaining(hub) : null;
  const openCount =
    hub.phase === "active" && !hub.isRestDay
      ? hub.todayActivities.filter((a) => !a.completed).length
      : 0;

  return (
    <section aria-labelledby="challenge-spotlight-heading" className="section-stack">
      <div className="flex items-end justify-between gap-2 px-0.5">
        <h2 id="challenge-spotlight-heading" className="text-title">
          {hub.phase === "upcoming" ? "Your upcoming challenge" : "Your challenge"}
        </h2>
        <Link href={`/challenges/${hub.challengeId}`} className="text-sm font-medium text-primary">
          Hub
        </Link>
      </div>

      <Card padding="none" className="overflow-hidden border-primary/15">
        <ChallengeCoverImage
          coverUrl={coverUrl ?? hub.coverUrl}
          title={hub.title}
          aspectClassName="aspect-[2/1]"
          priority
        />
        <div className="space-y-3 p-4">
          <div className="flex flex-wrap items-center gap-2">
            {hub.phase === "upcoming" ? (
              <Badge tone="warning">Starts soon</Badge>
            ) : (
              <Badge tone="success">Active</Badge>
            )}
            <span className="text-caption">{hub.creatorName}</span>
          </div>

          <p className="text-lg font-semibold leading-snug">{hub.title}</p>

          {hub.phase === "active" ? (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span>
                  Day{" "}
                  <span className="font-semibold tabular-nums text-foreground">
                    {hub.dayIndex}
                  </span>{" "}
                  of {hub.totalDays}
                </span>
                <span>
                  <span className="font-semibold tabular-nums text-foreground">
                    {hub.progressPercent}%
                  </span>{" "}
                  complete
                </span>
                {daysLeft != null ? (
                  <span>
                    <span className="font-semibold tabular-nums text-foreground">{daysLeft}</span>{" "}
                    days left
                  </span>
                ) : null}
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${hub.progressPercent}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground">{nextActivityLabel(hub)}</p>
            </div>
          ) : (
            <div className="space-y-2">
              <ChallengeStartCountdown
                startAt={hub.startAt}
                startDate={hub.startDate}
                challengeTimezone={hub.challengeTimezone}
                variant="inline"
                showCreatorStart
              />
              <p className="text-sm text-muted-foreground">
                Preview the plan and members — activities unlock when the countdown ends.
              </p>
            </div>
          )}

          {openCount > 0 ? (
            <OpenChallengeButton
              challengeId={hub.challengeId}
              className="min-h-11 rounded-2xl"
            >
              Continue challenge · {openCount} left today
            </OpenChallengeButton>
          ) : (
            <PrimaryLink
              href={`/challenges/${hub.challengeId}?tab=${hub.phase === "upcoming" ? "plan" : "today"}`}
              fullWidth
              className="rounded-2xl"
            >
              {hub.phase === "upcoming" ? "View preparation" : "Open challenge hub"}
            </PrimaryLink>
          )}
        </div>
      </Card>
    </section>
  );
}

export function HomeChallengeSpotlightFromList({
  activeHub,
  challenges,
}: {
  activeHub: ChallengeParticipantHub | null;
  challenges: Challenge[];
}) {
  if (!activeHub) return null;
  const meta = challenges.find((c) => c.id === activeHub.challengeId);
  return <HomeChallengeSpotlight hub={activeHub} coverUrl={meta?.coverUrl} />;
}
