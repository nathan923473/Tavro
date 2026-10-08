import { ACCOUNT_DELETION_SUMMARY } from "@/lib/account-deletion/policy";
import { APP_NAME } from "@/lib/branding";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import Link from "next/link";

export const metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto min-h-dvh max-w-lg animate-fade-up pb-8">
      <PageHeader title="Privacy" subtitle={`How ${APP_NAME} handles your data`} backHref="/" />
      <div className="space-y-4 px-4">
        <Card>
          <h2 className="font-semibold">Delete your account</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Logged in: Profile → Danger zone → Delete account (password or confirmation required).
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            No app access:{" "}
            <Link href="/delete-account" className="font-medium text-primary">
              Request account deletion
            </Link>
            .
          </p>
        </Card>

        <Card>
          <h2 className="font-semibold">Data deleted with your account</h2>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
            {ACCOUNT_DELETION_SUMMARY.deleted.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Card>

        <Card>
          <h2 className="font-semibold">Archived, anonymised, or detached</h2>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
            {ACCOUNT_DELETION_SUMMARY.anonymisedOrDetached.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Card>

        <Card>
          <h2 className="font-semibold">Data we may retain</h2>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
            {ACCOUNT_DELETION_SUMMARY.mayRetain.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            Retention periods depend on operational and legal requirements. Contact support for
            questions about your data.
          </p>
        </Card>
      </div>
    </div>
  );
}
