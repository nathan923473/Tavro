import { Card } from "@/components/ui/card";
import { CommunityGrowthChart } from "@/components/creator/studio/community-growth-chart";
import { ChallengeDateRange } from "@/components/challenges/challenge-date-range";
import type { ChallengeReportPayload } from "@/types/challenge-report";

function MetricCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card padding="sm" className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold tabular-nums">{value}</p>
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </Card>
  );
}

function ChangeBadge({ value, suffix = "%" }: { value: number | null; suffix?: string }) {
  if (value == null) return null;
  const sign = value > 0 ? "+" : "";
  const tone = value > 0 ? "text-primary" : value < 0 ? "text-amber-700" : "text-muted-foreground";
  return (
    <span className={`text-xs font-semibold tabular-nums ${tone}`}>
      {sign}
      {value}
      {suffix}
    </span>
  );
}

export function ChallengeReportView({ report }: { report: ChallengeReportPayload }) {
  const o = report.overview;
  const chartData = report.engagement.daily.map((d) => ({
    label: d.label,
    count: d.activeParticipants,
  }));

  return (
    <div className="space-y-6">
      <section aria-labelledby="report-overview">
        <h2 id="report-overview" className="mb-2 text-base font-semibold">
          Challenge overview
        </h2>
        <Card className="space-y-2">
          <p className="text-lg font-semibold">{o.challengeTitle}</p>
          <p className="text-sm text-muted-foreground">Hosted by {o.creatorName}</p>
          <p className="text-sm">
            <ChallengeDateRange startDate={o.startDate} endDate={o.endDate} /> · {o.durationDays}{" "}
            days · {o.challengeTimezone}
          </p>
          <p className="text-xs text-muted-foreground">
            Report generated {new Date(report.generatedAt).toLocaleString()}
          </p>
        </Card>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <MetricCard label="Joined" value={o.totalJoined.toLocaleString()} />
          <MetricCard
            label="Started participating"
            value={o.startedParticipating.toLocaleString()}
            hint="Check-in or activity completion"
          />
          <MetricCard label="Completed" value={o.completedParticipants.toLocaleString()} />
          <MetricCard
            label="Completion rate"
            value={
              o.completionRatePercent != null ? `${o.completionRatePercent}%` : "Not enough data"
            }
            hint={o.completionDefinition}
          />
          <MetricCard label="Total check-ins" value={o.totalCheckIns.toLocaleString()} />
          <MetricCard
            label="Activity completions"
            value={o.totalScheduleActivityCompletions.toLocaleString()}
            hint="Scheduled habit check-offs"
          />
        </div>
      </section>

      <section aria-labelledby="report-engagement">
        <h2 id="report-engagement" className="mb-2 text-base font-semibold">
          Participation &amp; engagement
        </h2>
        <p className="mb-2 text-xs text-muted-foreground">
          Active participants per day (distinct members with a check-in or activity completion).
          Registered but inactive members are excluded from daily counts.
        </p>
        {chartData.some((d) => d.count > 0) ? (
          <CommunityGrowthChart data={chartData} />
        ) : (
          <Card padding="sm">
            <p className="text-sm text-muted-foreground">No daily participation recorded.</p>
          </Card>
        )}
        <div className="mt-2 grid grid-cols-2 gap-2">
          <MetricCard
            label="Avg check-ins / active participant"
            value={
              report.engagement.averageCheckInsPerParticipant != null
                ? String(report.engagement.averageCheckInsPerParticipant)
                : "—"
            }
          />
          <MetricCard
            label="Peak day"
            value={
              report.engagement.peakDayLabel
                ? `${report.engagement.peakDayActive} active`
                : "—"
            }
            hint={report.engagement.peakDayLabel ?? undefined}
          />
        </div>
      </section>

      <section aria-labelledby="report-community">
        <h2 id="report-community" className="mb-2 text-base font-semibold">
          Community activity
        </h2>
        <Card padding="sm" className="space-y-2 text-sm">
          <p>
            Challenge announcements:{" "}
            <strong>{report.community.challengeAnnouncements}</strong>
          </p>
          <p>
            Community updates during challenge:{" "}
            <strong>{report.community.communityAnnouncementsDuringChallenge}</strong>
          </p>
          <p className="text-xs text-muted-foreground">{report.community.note}</p>
        </Card>
      </section>

      <section aria-labelledby="report-coaching">
        <h2 id="report-coaching" className="mb-2 text-base font-semibold">
          Coaching interest
        </h2>
        <Card padding="sm" className="space-y-2 text-sm">
          {report.coaching.status === "unavailable" ? (
            <p className="text-muted-foreground">{report.coaching.message}</p>
          ) : (
            <>
              <p>
                Community link clicks (during challenge):{" "}
                <strong>{report.coaching.totalCommunityLinkClicksDuringChallenge ?? 0}</strong>
              </p>
              <p className="text-xs text-muted-foreground">{report.coaching.message}</p>
            </>
          )}
        </Card>
      </section>

      {report.insights.length ? (
        <section aria-labelledby="report-insights">
          <h2 id="report-insights" className="mb-2 text-base font-semibold">
            What you can learn
          </h2>
          <ul className="space-y-2">
            {report.insights.map((line) => (
              <li key={line}>
                <Card padding="sm" className="text-sm">
                  {line}
                </Card>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="report-recs">
        <h2 id="report-recs" className="mb-2 text-base font-semibold">
          Ideas for your next challenge
        </h2>
        <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
          {report.recommendations.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="report-compare">
        <h2 id="report-compare" className="mb-2 text-base font-semibold">
          Previous challenge comparison
        </h2>
        {report.comparison ? (
          <Card padding="sm" className="space-y-2 text-sm">
            <p className="font-medium">vs {report.comparison.previousChallengeTitle}</p>
            <ul className="space-y-1">
              <li className="flex justify-between gap-2">
                <span>Participants</span>
                <ChangeBadge value={report.comparison.participantsChangePercent} />
              </li>
              <li className="flex justify-between gap-2">
                <span>Completion rate (points)</span>
                <ChangeBadge
                  value={report.comparison.completionRateChangePoints}
                  suffix=" pts"
                />
              </li>
              <li className="flex justify-between gap-2">
                <span>Avg daily active</span>
                <ChangeBadge value={report.comparison.avgDailyActiveChangePercent} />
              </li>
              <li className="flex justify-between gap-2">
                <span>Total check-ins</span>
                <ChangeBadge value={report.comparison.totalCheckInsChangePercent} />
              </li>
              {report.comparison.coachingClicksChangePercent != null ? (
                <li className="flex justify-between gap-2">
                  <span>Community link clicks</span>
                  <ChangeBadge value={report.comparison.coachingClicksChangePercent} />
                </li>
              ) : null}
            </ul>
          </Card>
        ) : (
          <Card padding="sm">
            <p className="text-sm text-muted-foreground">
              Run another challenge to start comparing your results.
            </p>
          </Card>
        )}
      </section>
    </div>
  );
}
