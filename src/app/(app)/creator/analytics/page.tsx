import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { requireApprovedCreator } from "@/lib/auth/profile";
import { fetchCreatorDashboardStats } from "@/lib/data/creator-stats";
import { Activity, Link2, UserPlus, Users } from "lucide-react";

export const metadata = { title: "Creator analytics" };

export default async function CreatorAnalyticsPage() {
  const { user } = await requireApprovedCreator();
  const stats = await fetchCreatorDashboardStats(user.id);

  const metrics: Array<{
    key: string;
    label: string;
    icon: typeof Users;
    value: number;
    suffix?: string;
  }> = [
    {
      key: "followers",
      label: "Community followers",
      icon: Users,
      value: stats.totalFollowers,
    },
    {
      key: "participants",
      label: "Challenge participants",
      icon: UserPlus,
      value: stats.totalParticipants,
    },
    {
      key: "active",
      label: "Active challenges",
      icon: Activity,
      value: stats.activeChallenges,
    },
    {
      key: "rate",
      label: "Participation rate",
      icon: Link2,
      value: stats.participationRatePercent,
      suffix: "%",
    },
  ];

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Creator analytics"
        subtitle={stats.periodLabel}
      />
      <div className="space-y-4 px-4 py-4">
        <Card className="border-primary/20 bg-secondary/30">
          <Badge className="mb-2">Live from Supabase</Badge>
          <p className="text-sm text-muted-foreground">
            Followers, challenge joins, and participation — aggregated counts
            only. Detailed invite click tracking can be added later.
          </p>
        </Card>

        <ul className="space-y-2">
          {metrics.map(({ key, label, icon: Icon, value, suffix }) => (
            <li key={key}>
              <Card padding="sm">
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-primary" aria-hidden />
                  <div className="flex flex-1 items-center justify-between">
                    <span className="text-sm">{label}</span>
                    <span className="text-lg font-semibold tabular-nums">
                      {value.toLocaleString()}
                      {suffix ?? ""}
                    </span>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
