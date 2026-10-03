import { AuthSetupNotice } from "@/components/auth/auth-setup-notice";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata = { title: "Sign up" };

export default function SignupPage() {
  return (
    <div className="mx-auto min-h-dvh max-w-lg px-4 py-8">
      <AuthSetupNotice />
      <AuthForm mode="signup" />
    </div>
  );
}
