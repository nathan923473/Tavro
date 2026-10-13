"use client";

import { CommunityPageEditor } from "@/components/creator/community-page-editor";

export function EditCommunityForm({
  mode = "edit",
  slug,
  ownerId,
  creatorDisplayName,
  communityName,
  bio,
  brandColor,
  shopUrl,
  affiliateDisclosure,
  avatarUrl,
  bannerUrl,
}: {
  mode?: "create" | "edit";
  slug: string;
  ownerId: string;
  creatorDisplayName: string;
  communityName: string;
  bio: string;
  brandColor: string;
  shopUrl: string;
  affiliateDisclosure: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
}) {
  return (
    <CommunityPageEditor
      mode={mode}
      slug={slug}
      ownerId={ownerId}
      creatorDisplayName={creatorDisplayName}
      communityName={communityName}
      bio={bio}
      brandColor={brandColor}
      shopUrl={shopUrl}
      affiliateDisclosure={affiliateDisclosure}
      avatarUrl={avatarUrl}
      bannerUrl={bannerUrl}
    />
  );
}
