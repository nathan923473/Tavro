import { CreatorInvitationManager } from "@/components/admin/creator-invitation-manager";
import { CreatorOnboardingFunnelSummary } from "@/components/admin/creator-onboarding-funnel";
import { PageHeader } from "@/components/layout/page-header";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  fetchCreatorOnboardingFunnel,
  listCreatorInvitations,
} from "@/lib/creator/invitations";
import Link from "next/link";

export const metadata = { title: "Creator invitations" };

export default async function CreatorInvitationsPage() {
  await requireAdmin("/admin/creator-invitations");
  const [invitations, funnel] = await Promise.all([
    listCreatorInvitations(),
    fetchCreatorOnboardingFunnel(),
  ]);

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Creator invitations"
        subtitle="Personal invites skip the public application"
      />
      <div className="space-y-4 px-4 py-4">
        <p className="text-sm text-muted-foreground">
          Organic applicants stay on{" "}
          <Link href="/admin/creator-applications" className="font-semibold text-primary">
            creator applications
          </Link>
          . Social verification is still required there.
        </p>
        <CreatorOnboardingFunnelSummary stats={funnel} />
        <CreatorInvitationManager invitations={invitations} />
      </div>
    </div>
  );
}
