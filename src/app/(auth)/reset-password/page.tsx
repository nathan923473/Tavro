import { AuthSetupNotice } from "@/components/auth/auth-setup-notice";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { StandalonePageHeader } from "@/components/layout/standalone-page-header";

export const metadata = { title: "Reset password" };

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto min-h-dvh max-w-lg px-4 py-8 pt-[env(safe-area-inset-top)]">
      <StandalonePageHeader pathname="/reset-password" title="Reset password" />
      <AuthSetupNotice />
      <ResetPasswordForm />
    </div>
  );
}
