"use client";

import { InstallSteps } from "@/components/pwa/install-steps";
import { useHomeInstall } from "@/components/pwa/use-home-install";
import { Card } from "@/components/ui/card";
import { installHelpCopy } from "@/lib/pwa/install-platform";

export function AddToHomeScreenCard() {
  const { ready, platform, standalone, canPrompt, promptInstall } = useHomeInstall();

  if (!ready || standalone) return null;

  const help = installHelpCopy(platform);

  return (
    <Card className="border-primary/20 bg-secondary/40">
      <h2 className="font-semibold">Add app to home screen</h2>
      <p className="mt-1 text-sm text-muted-foreground">{help.summary}</p>
      <InstallSteps
        platform={platform}
        canPrompt={canPrompt}
        onInstall={() => {
          void promptInstall();
        }}
      />
    </Card>
  );
}
