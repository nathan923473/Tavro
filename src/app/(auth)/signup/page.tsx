import { AuthSetupNotice } from "@/components/auth/auth-setup-notice";
import { AuthForm } from "@/components/auth/auth-form";
import { ReferralCapture } from "@/components/analytics/referral-capture";
import { StandalonePageHeader } from "@/components/layout/standalone-page-header";
import { Suspense } from "react";

export const metadata = { title: "Sign up" };

export default function SignupPage() {
  return (
    <div className="mx-auto min-h-dvh max-w-lg px-4 py-8 pt-[env(safe-area-inset-top)]">
      <StandalonePageHeader pathname="/signup" title="Sign up" />
      <AuthSetupNotice />
      <Suspense fallback={null}>
        <ReferralCapture />
      </Suspense>
      <AuthForm mode="signup" />
    </div>
  );
}
