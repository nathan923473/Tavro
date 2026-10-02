import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { accountabilityGroup } from "@/lib/mock-data";
import Link from "next/link";

type GroupInvitePageProps = {
  params: Promise<{ code: string }>;
};

export default async function GroupInvitePage({ params }: GroupInvitePageProps) {
  const { code } = await params;
  const isDemoCode = code === accountabilityGroup.inviteCode;

  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-background px-4 py-8">
      <div className="animate-fade-up space-y-4">
        <Card>
          <Badge tone="success" className="mb-2">
            Friend invite
          </Badge>
          <h1 className="text-xl font-semibold">
            {isDemoCode ? accountabilityGroup.name : "Accountability group"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Small private group (4–8 people). Share encouragement — never required
            to post weight or measurements.
          </p>
          {isDemoCode ? (
            <p className="mt-3 text-sm">
              <span className="font-medium">{accountabilityGroup.memberCount}</span>{" "}
              of {accountabilityGroup.maxMembers} spots filled
            </p>
          ) : null}
        </Card>
        <Link
          href="/onboarding?group=1"
          className="flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
        >
          Join group — free
        </Link>
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/" className="font-medium text-primary">
            Skip for now
          </Link>{" "}
          and use SteadyCircle solo
        </p>
      </div>
    </div>
  );
}
