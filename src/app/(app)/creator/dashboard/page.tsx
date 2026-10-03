import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { requireApprovedCreator } from "@/lib/auth/profile";
import {
  demoCreatorDashboard,
  demoManagedCreatorSlug,
  getCreatorCommunityBySlug,
} from "@/lib/mock-creators";
import {
  BarChart3,
  Megaphone,
  Pencil,
  PlusCircle,
  Users,
} from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Creator dashboard",
};

export default async function CreatorDashboardPage() {
  await requireApprovedCreator();
  const community = getCreatorCommunityBySlug(demoManagedCreatorSlug);
  const stats = demoCreatorDashboard;

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Creator dashboard"
        subtitle="Private · no access to user health data"
      />
      <div className="space-y-4 px-4 py-4">
        <Card className="border-primary/20 bg-secondary/30">
          <Badge className="mb-2">Approved creator</Badge>
          <p className="text-sm text-muted-foreground">
            Manage {community?.communityName ?? "your community"}, free
            challenges, and announcements. Participant counts are aggregate only
            — never private weigh-ins or group chats.
          </p>
          <Link
            href={`/creator/${demoManagedCreatorSlug}`}
            className="mt-3 inline-block text-sm font-semibold text-primary"
          >
            View public community page →
          </Link>
        </Card>

        <ul className="grid grid-cols-2 gap-2">
          <StatCard
            label="Followers"
            value={stats.totalFollowers.toLocaleString()}
            icon={Users}
          />
          <StatCard
            label="Active challenges"
            value={String(stats.activeChallenges)}
            icon={BarChart3}
          />
          <StatCard
            label="Total participants"
            value={stats.totalParticipants.toLocaleString()}
            icon={Users}
          />
          <StatCard
            label="Participation rate"
            value={`${stats.participationRatePercent}%`}
            icon={BarChart3}
          />
        </ul>

        <div className="grid gap-2">
          <Link
            href={`/creator/${demoManagedCreatorSlug}/edit`}
            className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
          >
            <Pencil className="h-4 w-4" aria-hidden />
            Edit community
          </Link>
          <Button variant="secondary" fullWidth>
            <PlusCircle className="h-4 w-4" aria-hidden />
            Create challenge (demo)
          </Button>
          <Link
            href="/creator/analytics"
            className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border text-sm font-semibold"
          >
            <BarChart3 className="h-4 w-4" aria-hidden />
            Invite & referral analytics
          </Link>
        </div>

        <Card>
          <div className="flex items-start gap-3">
            <Megaphone className="mt-0.5 h-5 w-5 text-primary" aria-hidden />
            <div className="flex-1">
              <h2 className="font-semibold">Community announcement</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {community?.announcement ??
                  "Share updates with followers who opt in to notifications."}
              </p>
              <Button variant="outline" className="mt-3 min-h-9 px-3 text-xs">
                Edit announcement (demo)
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Users;
}) {
  return (
    <Card padding="sm">
      <Icon className="h-4 w-4 text-primary" aria-hidden />
      <p className="mt-2 text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
    </Card>
  );
}
