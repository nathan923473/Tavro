import { Card } from "@/components/ui/card";
import Link from "next/link";

type FollowRow = {
  id: string;
  slug: string;
  communityName: string;
  bio: string;
  brandColor: string;
  avatarInitials: string;
  memberCount: number;
};

export function FollowingInteractive({ rows }: { rows: FollowRow[] }) {
  if (rows.length === 0) {
    return (
      <Card>
        <p className="text-sm text-muted-foreground">
          You&apos;re not following any creators yet. Browse communities on the
          Challenges tab.
        </p>
      </Card>
    );
  }

  return (
    <ul className="space-y-2">
      {rows.map((community) => (
        <li key={community.id}>
          <Link href={`/creator/${community.slug}`}>
            <Card className="flex items-center gap-3 p-3 transition-colors hover:bg-muted/40">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                style={{ backgroundColor: community.brandColor }}
              >
                {community.avatarInitials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{community.communityName}</p>
                <p className="line-clamp-2 text-xs text-muted-foreground">
                  {community.bio}
                </p>
              </div>
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  );
}
