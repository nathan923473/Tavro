import { ChallengeDateRange } from "@/components/challenges/challenge-date-range";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { ChallengeReport } from "@/types/challenge-report";

function formatCount(value: number) {
  return value.toLocaleString();
}

function formatPercent(value: number | null) {
  return value == null ? "—" : `${value}%`;
}

function categoryLabel(category: string | null) {
  if (!category) return null;
  return category.replace(/_/g, " ");
}

export function ChallengeReportView({
  report,
  notice,
}: {
  report: ChallengeReport;
  notice?: "saved" | "storage_unavailable" | "partial" | null;
}) {
  const category = categoryLabel(report.category);
  const generated = new Date(report.generatedAt).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="space-y-4">
      {report.isDemo ? (
        <Card className="border-primary/30 bg-secondary/40">
          <Badge>Sample</Badge>
          <p className="mt-2 text-sm text-muted-foreground">
            This is a preview with example numbers. A finished challenge uses your
            Tavro participant totals and saves one snapshot.
          </p>
        </Card>
      ) : null}

      {notice === "saved" ? (
        <p className="text-xs text-muted-foreground">Saved snapshot · {generated}</p>
      ) : null}
      {notice === "storage_unavailable" ? (
        <p className="rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground" role="status">
          This report is calculated live. Run migration 044_creator_challenge_reports.sql
          in Supabase, then open it again to save the snapshot.
        </p>
      ) : null}
      {notice === "partial" ? (
        <p className="rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground" role="status">
          Some totals could not be loaded, so this view was not saved.
        </p>
      ) : null}

      <Card className="space-y-2">
        <p className="text-lg font-semibold">{report.title}</p>
        <p className="text-sm text-muted-foreground">
          <ChallengeDateRange startDate={report.startDate} endDate={report.endDate} />
          {" · "}
          {report.durationDays} {report.durationDays === 1 ? "day" : "days"}
          {category ? ` · ${category}` : ""}
        </p>
        <p className="text-sm">
          Finished means progress of at least {report.completionThresholdPercent}%.
        </p>
      </Card>

      <section aria-labelledby="report-completion">
        <h2 id="report-completion" className="mb-2 text-base font-semibold">
          Completion
        </h2>
        <div className="grid grid-cols-2 gap-2">
          <Metric
            label="Completion rate"
            value={formatPercent(report.completionRatePercent)}
          />
          <Metric label="Participants" value={formatCount(report.participantCount)} />
          <Metric
            label={`Reached ${report.completionThresholdPercent}%`}
            value={formatCount(report.completedCount)}
          />
          <Metric
            label="Average progress"
            value={formatPercent(report.averageProgressPercent)}
          />
          <Metric
            label="Median progress"
            value={formatPercent(report.medianProgressPercent)}
          />
          <Metric
            label="Logged activity"
            value={formatCount(report.activeParticipantCount)}
          />
        </div>
      </section>

      <section aria-labelledby="report-bands">
        <h2 id="report-bands" className="mb-2 text-base font-semibold">
          Progress
        </h2>
        <Card padding="sm" className="space-y-3">
          {report.progressBands.map((band) => {
            const width =
              report.participantCount === 0
                ? 0
                : Math.round((band.count / report.participantCount) * 100);
            return (
              <div key={band.label}>
                <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                  <span>{band.label}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {formatCount(band.count)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })}
        </Card>
      </section>

      <section aria-labelledby="report-activity">
        <h2 id="report-activity" className="mb-2 text-base font-semibold">
          Activity
        </h2>
        <div className="grid grid-cols-2 gap-2">
          <Metric
            label="Activities checked off"
            value={formatCount(report.activityCompletionCount)}
          />
          <Metric
            label="Planned activities"
            value={formatCount(report.plannedActivityCount)}
          />
          <Metric label="Rest days" value={formatCount(report.restDayCount)} />
          <Metric label="Announcements" value={formatCount(report.announcementCount)} />
          <Metric label="Chat messages" value={formatCount(report.messageCount)} />
          <Metric
            label="Joined before start"
            value={formatCount(report.joinedBeforeStartCount)}
          />
        </div>
      </section>

      <section aria-labelledby="report-joins">
        <h2 id="report-joins" className="mb-2 text-base font-semibold">
          How people joined
        </h2>
        <ul className="space-y-2">
          {report.joinsBySource.map((row) => (
            <li key={row.source}>
              <Card padding="sm" className="flex items-center justify-between gap-3 text-sm">
                <span>{row.label}</span>
                <span className="font-semibold tabular-nums">{formatCount(row.count)}</span>
              </Card>
            </li>
          ))}
          <li>
            <Card padding="sm" className="flex items-center justify-between gap-3 text-sm">
              <span>Participant referrals</span>
              <span className="font-semibold tabular-nums">
                {formatCount(report.referralJoinCount)}
              </span>
            </Card>
          </li>
          <li>
            <Card padding="sm" className="flex items-center justify-between gap-3 text-sm">
              <span>New Tavro accounts</span>
              <span className="font-semibold tabular-nums">
                {formatCount(report.newPlatformUserCount)}
              </span>
            </Card>
          </li>
        </ul>
      </section>

      <section aria-labelledby="report-highlights">
        <h2 id="report-highlights" className="mb-2 text-base font-semibold">
          Highlights
        </h2>
        <Card padding="sm">
          <ul className="list-disc space-y-1 pl-4 text-sm">
            {report.highlights.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </Card>
      </section>

      <p className="text-xs text-muted-foreground">
        Totals only. Private check-in notes and health entries are not included.
      </p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card padding="sm" className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold tabular-nums">{value}</p>
    </Card>
  );
}
