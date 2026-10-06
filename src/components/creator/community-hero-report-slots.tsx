"use client";

import { ReportContentMenu } from "@/components/moderation/report-content-menu";
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
  communityId,
  ownerUserId,
  viewerUserId,
}: {
  avatarUrl: string;
  communityId: string;
  ownerUserId: string;
  viewerUserId: string | null;
}) {
  const canReport = Boolean(viewerUserId && viewerUserId !== ownerUserId);
  return (
    <div className="relative h-full w-full">
      <Image
        src={avatarUrl}
        alt=""
        width={96}
        height={96}
        className="h-full w-full object-cover"
        unoptimized
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
