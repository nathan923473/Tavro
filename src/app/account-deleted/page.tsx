import { BrandWordmark } from "@/components/brand/brand-wordmark";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { APP_NAME } from "@/lib/branding";
import Link from "next/link";

export const metadata = { title: "Account deleted" };

export default function AccountDeletedPage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4 py-12">
      <BrandWordmark size="md" className="mb-6 justify-center" />
      <Card className="text-center">
        <h1 className="text-2xl font-bold text-foreground">Your account has been deleted</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Your {APP_NAME} login and personal data have been removed according to our deletion
          policy. Shared challenges you joined remain available to other participants; content
          you created may be archived.
        </p>
        <Link href="/signup" className="mt-6 block">
          <Button fullWidth variant="primary">
            Create a new account
          </Button>
        </Link>
        <Link
          href="/login"
          className="mt-3 inline-block text-sm font-semibold text-primary"
        >
          Back to log in
        </Link>
      </Card>
    </div>
  );
}
