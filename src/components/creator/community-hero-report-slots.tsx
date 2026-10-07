"use client";

import { ReportContentMenu } from "@/components/moderation/report-content-menu";
import { UserAvatar } from "@/components/ui/user-avatar";
import Image from "next/image";

export function CommunityBannerWithReport({
  bannerUrl,
  communityId,
  ownerUserId,
  viewerUserId,
}: {
  bannerUrl: string;
  communityId: string;
  ownerUserId: string;
  viewerUserId: string | null;
}) {
  const canReport = Boolean(viewerUserId && viewerUserId !== ownerUserId);
  return (
    <div className="relative h-full w-full">
      <Image src={bannerUrl} alt="" fill className="object-cover" priority unoptimized />
      <ReportContentMenu
        contentType="creator_banner"
        contentId={communityId}
        reportedUserId={ownerUserId}
        canReport={canReport}
      />
    </div>
  );
}

export function CommunityAvatarWithReport({
  avatarUrl,
  displayName,
  communityId,
  ownerUserId,
  viewerUserId,
}: {
  avatarUrl: string;
  displayName: string;
  communityId: string;
  ownerUserId: string;
  viewerUserId: string | null;
}) {
  const canReport = Boolean(viewerUserId && viewerUserId !== ownerUserId);
  return (
    <div className="relative h-full w-full">
      <UserAvatar
        displayName={displayName}
        avatarUrl={avatarUrl}
        size="lg"
        className="h-full w-full rounded-2xl"
      />
      <ReportContentMenu
        contentType="creator_avatar"
        contentId={communityId}
        reportedUserId={ownerUserId}
        canReport={canReport}
        className="right-1 top-1"
      />
    </div>
  );
}
