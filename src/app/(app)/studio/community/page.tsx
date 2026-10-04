import { EditCommunityForm } from "@/components/creator/edit-community-form";
import { PageHeader } from "@/components/layout/page-header";
import { requireApprovedCreator } from "@/lib/auth/profile";
import { fetchOwnerCommunity } from "@/lib/data/communities";
import { redirect } from "next/navigation";

export const metadata = { title: "Creator community setup" };

export default async function StudioCommunitySetupPage() {
  const { user } = await requireApprovedCreator();
  const existing = await fetchOwnerCommunity(user.id);
  if (existing) {
    redirect(`/creator/${existing.slug}/edit`);
  }

  return (
    <div className="animate-fade-up px-4 py-4">
      <PageHeader
        title="Create community"
        subtitle="Required before public challenges"
        backHref="/studio"
      />
      <EditCommunityForm
        slug=""
        communityName=""
        bio=""
        brandColor="#3d8b6e"
        shopUrl=""
        affiliateDisclosure=""
      />
    </div>
  );
}
