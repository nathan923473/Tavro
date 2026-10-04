import { StandalonePageHeader } from "@/components/layout/standalone-page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { fetchGroupByInviteCode } from "@/lib/data/groups";
import Link from "next/link";

type GroupInvitePageProps = {
  params: Promise<{ code: string }>;
};

export default async function GroupInvitePage({ params }: GroupInvitePageProps) {
  const { code } = await params;
  const group = await fetchGroupByInviteCode(code);

  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-background px-4 py-8 pt-[env(safe-area-inset-top)]">
      <div className="animate-fade-up space-y-4">
        <StandalonePageHeader
          pathname={`/invite/group/${code}`}
          title="Group invite"
        />
        <Card>
          <Badge tone="success" className="mb-2">
            Friend invite
          </Badge>
          <h1 className="text-xl font-semibold">
            {group?.name ?? "Accountability group"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Small private group (4–8 people). Share encouragement — never required
            to post weight or measurements.
          </p>
        </Card>
        <Link
          href={`/onboarding?group=1&code=${encodeURIComponent(code)}`}
          className="flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
        >
          Join group — free
        </Link>
        <Link
          href="/login"
          className="flex min-h-11 w-full items-center justify-center rounded-xl border border-border px-4 text-sm font-semibold"
        >
          Log in first
        </Link>
      </div>
    </div>
  );
}
