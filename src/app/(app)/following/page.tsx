import { FollowingInteractive } from "@/components/creator/following-interactive";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import { fetchFollowedCommunities } from "@/lib/data/communities";
import { unwrapOne } from "@/lib/data/relations";

export const metadata = { title: "Following" };

export default async function FollowingPage() {
  const { user } = await getCurrentUserProfile();
  const rows =
    user?.id != null
      ? (await fetchFollowedCommunities(user.id)).map((c) => ({
          id: c.id,
          slug: c.slug,
          communityName: c.community_name,
          bio: c.bio ?? "",
          brandColor: c.brand_color ?? "#3d8b6e",
          avatarInitials: (unwrapOne(c.owner)?.display_name ?? "CR")
            .split(/\s+/)
            .map((w: string) => w[0])
            .join("")
            .slice(0, 2)
            .toUpperCase(),
          memberCount: c.member_count_cache ?? 0,
        }))
      : [];

  return (
    <div className="animate-fade-up">
      <PageHeader title="Following" subtitle="Creators you follow · free" />
      <div className="space-y-3 px-4 py-4">
        <Card className="border-dashed">
          <p className="text-sm text-muted-foreground">
            Following a community does not auto-enrol you in challenges. Join
            each challenge when you&apos;re ready.
          </p>
        </Card>
        <FollowingInteractive rows={rows} />
      </div>
    </div>
  );
}
