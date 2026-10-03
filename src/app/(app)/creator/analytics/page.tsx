import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { requireApprovedCreator } from "@/lib/auth/profile";
import { demoCreatorAnalytics } from "@/lib/mock-data";
import Link from "next/link";
import {
  Activity,
  Link2,
  UserPlus,
  Users,
} from "lucide-react";

export const metadata = {
  title: "Creator analytics",
};

const metrics = [
  {
    key: "inviteLinkClicks",
    label: "Invite link clicks",
    icon: Link2,
    value: demoCreatorAnalytics.inviteLinkClicks,
  },
  {
    key: "signUpsFromInvites",
    label: "Sign-ups from invites",
    icon: UserPlus,
    value: demoCreatorAnalytics.signUpsFromInvites,
  },
  {
    key: "dailyActiveParticipants",
    label: "Daily active participants",
    icon: Activity,
    value: demoCreatorAnalytics.dailyActiveParticipants,
  },
  {
    key: "challengeJoins",
    label: "Challenge joins",
    icon: Users,
    value: demoCreatorAnalytics.challengeJoins,
  },
  {
    key: "referralSignUps",
    label: "Member referrals",
    icon: UserPlus,
    value: demoCreatorAnalytics.referralSignUps,
  },
] as const;

export default async function CreatorAnalyticsPage() {
  await requireApprovedCreator();

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Creator analytics"
        subtitle={demoCreatorAnalytics.periodLabel}
      />
      <div className="space-y-4 px-4 py-4">
        <p className="text-sm text-muted-foreground">
          <Link href="/studio" className="font-medium text-primary">
            ← Creator Studio
          </Link>
        </p>
        <Card className="border-primary/20 bg-secondary/30">
          <Badge className="mb-2">Free for creators at launch</Badge>
          <p className="text-sm text-muted-foreground">
            Track how your challenge links and community drive sign-ups and daily
            engagement. No billing or paid features in this version — growth comes
            from invites and referrals.
          </p>
        </Card>
        <ul className="grid gap-2">
          {metrics.map(({ key, label, icon: Icon, value }) => (
            <li key={key}>
              <Card padding="sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-muted p-2 text-primary">
                    <Icon className="h-4 w-4" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="text-2xl font-semibold tabular-nums">
                      {value.toLocaleString()}
                    </p>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
        <p className="px-1 text-xs text-muted-foreground">
          Demo numbers only. Live tracking connects with Supabase events in the
          next phase.
        </p>
      </div>
    </div>
  );
}
