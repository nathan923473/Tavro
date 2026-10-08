import { EditCommunityForm } from "@/components/creator/edit-community-form";
import { StudioLayout } from "@/components/creator/studio/studio-layout";
import { requireApprovedCreator } from "@/lib/auth/profile";
import { fetchOwnerCommunity } from "@/lib/data/communities";
import { redirect } from "next/navigation";

export const metadata = { title: "Create community" };

export default async function StudioCommunitySetupPage() {
  const { user } = await requireApprovedCreator();
  const existing = await fetchOwnerCommunity(user.id);
  if (existing) {
    redirect("/studio/community");
  }

  return (
    <StudioLayout title="Create community" subtitle="Required before public challenges">
      <EditCommunityForm
        slug=""
        ownerId={user.id}
        communityName=""
        bio=""
        brandColor="#3156E8"
        shopUrl=""
        affiliateDisclosure=""
        avatarUrl={null}
        bannerUrl={null}
      />
    </StudioLayout>
  );
}
