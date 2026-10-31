import { CheckEmailPanel } from "@/components/auth/check-email-panel";
import { StandalonePageHeader } from "@/components/layout/standalone-page-header";
import { safeInternalPath } from "@/lib/site-url";

export const metadata = { title: "Check your email" };

export default async function CheckEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; next?: string }>;
}) {
  const query = await searchParams;
  const email = (query.email ?? "").trim().toLowerCase().slice(0, 320);
  const nextPath = safeInternalPath(query.next);

  return (
    <div className="mx-auto min-h-dvh max-w-lg px-4 py-8 pt-[env(safe-area-inset-top)]">
      <StandalonePageHeader pathname="/signup/check-email" title="Check your email" />
      <CheckEmailPanel email={email} nextPath={nextPath} />
    </div>
  );
}
