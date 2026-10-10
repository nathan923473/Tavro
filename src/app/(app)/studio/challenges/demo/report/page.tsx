import { ChallengeReportView } from "@/components/creator/studio/challenge-report-view";
import { StudioLayout } from "@/components/creator/studio/studio-layout";
import { requireApprovedCreator } from "@/lib/auth/profile";
import { buildDemoChallengeReport } from "@/lib/challenge-report/demo-report";
import Link from "next/link";

export const metadata = { title: "Sample challenge report" };

export default async function DemoChallengeReportPage() {
  await requireApprovedCreator();
  const report = buildDemoChallengeReport();

  return (
    <StudioLayout title="Sample report" subtitle="Preview of a finished challenge">
      <ChallengeReportView report={report} />
      <Link href="/studio/challenges" className="block text-center text-sm text-primary">
        ← All challenges
      </Link>
    </StudioLayout>
  );
}
