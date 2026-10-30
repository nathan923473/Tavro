import { ProfileHeroCard } from "@/components/profile/profile-hero-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { RouteFallback } from "@/components/layout/route-fallback";
import { AccountExperience } from "@/components/profile/account-experience";
import { CreatorStudioProfileCard } from "@/components/profile/creator-studio-profile-card";
import { AdminToolsCard } from "@/components/profile/admin-tools-card";
import { DisplayNameCard } from "@/components/profile/display-name-card";
import { CreatorMediaCard } from "@/components/profile/creator-media-card";
import { NotificationPreferencesCard } from "@/components/profile/notification-preferences-card";
import { TimezoneSettingsCard } from "@/components/profile/timezone-settings-card";
import { ProfilePhotoCard } from "@/components/profile/profile-photo-card";
import { CopyLinkButton } from "@/components/share/copy-link-button";
import { AdminSupabaseDiagnostics } from "@/components/admin/admin-supabase-diagnostics";
import { DeleteAccountSection } from "@/components/profile/delete-account-section";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import { fetchMemberGoals } from "@/lib/data/member";
import { fetchMemberGoalPreferences } from "@/lib/data/member-preferences";
import { MemberGoalPreferencesCard } from "@/components/profile/member-goal-preferences-card";
import { userReferralPath } from "@/lib/site-url";
import Link from "next/link";
import { BarChart3, Shield, Users } from "lucide-react";
import { TabReady } from "@/components/navigation/tab-ready";
import { Suspense } from "react";

export const metadata = { title: "Profile" };

type ProfilePageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const { error: profileError } = await searchParams;

  return (
    <div className="animate-fade-up">
      {profileError === "admin_only" ? (
        <p className="mx-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          That page is admin-only. If you should have access, set{" "}
          <code className="text-xs">is_admin = true</code> on your profile in Supabase.
        </p>
      ) : null}
      <Suspense
        fallback={
          <RouteFallback title="Profile" subtitle="Member or creator · one account" />
        }
      >
        <ProfilePageContent />
      </Suspense>
    </div>
  );
}

async function ProfilePageContent() {
  const { user, profile } = await getCurrentUserProfile();
  const referralCode = profile?.referralCode ?? "sign-in-for-code";
  const [goals, memberPrefs] = await Promise.all([
    user ? fetchMemberGoals(user.id) : Promise.resolve([]),
    user
      ? fetchMemberGoalPreferences(user.id)
      : Promise.resolve({ workTowards: null, growthFriction: null }),
  ]);

  const timezone = profile?.timezone ?? null;
  const auState = profile?.auStateOrTerritory ?? null;

  return (
    <TabReady tab="/profile">
    <>
      <PageHeader title="Profile" subtitle="Member or creator · one account" />
      {profile?.isAdmin ? (
        <div className="px-4">
          <Link
            href="/admin/analytics"
            className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-sm"
          >
            <BarChart3 className="h-4 w-4 shrink-0" aria-hidden />
            Founder analytics
          </Link>
        </div>
      ) : null}
      <div className="page-stack-compact px-4 py-4">
        {profile ? (
          <ProfileHeroCard
            displayName={profile.displayName ?? user?.email?.split("@")[0] ?? "Member"}
            email={user?.email}
            avatarUrl={profile.avatarUrl}
            workTowards={memberPrefs.workTowards}
            roleLabel={
              profile.role === "creator"
                ? "Creator"
                : profile.role === "admin"
                  ? "Admin"
                  : null
            }
          />
        ) : null}
        {profile?.role === "creator" || profile?.role === "admin" ? (
          <CreatorStudioProfileCard />
        ) : null}
        {profile ? (
          <DisplayNameCard
            initialName={profile.displayName ?? user?.email?.split("@")[0] ?? "Member"}
          />
        ) : null}
        {profile?.role === "admin" ? (
          <div className="space-y-2">
            <AdminToolsCard />
            <AdminSupabaseDiagnostics />
          </div>
        ) : null}
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
          <MemberGoalPreferencesCard
            workTowards={memberPrefs.workTowards}
            growthFriction={memberPrefs.growthFriction}
          />
        ) : null}

        {profile ? (
          <Card>
            <p className="text-sm font-medium">Your active habits</p>
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
              <Link href="/privacy" className="font-medium text-primary">
                Privacy &amp; account deletion
              </Link>
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

        {user ? <DeleteAccountSection /> : null}
      </div>
    </>
    </TabReady>
  );
}
