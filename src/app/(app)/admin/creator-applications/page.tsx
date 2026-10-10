import { CreatorApplicationReviewList } from "@/components/admin/creator-application-review-list";
import { TestCreatorAccessPanel } from "@/components/admin/test-creator-access-panel";
import { PageHeader } from "@/components/layout/page-header";
import { requireAdmin } from "@/lib/auth/require-admin";
import { listApplicationsForAdmin } from "@/lib/creator/applications";
import {
  listTestCreatorAccounts,
  lookupTestCreatorAccount,
  normalizeAccountEmail,
} from "@/lib/creator/test-access";

export const metadata = { title: "Creator applications" };

export default async function AdminCreatorApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; notice?: string; error?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const applications = await listApplicationsForAdmin();
  const testAccounts = await listTestCreatorAccounts();
  const rawEmail = (params.email ?? "").trim();
  const email = normalizeAccountEmail(rawEmail);
  const emailInvalid = rawEmail.length > 0 && !email;
  const lookup = email ? await lookupTestCreatorAccount(email) : null;
  const migrationRequired =
    testAccounts.status === "migration" || lookup?.status === "migration";

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Creator applications"
        subtitle="Private admin review · public applications stay manual"
      />
      <div className="space-y-8 px-4 py-4">
        <TestCreatorAccessPanel
          migrationRequired={migrationRequired}
          loadError={
            testAccounts.status === "error"
              ? "Could not load test accounts."
              : lookup?.status === "error"
                ? "Could not look up that account."
                : null
          }
          accounts={testAccounts.status === "ok" ? testAccounts.accounts : []}
          query={email ?? ""}
          match={lookup?.status === "found" ? lookup.account : null}
          lookupMissing={lookup?.status === "missing"}
          notice={params.notice ?? null}
          error={params.error ?? (emailInvalid ? "invalid" : null)}
        />
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">Public applications</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              These still need a manual Approve creator decision. Applying does
              not grant Creator Studio.
            </p>
          </div>
          <CreatorApplicationReviewList applications={applications} />
        </section>
      </div>
    </div>
  );
}
