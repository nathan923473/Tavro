import { StandalonePageHeader } from "@/components/layout/standalone-page-header";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { requireAuth } from "@/lib/auth/profile";
import { Suspense } from "react";

export const metadata = {
  title: "Get started",
};

export default async function OnboardingPage() {
  await requireAuth("/login?next=/onboarding");
  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-background px-4 pt-[env(safe-area-inset-top)]">
      <StandalonePageHeader pathname="/onboarding" title="Get started" />
      <Suspense
        fallback={
          <div className="p-6 text-sm text-muted-foreground">Loading…</div>
        }
      >
        <OnboardingFlow />
      </Suspense>
    </div>
  );
}
