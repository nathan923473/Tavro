import { Card } from "@/components/ui/card";
import { CommunityGrowthChart } from "@/components/creator/studio/community-growth-chart";
import { DailyEngagementChart } from "@/components/creator/studio/daily-engagement-chart";
import { ReportMetricCard } from "@/components/creator/studio/report-metric-card";
import { ChallengeDateRange } from "@/components/challenges/challenge-date-range";
import type { AnyChallengeReportPayload, ChallengeReportPayload } from "@/types/challenge-report";
import { isReportV2 } from "@/types/challenge-report";

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

function LegacyReportView({ report }: { report: ChallengeReportPayload }) {
  const o = report.overview;
  const chartData = report.engagement.daily.map((d) => ({
    label: d.label,
    count: d.activeParticipants,
  }));

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground">
        Older report format — open again after migration to refresh with expanded metrics (existing
        snapshots are preserved).
      </p>
      {/* legacy sections unchanged */}
      <section aria-labelledby="report-overview">
        <h2 id="report-overview" className="mb-2 text-base font-semibold">
          Challenge overview
        </h2>
        <Card className="space-y-2">
          <p className="text-lg font-semibold">{o.challengeTitle}</p>
          <p className="text-sm text-muted-foreground">Hosted by {o.creatorName}</p>
          <p className="text-sm">
            <ChallengeDateRange startDate={o.startDate} endDate={o.endDate} /> · {o.durationDays}{" "}
            days
          </p>
        </Card>
      </section>
      {chartData.some((d) => d.count > 0) ? (
        <CommunityGrowthChart data={chartData} />
      ) : null}
    </div>
  );
}

