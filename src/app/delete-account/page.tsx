import { BrandWordmark } from "@/components/brand/brand-wordmark";
import { OffAppDeletionRequestForm } from "@/components/profile/off-app-deletion-request-form";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { APP_NAME } from "@/lib/branding";
import Link from "next/link";

export const metadata = {
  title: "Delete account",
  description: `Request deletion of your ${APP_NAME} account and personal data.`,
};

export default function DeleteAccountRequestPage() {
  return (
    <div className="mx-auto min-h-dvh max-w-lg animate-fade-up">
      <PageHeader
        title="Delete account"
        subtitle={`${APP_NAME} account & data removal`}
        backHref="/"
      />
      <div className="space-y-4 px-4 pb-8">
        <Card>
          <h2 className="font-semibold">In the app</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The fastest way to delete your account is while logged in: open{" "}
            <Link href="/profile" className="font-medium text-primary">
              Profile
            </Link>
            , scroll to <strong>Danger zone</strong>, and follow the confirmation steps.
          </p>
        </Card>

        <Card>
          <h2 className="font-semibold">Without access to the app</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Submit the email tied to your {APP_NAME} account. We will verify ownership and
            complete deletion within a reasonable timeframe (typically within 30 days).
          </p>
          <OffAppDeletionRequestForm />
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          See also{" "}
          <Link href="/privacy" className="font-medium text-primary">
            Privacy policy
          </Link>
        </p>
        <BrandWordmark size="sm" className="justify-center opacity-80" />
      </div>
    </div>
  );
}
