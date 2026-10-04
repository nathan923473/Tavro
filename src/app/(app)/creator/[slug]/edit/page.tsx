import { EditCommunityForm } from "@/components/creator/edit-community-form";
import { Card } from "@/components/ui/card";
import { BackButton } from "@/components/layout/back-button";
import { requireApprovedCreator } from "@/lib/auth/profile";
import { fetchCommunityBySlug } from "@/lib/data/communities";
import { notFound, redirect } from "next/navigation";

type EditCommunityPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: EditCommunityPageProps) {
  const { slug } = await params;
  return { title: `Edit ${slug}` };
}

export default async function EditCommunityPage({
  params,
}: EditCommunityPageProps) {
  const { slug } = await params;
  const { user } = await requireApprovedCreator();
  const { community, isOwner } = await fetchCommunityBySlug(slug, user.id);

  if (!community) {
    redirect("/studio");
  }
  if (!isOwner) {
    notFound();
  }

  return (
    <div className="animate-fade-up px-4 py-4">
      <div className="mb-4 space-y-3">
        <BackButton fallbackHref={`/creator/${slug}`} />
        <div>
          <h1 className="text-lg font-semibold">Edit community</h1>
          <p className="text-xs text-muted-foreground">
            Saved to Supabase · upload photos below
          </p>
        </div>
      </div>

      <Card className="mb-4 border-dashed">
        <p className="text-sm text-muted-foreground">
          Approved creators only (enforced by RLS). Create your community here
          before publishing public challenges.
        </p>
      </Card>

      <EditCommunityForm
        slug={community.slug}
        ownerId={community.ownerUserId}
        communityName={community.communityName}
        bio={community.bio}
        brandColor={community.brandColor}
        shopUrl={community.shopUrl ?? ""}
        affiliateDisclosure={community.affiliateDisclosure ?? ""}
        avatarUrl={community.avatarUrl}
        bannerUrl={community.bannerUrl}
      />
    </div>
  );
}
