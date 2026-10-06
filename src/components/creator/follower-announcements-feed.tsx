"use client";

import { ReportContentMenu } from "@/components/moderation/report-content-menu";
import { Card } from "@/components/ui/card";
import type { FollowerAnnouncement } from "@/lib/data/community-announcements";
import Image from "next/image";

export function FollowerAnnouncementsFeed({
  announcements,
  viewerUserId,
}: {
  announcements: FollowerAnnouncement[];
  viewerUserId: string;
}) {
  const withImages = announcements.filter((a) => a.imageUrl);
  if (!withImages.length) return null;

  return (
    <section aria-labelledby="follower-announcements-heading">
      <h2 id="follower-announcements-heading" className="mb-2 px-1 text-base font-semibold">
        Creator updates
      </h2>
      <ul className="space-y-2">
        {withImages.map((a) => (
          <li key={a.id}>
            <Card className="overflow-hidden p-0">
              <div className="relative aspect-[2/1] w-full bg-muted">
                {a.imageUrl ? (
                  <Image
                    src={a.imageUrl}
                    alt=""
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : null}
                <ReportContentMenu
                  contentType="creator_announcement_image"
                  contentId={a.id}
                  reportedUserId={a.createdBy}
                  canReport={viewerUserId !== a.createdBy}
                />
              </div>
              <div className="p-4">
                <p className="font-semibold">{a.title}</p>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-3">{a.body}</p>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}
