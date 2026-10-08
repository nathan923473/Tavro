import {
  CommunityAvatarWithReport,
  CommunityBannerWithReport,
} from "@/components/creator/community-hero-report-slots";
import { Badge } from "@/components/ui/badge";
import type { CreatorCommunity } from "@/types/creator-community";
import type { ReactNode } from "react";
import { Globe, Link2, Share2, Video } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const iconMap = {
  instagram: Share2,
  tiktok: Video,
  youtube: Video,
  website: Globe,
} as const;

type CommunityHeroProps = {
  community: CreatorCommunity;
  action?: ReactNode;
  showEditLink?: boolean;
  viewerUserId?: string | null;
};

export function CommunityHero({
  community,
  action,
  showEditLink,
  viewerUserId = null,
}: CommunityHeroProps) {
  return (
    <div className="animate-fade-up">
      <div
        className="relative h-40 w-full"
        style={
          community.bannerUrl
            ? undefined
            : { background: community.bannerGradient }
        }
      >
        {community.bannerUrl ? (
          <CommunityBannerWithReport
            bannerUrl={community.bannerUrl}
            communityId={community.id}
            ownerUserId={community.ownerUserId}
            viewerUserId={viewerUserId}
          />
        ) : null}
        <div className="absolute inset-0 bg-black/10" />
        {showEditLink ? (
          <Link
            href={`/creator/${community.slug}/edit`}
            className="absolute right-3 top-3 rounded-full bg-surface/95 px-3 py-1.5 text-xs font-semibold shadow-sm"
          >
            Edit community
          </Link>
        ) : null}
      </div>
      <div className="relative px-4 pb-2">
        <div className="-mt-12 h-24 w-24 overflow-hidden rounded-2xl border-4 border-background bg-muted shadow-md">
          {community.avatarUrl ? (
            <CommunityAvatarWithReport
              avatarUrl={community.avatarUrl}
              displayName={community.creatorDisplayName}
              communityId={community.id}
              ownerUserId={community.ownerUserId}
              viewerUserId={viewerUserId}
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center text-2xl font-bold text-white"
              style={{ backgroundColor: community.brandColor }}
            >
              {community.avatarInitials}
            </div>
          )}
        </div>
        <div className="mt-3">
          {community.communityName.trim().toLowerCase() !==
          community.creatorDisplayName.trim().toLowerCase() ? (
            <>
              <h1 className="text-xl font-semibold tracking-tight">
                {community.creatorDisplayName}
              </h1>
              <p className="text-sm text-muted-foreground">{community.communityName}</p>
            </>
          ) : (
            <h1 className="text-xl font-semibold tracking-tight">{community.communityName}</h1>
          )}
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {community.bio}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge tone="muted">
            {community.memberCount.toLocaleString()} members
          </Badge>
          <Badge tone="muted">
            {community.challengesHosted} challenges hosted
          </Badge>
          <Badge tone="success">Free community</Badge>
        </div>
        {community.announcement ? (
          <div
            className="mt-4 rounded-xl border px-3 py-2 text-sm"
            style={{
              borderColor: `${community.brandColor}40`,
              backgroundColor: `${community.brandColor}12`,
            }}
          >
            <span className="font-medium">Announcement · </span>
            {community.announcement}
          </div>
        ) : null}
        {action ? <div className="mt-4">{action}</div> : null}
        {community.socialLinks.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-2">
            {community.socialLinks.map((link) => {
              const Icon = iconMap[link.platform] ?? Link2;
              return (
                <li key={link.platform}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium"
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                    {link.label}
                  </a>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
