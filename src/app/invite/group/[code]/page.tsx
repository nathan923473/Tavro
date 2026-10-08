import { GroupInviteJoin } from "@/components/groups/group-invite-join";
import { StandalonePageHeader } from "@/components/layout/standalone-page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  ACCOUNTABILITY_GROUP_SINGULAR,
  ACCOUNTABILITY_GROUP_TAGLINE,
} from "@/lib/copy/accountability-groups";
import { fetchGroupByInviteCode } from "@/lib/data/groups";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import Link from "next/link";

type GroupInvitePageProps = {
  params: Promise<{ code: string }>;
};

export default async function GroupInvitePage({ params }: GroupInvitePageProps) {
  const { code } = await params;
  const normalized = code.trim().toUpperCase();
  const group = await fetchGroupByInviteCode(normalized);
  const { user } = await getCurrentUserProfile();

  const invalid = !group;
  const joinMode = group?.join_mode ?? "approval";

  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-background px-4 py-8 pt-[env(safe-area-inset-top)]">
      <div className="animate-fade-up space-y-4">
        <StandalonePageHeader
          pathname={`/invite/group/${code}`}
          title="Private accountability group invite"
        />
        <Card>
          <Badge tone="success" className="mb-2">
            Friend invite
          </Badge>
          <h1 className="text-xl font-semibold">
            {invalid ? "Invite unavailable" : group.name}
          </h1>
          {!invalid && group.goal ? (
            <p className="mt-2 text-sm font-medium text-foreground/90">{group.goal}</p>
          ) : null}
          <p className="mt-2 text-sm text-muted-foreground">
            {invalid
              ? "This invite is invalid, disabled, or the group is no longer accepting members."
              : ACCOUNTABILITY_GROUP_TAGLINE}
          </p>
          {!invalid ? (
            <p className="mt-2 text-xs text-muted-foreground">
              {joinMode === "auto"
                ? "Anyone with this invite can join when there is space."
                : "The group owner approves new members before they can see chat."}
            </p>
          ) : null}
        </Card>

        {invalid ? (
          <Link
            href="/groups"
            className="flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
          >
            Go to P.A. groups
          </Link>
        ) : user ? (
          <GroupInviteJoin code={normalized} joinMode={joinMode} />
        ) : (
          <>
            <Link
              href={`/signup?next=${encodeURIComponent(`/invite/group/${encodeURIComponent(normalized)}`)}`}
              className="flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
            >
              Sign up to join — free
            </Link>
            <Link
              href={`/login?next=${encodeURIComponent(`/invite/group/${encodeURIComponent(normalized)}`)}`}
              className="flex min-h-11 w-full items-center justify-center rounded-xl border border-border px-4 text-sm font-semibold"
            >
              Log in first
            </Link>
            <Link
              href={`/onboarding?group=1&code=${encodeURIComponent(normalized)}`}
              className="block text-center text-xs text-muted-foreground"
            >
              New member onboarding with code →
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
