import { AuthSetupNotice } from "@/components/auth/auth-setup-notice";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { StandalonePageHeader } from "@/components/layout/standalone-page-header";

export const metadata = { title: "Forgot password" };

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const query = await searchParams;
  return (
    <div className="mx-auto min-h-dvh max-w-lg px-4 py-8 pt-[env(safe-area-inset-top)]">
      <StandalonePageHeader pathname="/forgot-password" title="Forgot password" />
      <AuthSetupNotice />
      <ForgotPasswordForm linkError={query.error} />
    </div>
  );
}
