import { ContentReportReviewList } from "@/components/admin/content-report-review-list";
import { PageHeader } from "@/components/layout/page-header";
import { requireAdmin } from "@/lib/auth/require-admin";
import { listContentReportsForAdmin } from "@/lib/data/content-reports";

export const metadata = { title: "Content reports" };

export default async function AdminContentReportsPage() {
  await requireAdmin();
  const reports = await listContentReportsForAdmin();

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Content reports"
        subtitle="Private admin review · manual follow-up only"
      />
      <div className="px-4 py-4">
        <ContentReportReviewList reports={reports} />
      </div>
    </div>
  );
}
