import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { Suspense } from "react";

export const metadata = {
  title: "Get started",
};

export default function OnboardingPage() {
  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-background">
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