function V2ReportView({ report }: { report: Extract<AnyChallengeReportPayload, { version: 2 }> }) {
  const o = report.overview;

  return (
    <div className="space-y-8">
      <p className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        {report.snapshotNote}
      </p>

      <section aria-labelledby="report-overview">
        <h2 id="report-overview" className="mb-2 text-base font-semibold text-[#1B2440]">
          Challenge overview
        </h2>
        <Card className="space-y-2 border-primary/10">
          <p className="text-lg font-semibold">{o.challengeTitle}</p>
          <p className="text-sm text-muted-foreground">Hosted by {o.creatorName}</p>
          <p className="text-sm">
            <ChallengeDateRange startDate={o.startDate} endDate={o.endDate} /> · {o.durationDays}{" "}
            days · {o.challengeTimezone}
          </p>
          <p className="text-xs text-muted-foreground">
            Snapshot generated {new Date(report.generatedAt).toLocaleString()}
          </p>
        </Card>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <ReportMetricCard
            label="Joined"
            value={o.totalJoined.value}
            hint={o.totalJoined.hint}
          />
          <ReportMetricCard
            label="Started participating"
            value={o.startedParticipating.value}
            hint={o.startedParticipating.hint}
          />
        </div>
      </section>

      <section aria-labelledby="report-progress">
        <h2 id="report-progress" className="mb-2 text-base font-semibold">
          Completion &amp; progress
        </h2>
        <div className="grid grid-cols-2 gap-2">
          <ReportMetricCard
            label={`Reached ${report.progress.completionThresholdPercent}%`}
            value={report.progress.completedParticipants.value}
            hint={report.progress.completedParticipants.hint}
          />
          <ReportMetricCard
            label="Completion rate"
            value={
              report.progress.completionRatePercent != null
                ? `${report.progress.completionRatePercent}%`
                : "—"
            }
            hint={report.progress.completionRateHint}
          />
          <ReportMetricCard
            label="Average progress"
            value={
              report.progress.averageProgressPercent != null
                ? `${report.progress.averageProgressPercent}%`
                : "—"
            }
            hint="Mean of stored progress_percent for joined participants."
          />
          <ReportMetricCard
            label="Median progress"
            value={
              report.progress.medianProgressPercent != null
                ? `${report.progress.medianProgressPercent}%`
                : "—"
            }
            hint="Middle progress value — less skewed by outliers."
          />
        </div>
        {report.progress.distribution.some((b) => b.count > 0) ? (
          <Card padding="sm" className="mt-2 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Progress distribution</p>
            <ul className="space-y-1 text-sm">
              {report.progress.distribution.map((b) => (
                <li key={b.label} className="flex justify-between gap-2">
                  <span>{b.label}</span>
                  <span className="font-semibold tabular-nums">{b.count}</span>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
        <div className="mt-2 grid grid-cols-2 gap-2">
          <ReportMetricCard
            label="Total check-ins"
            value={report.activity.totalCheckIns.value}
            hint={report.activity.totalCheckIns.hint}
          />
          <ReportMetricCard
            label="Activities checked off"
            value={report.activity.scheduleCompletions.value}
            hint={report.activity.scheduleCompletions.hint}
          />
          <ReportMetricCard
            label="Planned activity days"
            value={String(report.activity.plannedActivityDays)}
            hint="Scheduled days that are not rest days."
          />
          <ReportMetricCard
            label="Rest days in schedule"
            value={String(report.activity.restDaysInSchedule)}
            hint="Rest days are not required for progress check-offs."
          />
        </div>
      </section>

      <section aria-labelledby="report-daily">
        <h2 id="report-daily" className="mb-2 text-base font-semibold">
          Daily engagement
        </h2>
        <p className="mb-2 text-xs text-muted-foreground">
          {report.dailyEngagement.chartLabel} — distinct participants with at least one qualifying
          check-in or scheduled activity completion that day (challenge timezone). This is not
          retention.
        </p>
        {report.dailyEngagement.daily.some((d) => d.activeParticipants > 0) ? (
          <DailyEngagementChart
            data={report.dailyEngagement.daily}
            ariaLabel={report.dailyEngagement.chartLabel}
          />
        ) : (
          <Card padding="sm">
            <p className="text-sm text-muted-foreground">No qualifying daily activity recorded.</p>
          </Card>
        )}
        {report.dailyEngagement.trendSummary ? (
          <p className="mt-2 text-sm text-muted-foreground">{report.dailyEngagement.trendSummary}</p>
        ) : null}
      </section>

      <section aria-labelledby="report-community">
        <h2 id="report-community" className="mb-2 text-base font-semibold">
          Community activity
        </h2>
        <Card padding="sm" className="space-y-2 text-sm">
          <p>
            Challenge announcements: <strong>{report.community.challengeAnnouncements}</strong>
          </p>
          <p>
            Community updates during challenge:{" "}
            <strong>{report.community.communityAnnouncementsDuringChallenge}</strong>
          </p>
          <p>
            Challenge chat messages: <strong>{report.community.chatMessagesDuringChallenge}</strong>
          </p>
          <p className="text-xs text-muted-foreground">{report.community.note}</p>
        </Card>
      </section>

      <section aria-labelledby="report-coaching">
        <h2 id="report-coaching" className="mb-2 text-base font-semibold">
          Coaching interest
        </h2>
        <Card padding="sm" className="space-y-2 text-sm">
          <p>
            Program / shop link clicks:{" "}
            <strong>
              {report.coaching.programLinkClicks == null
                ? "Not tracked"
                : report.coaching.programLinkClicks}
            </strong>
          </p>
          <p>
            Completion offer clicks:{" "}
            <strong>
              {report.coaching.completionOfferClicks == null
                ? "Not tracked"
                : report.coaching.completionOfferClicks}
            </strong>
          </p>
          <p className="text-xs text-muted-foreground">
            Unique clickers: not tracked (privacy-preserving aggregate counts only).
          </p>
          <p className="text-xs text-muted-foreground">{report.coaching.trackingNote}</p>
          <p className="text-xs text-muted-foreground">{report.coaching.disclaimer}</p>
        </Card>
      </section>

      <section aria-labelledby="report-acquisition">
        <h2 id="report-acquisition" className="mb-2 text-base font-semibold">
          Participant acquisition &amp; growth
        </h2>
        <Card padding="sm" className="space-y-3">
          <div>
            <p className="text-sm font-medium">Where participants came from</p>
            <p className="text-xs text-muted-foreground">{report.acquisition.note}</p>
            <ul className="mt-2 space-y-1 text-sm">
              {report.acquisition.sources.map((s) => (
                <li key={s.key} className="flex justify-between gap-2">
                  <span>{s.label}</span>
                  <span className="font-semibold tabular-nums">{s.count}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="border-t border-border pt-2">
            <p className="text-sm font-medium">Growth generated</p>
            <p className="text-xs text-muted-foreground">{report.growth.note}</p>
            <ul className="mt-2 space-y-1 text-sm">
              <li className="flex justify-between gap-2">
                <span>Referral-attributed joins</span>
                <strong>{report.growth.referralAttributedJoins}</strong>
              </li>
              <li className="flex justify-between gap-2">
                <span>New Tavro accounts at join</span>
                <strong>{report.growth.newPlatformAccountsAtJoin}</strong>
              </li>
            </ul>
          </div>
        </Card>
      </section>

      <section aria-labelledby="report-feedback">
        <h2 id="report-feedback" className="mb-2 text-base font-semibold">
          Participant feedback
        </h2>
        <Card padding="sm" className="space-y-2 text-sm">
          {report.feedback.responseCount === 0 ? (
            <p className="text-muted-foreground">{report.feedback.emptyMessage}</p>
          ) : (
            <>
              <p>
                Responses: <strong>{report.feedback.responseCount}</strong>
              </p>
              {report.feedback.ratingDisplaySafe && report.feedback.averageRating != null ? (
                <p>
                  Average rating: <strong>{report.feedback.averageRating} / 5</strong>
                </p>
              ) : (
                <p className="text-muted-foreground">{report.feedback.emptyMessage}</p>
              )}
              {report.feedback.consentedWrittenSamples.length ? (
                <ul className="mt-2 space-y-2 border-t border-border pt-2">
                  {report.feedback.consentedWrittenSamples.map((line) => (
                    <li key={line} className="text-xs text-muted-foreground">
                      “{line}”
                    </li>
                  ))}
                </ul>
              ) : null}
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
                <Card padding="sm" className="border-l-4 border-l-[#3156E8] text-sm">
                  {line}
                </Card>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {report.recommendations.length ? (
        <section aria-labelledby="report-recs">
          <h2 id="report-recs" className="mb-2 text-base font-semibold">
            Ideas for your next challenge
          </h2>
          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
            {report.recommendations.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Suggestions only — not guarantees of future results.
          </p>
        </section>
      ) : null}

      <section aria-labelledby="report-compare">
        <h2 id="report-compare" className="mb-2 text-base font-semibold">
          Compare with previous challenge
        </h2>
        {report.comparison ? (
          <Card padding="sm" className="space-y-2 text-sm">
            <p className="font-medium">{report.comparison.previousChallengeTitle}</p>
            <p className="text-xs text-muted-foreground">
              <ChallengeDateRange
                startDate={report.comparison.previousStartDate}
                endDate={report.comparison.previousEndDate}
              />{" "}
              · {report.comparison.previousDurationDays} days
            </p>
            {report.comparison.comparisonNote ? (
              <p className="text-xs text-amber-800">{report.comparison.comparisonNote}</p>
            ) : null}
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
                <span>Average progress (points)</span>
                <ChangeBadge value={report.comparison.avgProgressChangePoints} suffix=" pts" />
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
                  <span>Link clicks</span>
                  <ChangeBadge value={report.comparison.coachingClicksChangePercent} />
                </li>
              ) : null}
            </ul>
          </Card>
        ) : (
          <Card padding="sm">
            <p className="text-sm text-muted-foreground">
              Complete another challenge to start comparing your results.
            </p>
          </Card>
        )}
      </section>
    </div>
  );
}

export function ChallengeReportView({ report }: { report: AnyChallengeReportPayload }) {
  if (isReportV2(report)) {
    return <V2ReportView report={report} />;
  }
  return <LegacyReportView report={report} />;
}
