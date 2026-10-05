import { AuthSetupNotice } from "@/components/auth/auth-setup-notice";
import { AuthForm } from "@/components/auth/auth-form";
import { StandalonePageHeader } from "@/components/layout/standalone-page-header";

export const metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <div className="mx-auto min-h-dvh max-w-lg px-4 py-8 pt-[env(safe-area-inset-top)]">
      <StandalonePageHeader pathname="/login" title="Log in" />
      <AuthSetupNotice />
      <p className="mb-3 text-center text-xs text-muted-foreground">
        Always use the <strong className="text-foreground">same</strong> URL in the browser
        (pick either <code className="text-[11px]">127.0.0.1</code> or{" "}
        <code className="text-[11px]">localhost</code>, same port as the terminal).
      </p>
      <AuthForm mode="login" />
    </div>
  );
}
