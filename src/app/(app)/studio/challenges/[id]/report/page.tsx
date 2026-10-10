import { ChallengeReportView } from "@/components/creator/studio/challenge-report-view";
import { StudioLayout } from "@/components/creator/studio/studio-layout";
import { Card } from "@/components/ui/card";
import { requireApprovedCreator } from "@/lib/auth/profile";
import { getOrGenerateChallengeReport } from "@/lib/challenge-report/get-report";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  return { title: `Challenge report · ${id.slice(0, 8)}` };
}

export default async function ChallengeReportPage({ params }: Props) {
  const { id } = await params;
  const { user } = await requireApprovedCreator();
  const result = await getOrGenerateChallengeReport(user.id, id);

  if (result.status === "forbidden") notFound();

  if (result.status === "not_completed") {
    return (
      <StudioLayout title="Challenge report" subtitle="Available after the challenge ends">
        <Card>
          <p className="text-sm text-muted-foreground">
            Final reports are generated when your challenge reaches its scheduled end. Live
            participation is still on{" "}
            <Link href="/studio/analytics" className="font-medium text-primary">
              Studio analytics
            </Link>
            .
          </p>
          <Link
            href={`/studio/challenges/${id}`}
            className="mt-3 inline-block text-sm font-semibold text-primary"
          >
            ← Back to challenge
          </Link>
        </Card>
      </StudioLayout>
    );
  }

  if (result.status === "error") {
    return (
      <StudioLayout title="Challenge report">
        <Card className="border-destructive/30">
          <p className="text-sm text-destructive">{result.message}</p>
          <Link
            href={`/studio/challenges/${id}`}
            className="mt-3 inline-block text-sm font-semibold text-primary"
          >
            ← Back to challenge
          </Link>
        </Card>
      </StudioLayout>
    );
  }

  return (
    <StudioLayout
      title="Challenge report"
      subtitle={result.report.overview.challengeTitle}
    >
      <ChallengeReportView report={result.report} />
      <Link
        href={`/studio/challenges/${id}`}
        className="mt-6 block text-center text-sm font-medium text-primary"
      >
        ← Manage challenge
      </Link>
      <Link
        href="/studio/challenges"
        className="block text-center text-sm text-muted-foreground"
      >
        All challenges
      </Link>
    </StudioLayout>
  );
}
