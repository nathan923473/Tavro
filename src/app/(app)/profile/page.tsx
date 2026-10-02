import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { CopyLinkButton } from "@/components/share/copy-link-button";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { demoUser } from "@/lib/mock-data";
import { userReferralPath } from "@/lib/site-url";
import Link from "next/link";
import {
  BarChart3,
  Download,
  Gift,
  LogOut,
  Shield,
  UserRound,
} from "lucide-react";

export const metadata = {
  title: "Profile",
};

export default function ProfilePage() {
  return (
    <div className="animate-fade-up">
      <PageHeader title="Profile" subtitle="Free account · invite others" />
      <div className="space-y-4 px-4 py-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
              <UserRound className="h-7 w-7" aria-hidden />
            </div>
            <div>
              <p className="text-lg font-semibold">{demoUser.firstName}</p>
              <Badge tone="success" className="mt-1">
                <Gift className="mr-1 inline h-3 w-3" aria-hidden />
                Free member
              </Badge>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {demoUser.habits.map((habit) => (
              <Badge key={habit} tone="muted">
                {habit}
              </Badge>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold">Grow with referrals</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Invite friends for free. When they join via your link, we&apos;ll count
            it in analytics (once backend is connected).
          </p>
          <div className="mt-3">
            <CopyLinkButton
              url={userReferralPath(demoUser.referralCode)}
              label="Copy my referral link"
              fullWidth
            />
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold">Fitness creators</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Host free challenges with unique invite links. No subscriptions or paid
            challenges during launch.
          </p>
          <Link
            href="/creator/analytics"
            className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm font-semibold"
          >
            <BarChart3 className="h-4 w-4" aria-hidden />
            View creator analytics (demo)
          </Link>
        </Card>

        <InstallPrompt />

        <Card>
          <h2 className="font-semibold">Account & privacy</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Shield className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              Sign-up & login via Supabase (next phase)
            </li>
            <li>
              <Link href="/onboarding" className="font-medium text-primary">
                Replay onboarding flow
              </Link>
            </li>
          </ul>
        </Card>

        <div className="space-y-2">
          <Button variant="outline" fullWidth className="justify-start">
            <Download className="h-4 w-4" aria-hidden />
            Export my data
          </Button>
          <Button variant="outline" fullWidth className="justify-start">
            <Shield className="h-4 w-4" aria-hidden />
            Privacy & blocking
          </Button>
          <Button variant="ghost" fullWidth className="justify-start text-red-600">
            <LogOut className="h-4 w-4" aria-hidden />
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
