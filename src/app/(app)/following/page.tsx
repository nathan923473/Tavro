import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import {
  creatorCommunities,
  demoFollowingSlugs,
} from "@/lib/mock-creators";
import Link from "next/link";

export const metadata = {
  title: "Following",
};

export default function FollowingPage() {
  const following = creatorCommunities.filter((c) =>
    demoFollowingSlugs.includes(c.slug),
  );

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Following"
        subtitle="Creators you follow · free"
      />
      <div className="space-y-3 px-4 py-4">
        <Card className="border-dashed">
          <p className="text-sm text-muted-foreground">
            Following a community does not auto-enrol you in challenges. Join
            each challenge when you&apos;re ready.
          </p>
        </Card>
        {following.length === 0 ? (
          <Card>
            <p className="text-sm text-muted-foreground">
              You&apos;re not following any communities yet. Explore creators on
              the Challenges tab.
            </p>
            <Link href="/challenges" className="mt-3 inline-block text-sm font-semibold text-primary">
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
                      <p className="text-sm text-muted-foreground truncate">
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
      </div>
    </div>
  );
}
