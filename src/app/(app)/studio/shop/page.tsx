import { StudioCompletionOfferPanel } from "@/components/creator/studio/studio-completion-offer-panel";
import { StudioShopPanel } from "@/components/creator/studio/studio-shop-panel";
import { StudioLayout } from "@/components/creator/studio/studio-layout";
import { requireApprovedCreator } from "@/lib/auth/profile";
import {
  fetchCommunityCompletionOfferSettings,
  fetchCreatorLinks,
} from "@/lib/data/creator-studio";
import { fetchOwnerCommunity } from "@/lib/data/communities";
import Link from "next/link";

export const metadata = { title: "Shop & links" };

export default async function StudioShopPage() {
  const { user } = await requireApprovedCreator();
  const community = await fetchOwnerCommunity(user.id);

  if (!community) {
    return (
      <StudioLayout title="Shop & links">
        <p className="text-sm text-muted-foreground">
          <Link href="/studio/community" className="font-medium text-primary">
            Create your community
          </Link>{" "}
          first.
        </p>
      </StudioLayout>
    );
  }

  const [links, offerSettings] = await Promise.all([
    fetchCreatorLinks(community.id),
    fetchCommunityCompletionOfferSettings(community.id),
  ]);

  return (
    <StudioLayout
      title="Shop & links"
      subtitle="Shown on your public creator page when marked public"
    >
      <StudioShopPanel communityId={community.id} links={links} />
      <StudioCompletionOfferPanel
        communityId={community.id}
        links={links}
        initial={offerSettings}
      />
      <Link
        href={`/creator/${community.slug}/edit`}
        className="block text-center text-sm text-primary"
      >
        Legacy shop URL on community edit →
      </Link>
    </StudioLayout>
  );
}
