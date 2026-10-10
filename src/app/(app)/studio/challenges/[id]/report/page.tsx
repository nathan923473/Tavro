import { ChallengeReportView } from "@/components/creator/studio/challenge-report-view";
import { StudioLayout } from "@/components/creator/studio/studio-layout";
import { requireApprovedCreator } from "@/lib/auth/profile";
import { getCreatorChallengeReport } from "@/lib/challenge-report/get-report";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
};

export const metadata = { title: "Challenge report" };

export default async function ChallengeReportPage({ params }: Props) {
  const { id } = await params;
  const { user } = await requireApprovedCreator();
  const result = await getCreatorChallengeReport(id, user.id);

  if (result.status === "not_found") notFound();

  if (result.status === "not_completed") {
    return (
      <StudioLayout title="Challenge report" subtitle={result.title}>
        <p className="text-sm text-muted-foreground">
          This report is available after the challenge ends. Completion counts
          participants at 80% progress or more.
        </p>
        <Link href={`/studio/challenges/${id}`} className="block text-sm font-semibold text-primary">
          ← Manage challenge
        </Link>
      </StudioLayout>
    );
  }

  return (
    <StudioLayout title="Challenge report" subtitle={result.report.title}>
      <ChallengeReportView report={result.report} notice={result.notice} />
      <Link href={`/studio/challenges/${id}`} className="block text-center text-sm text-primary">
        ← Manage challenge
      </Link>
    </StudioLayout>
  );
}
