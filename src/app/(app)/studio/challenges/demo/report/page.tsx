import { ChallengeReportView } from "@/components/creator/studio/challenge-report-view";
import { StudioLayout } from "@/components/creator/studio/studio-layout";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { requireApprovedCreator } from "@/lib/auth/profile";
import { buildDemoChallengeReport } from "@/lib/challenge-report/demo-report";
import Link from "next/link";

export const metadata = { title: "Sample challenge report · Creator Studio" };

export default async function DemoChallengeReportPage() {
  const { profile } = await requireApprovedCreator();
  const report = buildDemoChallengeReport(profile.displayName ?? "Creator");

  return (
    <StudioLayout
      title="Sample challenge report"
      subtitle="Preview what you’ll see when a challenge finishes"
    >
      <Card className="border-primary/30 bg-primary/5 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="muted">Demo only</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          This report uses illustrative numbers so you can explore the layout before any of your
          challenges end. Your real report is generated automatically when a{" "}
          <strong className="font-medium text-foreground">completed public</strong> challenge
          reaches its scheduled end — open it from{" "}
          <Link href="/studio/challenges" className="font-medium text-primary">
            Challenges → View report
          </Link>
          .
        </p>
      </Card>

      <ChallengeReportView report={report} />

      <Link
        href="/studio/challenges"
        className="mt-6 block text-center text-sm font-medium text-primary"
      >
        ← Back to challenges
      </Link>
    </StudioLayout>
  );
}
