import {
  grantTestCreatorAccess,
  revokeTestCreatorAccess,
} from "@/app/(app)/admin/creator-applications/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { TestCreatorAccount } from "@/lib/creator/test-access";

const NOTICE_COPY: Record<string, string> = {
  granted:
    "Creator Studio is unlocked for that test account. Sign in as them and open Creator Studio.",
  revoked:
    "Creator access removed. Their challenges, community, and accountability groups were kept.",
};

const ERROR_COPY: Record<string, string> = {
  invalid: "Enter the email address of an existing Tavro account.",
  not_found: "No Tavro account uses that email.",
  mismatch: "Look the account up again before changing creator access.",
  already_creator:
    "That account is already an approved creator. It was left unchanged.",
  not_test:
    "Only test accounts can be revoked here. Public creators stay on application review.",
  not_creator: "That test account does not have creator access.",
  unauthorized: "Only Tavro admins can change creator access.",
  migration:
    "Run supabase/migrations/042_admin_test_creator_access.sql in the Supabase SQL editor, then try again.",
  failed: "Could not update creator access. Try again.",
};

function statusLabel(status: TestCreatorAccount["creatorStatus"]) {
  switch (status) {
    case "approved":
      return "Approved creator";
    case "pending":
      return "Application pending";
    case "rejected":
      return "Application rejected";
    default:
      return "Member";
  }
}

function AccountCard({
  account,
  query,
}: {
  account: TestCreatorAccount;
  query?: string;
}) {
  const hasStudio = account.creatorStatus === "approved";
  const realCreator = hasStudio && !account.isTestAccount;
  const email = account.email ?? query ?? "";

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold">{account.displayName ?? "Unnamed account"}</p>
          <p className="text-xs text-muted-foreground">{account.email ?? "No email"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={hasStudio ? "success" : account.creatorStatus === "pending" ? "warning" : "muted"}>
            {statusLabel(account.creatorStatus)}
          </Badge>
          {account.isTestAccount ? <Badge tone="muted">Test account</Badge> : null}
        </div>
      </div>

      {account.isAdmin ? (
        <p className="mt-2 text-xs text-muted-foreground">
          This account is also an admin. Founder analytics already excludes admins.
        </p>
      ) : null}
      {account.hasOpenApplication ? (
        <p className="mt-2 text-xs text-muted-foreground">
          This account has a public application still waiting in the list below.
          Granting test access does not approve that application. Rejecting it
          later removes creator access.
        </p>
      ) : null}
      {realCreator ? (
        <p className="mt-2 text-sm text-muted-foreground">
          This creator was approved through the normal review. Test access will
          not change the account.
        </p>
      ) : null}

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        {!realCreator && !hasStudio && email ? (
          <form action={grantTestCreatorAccess}>
            <input type="hidden" name="user_id" value={account.userId} />
            <input type="hidden" name="email" value={email} />
            <Button type="submit">Grant creator access</Button>
          </form>
        ) : null}
        {account.isTestAccount && hasStudio ? (
          <form action={revokeTestCreatorAccess}>
            <input type="hidden" name="user_id" value={account.userId} />
            {email ? <input type="hidden" name="email" value={email} /> : null}
            <Button type="submit" variant="secondary">
              Revoke creator access
            </Button>
          </form>
        ) : null}
      </div>
    </Card>
  );
}

export function TestCreatorAccessPanel({
  migrationRequired,
  loadError,
  accounts,
  query,
  match,
  lookupMissing,
  notice,
  error,
}: {
  migrationRequired: boolean;
  loadError: string | null;
  accounts: TestCreatorAccount[];
  query: string;
  match: TestCreatorAccount | null;
  lookupMissing: boolean;
  notice: string | null;
  error: string | null;
}) {
  const noticeCopy = notice ? NOTICE_COPY[notice] : null;
  const errorCopy = error ? (ERROR_COPY[error] ?? ERROR_COPY.failed) : null;
  const listedIds = new Set(accounts.map((account) => account.userId));
  const showMatchSeparately = match !== null && !listedIds.has(match.userId);
  const orderedAccounts = match
    ? [
        ...accounts.filter((account) => account.userId === match.userId),
        ...accounts.filter((account) => account.userId !== match.userId),
      ]
    : accounts;

  return (
    <section id="test-creator-access" className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold">Test creator access</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Grant or revoke Creator Studio for one account you are using to test.
          That account is marked as a test account, so it stays out of founder
          metrics. Instagram verification and the public application are not
          required. Public applications below stay on manual approval.
        </p>
      </div>

      {noticeCopy ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950" role="status">
          {noticeCopy}
        </p>
      ) : null}
      {errorCopy ? (
        <p className="text-sm text-destructive" role="alert">
          {errorCopy}
        </p>
      ) : null}
      {loadError ? (
        <p className="text-sm text-destructive" role="alert">
          {loadError}
        </p>
      ) : null}

      <Card>
        {migrationRequired ? (
          <p className="text-sm text-muted-foreground">
            Run{" "}
            <code className="text-xs">
              supabase/migrations/042_admin_test_creator_access.sql
            </code>{" "}
            in the Supabase SQL editor before granting test access.
          </p>
        ) : (
          <form action="/admin/creator-applications" method="get" className="space-y-3">
            <div>
              <label htmlFor="test-account-email" className="mb-1 block text-sm font-medium">
                Account email
              </label>
              <input
                id="test-account-email"
                name="email"
                type="email"
                required
                defaultValue={query}
                autoComplete="off"
                placeholder="test-creator@example.com"
                className="w-full rounded-xl border border-border px-3 py-2.5 text-sm"
              />
            </div>
            <Button type="submit" variant="outline">
              Find account
            </Button>
          </form>
        )}
      </Card>

      {lookupMissing ? (
        <Card>
          <p className="text-sm text-muted-foreground">
            No Tavro account uses {query}.
          </p>
        </Card>
      ) : null}

      {showMatchSeparately && match ? <AccountCard account={match} query={query} /> : null}

      {!migrationRequired ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Test accounts</h3>
          {orderedAccounts.length ? (
            orderedAccounts.map((account) => (
              <AccountCard key={account.userId} account={account} query={query} />
            ))
          ) : (
            <Card>
              <p className="text-sm text-muted-foreground">
                No test accounts yet. Look up an account to grant creator access.
              </p>
            </Card>
          )}
        </div>
      ) : null}
    </section>
  );
}
