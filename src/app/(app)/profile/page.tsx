import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { AccountExperience } from "@/components/profile/account-experience";
import { AdminToolsCard } from "@/components/profile/admin-tools-card";
import { DisplayNameCard } from "@/components/profile/display-name-card";
import { CreatorMediaCard } from "@/components/profile/creator-media-card";
import { NotificationPreferencesCard } from "@/components/profile/notification-preferences-card";
import { TimezoneSettingsCard } from "@/components/profile/timezone-settings-card";
import { createClient } from "@/lib/supabase/server";
import type { AuStateOrTerritory } from "@/lib/timezone/constants";
import { ProfilePhotoCard } from "@/components/profile/profile-photo-card";
import { CopyLinkButton } from "@/components/share/copy-link-button";
import { SupabaseStatus } from "@/components/profile/supabase-status";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import { fetchMemberGoals } from "@/lib/data/member";
import { userReferralPath } from "@/lib/site-url";
import Link from "next/link";
import { Shield, Users } from "lucide-react";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const { user, profile } = await getCurrentUserProfile();
  const referralCode = profile?.referralCode ?? "sign-in-for-code";
  const goals = user ? await fetchMemberGoals(user.id) : [];

  let timezone: string | null = null;
  let auState: AuStateOrTerritory | null = null;
  if (user) {
    const supabase = await createClient();
    const { data: tzRow } = await supabase
      .from("profiles")
      .select("timezone, au_state_or_territory")
      .eq("id", user.id)
      .maybeSingle();
    timezone = tzRow?.timezone ?? null;
    auState = (tzRow?.au_state_or_territory as AuStateOrTerritory | null) ?? null;
  }

  return (
    <div className="animate-fade-up">
      <PageHeader title="Profile" subtitle="Member or creator · one account" />
      <div className="space-y-4 px-4 py-4">
        {profile ? (
          <DisplayNameCard
            initialName={profile.displayName ?? user?.email?.split("@")[0] ?? "Member"}
          />
        ) : null}
        {profile?.role === "admin" ? <AdminToolsCard /> : null}
        <ProfilePhotoCard />
        <CreatorMediaCard />
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
              href="/challenges"
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm font-semibold"
            >
              Explore creator communities
            </Link>
          </div>
        </Card>

        {profile ? (
          <Card>
            <p className="text-sm font-medium">Your active goals</p>
            {goals.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {goals.map((g) => (
                  <Badge key={g.id} tone="muted">
                    {g.title}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                No goals yet — add them on{" "}
                <Link href="/" className="font-medium text-primary">
                  Home
                </Link>{" "}
                or{" "}
                <Link href="/progress#habits-manage-heading" className="font-medium text-primary">
                  Progress
                </Link>
                .
              </p>
            )}
          </Card>
        ) : null}

        {user ? <TimezoneSettingsCard timezone={timezone} auState={auState} /> : null}
        <NotificationPreferencesCard />
        <SupabaseStatus />
        <InstallPrompt />

        <Card>
          <h2 className="font-semibold">Privacy</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Shield className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              Creators never see private weigh-ins or private accountability
              group chats
            </li>
            <li>
              <Link href="/community-guidelines" className="font-medium text-primary">
                Community guidelines
              </Link>
            </li>
            <li>
              <Link href="/onboarding" className="font-medium text-primary">
                Replay onboarding
              </Link>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
