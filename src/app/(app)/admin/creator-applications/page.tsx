import { CreatorApplicationReviewList } from "@/components/admin/creator-application-review-list";
import { PageHeader } from "@/components/layout/page-header";
import { requireAdmin } from "@/lib/auth/require-admin";
import { listApplicationsForAdmin } from "@/lib/creator/applications";

export const metadata = { title: "Creator applications" };

export default async function AdminCreatorApplicationsPage() {
  await requireAdmin();
  const applications = await listApplicationsForAdmin();

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Creator applications"
        subtitle="Private admin review · verification required before approval"
      />
      <div className="px-4 py-4">
        <CreatorApplicationReviewList applications={applications} />
      </div>
    </div>
  );
}
