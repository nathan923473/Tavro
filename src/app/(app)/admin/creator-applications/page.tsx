import { CreatorAcquisitionSummary } from "@/components/admin/creator-acquisition-summary";
import { CreatorApplicationReviewList } from "@/components/admin/creator-application-review-list";
import { PageHeader } from "@/components/layout/page-header";
import { requireAdmin } from "@/lib/auth/require-admin";
import { listApplicationsForAdmin } from "@/lib/creator/applications";
import { fetchCreatorAcquisitionStats } from "@/lib/data/creator-acquisition";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Creator applications" };

export default async function AdminCreatorApplicationsPage() {
  await requireAdmin();
  const [applications, stats] = await Promise.all([
    listApplicationsForAdmin(),
    fetchCreatorAcquisitionStats(),
  ]);

  const referrerIds = [
    ...new Set(
      applications.map((a) => a.referred_by_user_id).filter(Boolean) as string[],
    ),
  ];
  const referrerNames: Record<string, string> = {};
  if (referrerIds.length) {
    const supabase = await createClient();
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", referrerIds);
    for (const p of profiles ?? []) {
      referrerNames[p.id] = p.display_name?.trim() || p.id;
    }
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Creator applications"
        subtitle="Private admin review · verification required before approval"
      />
      <div className="px-4 py-4">
        <CreatorAcquisitionSummary stats={stats} />
        <CreatorApplicationReviewList
          applications={applications}
          referrerNames={referrerNames}
        />
      </div>
    </div>
  );
}
