import { AuthSetupNotice } from "@/components/auth/auth-setup-notice";
import { AuthForm } from "@/components/auth/auth-form";
import { StandalonePageHeader } from "@/components/layout/standalone-page-header";

export const metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <div className="mx-auto min-h-dvh max-w-lg px-4 py-8 pt-[env(safe-area-inset-top)]">
      <StandalonePageHeader pathname="/login" title="Log in" />
      <AuthSetupNotice />
      <AuthForm mode="login" />
    </div>
  );
}
