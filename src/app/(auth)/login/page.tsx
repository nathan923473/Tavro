import { AuthSetupNotice } from "@/components/auth/auth-setup-notice";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <div className="mx-auto min-h-dvh max-w-lg px-4 py-8">
      <AuthSetupNotice />
      <AuthForm mode="login" />
    </div>
  );
}
