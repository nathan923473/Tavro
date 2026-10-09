import { StudioLayout } from "@/components/creator/studio/studio-layout";
import { Card } from "@/components/ui/card";
import { requireApprovedCreator } from "@/lib/auth/profile";
import { fetchCreatorStudioOverview, fetchCreatorStudioChallenges } from "@/lib/data/creator-studio";
import { fetchOwnerCommunity } from "@/lib/data/communities";
import Link from "next/link";

export const metadata = { title: "Studio community" };

export default async function StudioCommunityPage() {
  const { user } = await requireApprovedCreator();
  const owner = await fetchOwnerCommunity(user.id);

  if (!owner) {
    return (
      <StudioLayout title="Community" subtitle="Your permanent audience on Tavro">
        <Card>
          <p className="text-sm text-muted-foreground">
            Followers stay with you after each challenge ends — set up your page once.
          </p>
          <Link
            href="/studio/community/setup"
            className="mt-3 inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
          >
            Create community page
          </Link>
        </Card>
      </StudioLayout>
    );
  }

  const [overview, challenges] = await Promise.all([
    fetchCreatorStudioOverview(user.id),
    fetchCreatorStudioChallenges(user.id),
  ]);

  const totalParticipants = challenges.reduce((s, c) => s + c.participantCount, 0);

  return (
    <StudioLayout title="Community" subtitle="Aggregate stats · privacy safe">
      <Card className="space-y-2">
        <p className="text-2xl font-semibold tabular-nums">
          {overview.totalFollowers.toLocaleString()} followers
        </p>
        <p className="text-sm text-muted-foreground">
          +{overview.newFollowersThisWeek} this week · +{overview.newFollowersThisMonth}{" "}
          this month
        </p>
        <p className="text-sm">
          {totalParticipants} total challenge participants across your challenges
        </p>
      </Card>

      <Link
        href="/studio/announcements"
        className="flex min-h-11 items-center justify-center rounded-xl border border-border text-sm font-semibold"
      >
        Post community update
      </Link>
      <Link
        href={`/creator/${owner.slug}/edit`}
        className="flex min-h-11 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground"
      >
        Edit public community page
      </Link>
      <Link
        href={`/creator/${owner.slug}`}
        className="block text-center text-sm font-medium text-primary"
      >
        View public page →
      </Link>
    </StudioLayout>
  );
}
