import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { AccountExperience } from "@/components/profile/account-experience";
import { CopyLinkButton } from "@/components/share/copy-link-button";
import { SupabaseStatus } from "@/components/profile/supabase-status";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import { demoUser } from "@/lib/mock-data";
import { userReferralPath } from "@/lib/site-url";
import Link from "next/link";
import { ExportDemoDataButton } from "@/components/profile/export-demo-data-button";
import { Shield, Users } from "lucide-react";

export const metadata = {
  title: "Profile",
};

export default async function ProfilePage() {
  const { profile } = await getCurrentUserProfile();
  const referralCode = profile?.referralCode ?? demoUser.referralCode;

  return (
    <div className="animate-fade-up">
      <PageHeader title="Profile" subtitle="Member or creator · one account" />
      <div className="space-y-4 px-4 py-4">
        <AccountExperience />

        <Card>
          <h2 className="font-semibold">Grow with referrals</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Invite friends for free — members and creators use the same referral
            system.
          </p>
          <div className="mt-3">
            <CopyLinkButton
              url={userReferralPath(referralCode)}
              label="Copy my referral link"
              fullWidth
            />
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold">Communities</h2>
          <div className="mt-3 space-y-2">
            <Link
              href="/following"
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm font-semibold"
            >
              <Users className="h-4 w-4" aria-hidden />
              Communities I follow
            </Link>
            <Link
              href="/creator/sarahfitness"
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm font-semibold"
            >
              Explore a creator community
            </Link>
          </div>
        </Card>

        {!profile ? (
          <Card>
            <p className="text-sm text-muted-foreground">
              Demo habits preview (log in for your real profile):
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {demoUser.habits.map((habit) => (
                <Badge key={habit} tone="muted">
                  {habit}
                </Badge>
              ))}
            </div>
          </Card>
        ) : null}

        <SupabaseStatus />
        <InstallPrompt />

        <Card>
          <h2 className="font-semibold">Privacy</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Shield className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              Creators never see private weigh-ins or group chats
            </li>
            <li>
              <Link href="/onboarding" className="font-medium text-primary">
                Replay onboarding
              </Link>
            </li>
          </ul>
        </Card>

        <ExportDemoDataButton />
      </div>
    </div>
  );
}
