"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useDemoStore } from "@/lib/demo-store/demo-store";
import { creatorCommunities } from "@/lib/mock-creators";
import Link from "next/link";

export function FollowingInteractive() {
  const { state } = useDemoStore();
  const following = creatorCommunities.filter((c) =>
    state.followingSlugs.includes(c.slug),
  );

  return (
    <>
      {following.length === 0 ? (
        <Card>
          <p className="text-sm text-muted-foreground">
            You&apos;re not following any communities yet. Explore creators on the
            Challenges tab or open a community page and tap Follow.
          </p>
          <Link
            href="/challenges"
            className="mt-3 inline-block text-sm font-semibold text-primary"
          >
            Discover challenges
          </Link>
        </Card>
      ) : (
        <ul className="space-y-2">
          {following.map((community) => (
            <li key={community.id}>
              <Link href={`/creator/${community.slug}`}>
                <Card className="flex items-center gap-3 transition-colors hover:bg-muted/30">
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white"
                    style={{ backgroundColor: community.brandColor }}
                  >
                    {community.avatarInitials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{community.communityName}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {community.creatorDisplayName}
                    </p>
                  </div>
                  <Badge tone="success">Following</Badge>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
