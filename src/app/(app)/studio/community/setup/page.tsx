import { EditCommunityForm } from "@/components/creator/edit-community-form";
import { BackButton } from "@/components/layout/back-button";
import { requireApprovedCreator } from "@/lib/auth/profile";
import { fetchOwnerCommunity } from "@/lib/data/communities";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata = { title: "Create community" };

export default async function StudioCommunitySetupPage() {
  const { user } = await requireApprovedCreator();
  const existing = await fetchOwnerCommunity(user.id);
  if (existing) {
    redirect("/studio/community");
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();
  const creatorDisplayName =
    profile?.display_name?.trim() || user.email?.split("@")[0] || "Creator";

  return (
    <div className="animate-fade-up px-4 py-4">
      <div className="mb-4 space-y-2">
        <BackButton fallbackHref="/studio" />
        <div>
          <h1 className="text-lg font-semibold">Create community</h1>
          <p className="text-sm text-muted-foreground">
            Fill in the page below — it&apos;s the same layout followers will see.
          </p>
        </div>
      </div>
      <EditCommunityForm
        mode="create"
        slug=""
        ownerId={user.id}
        creatorDisplayName={creatorDisplayName}
        communityName=""
        bio=""
        brandColor="#3156E8"
        shopUrl=""
        affiliateDisclosure=""
        avatarUrl={null}
        bannerUrl={null}
      />
    </div>
  );
}
