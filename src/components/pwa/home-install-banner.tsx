"use client";

import { InstallSteps } from "@/components/pwa/install-steps";
import { useHomeInstall } from "@/components/pwa/use-home-install";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { installHelpCopy } from "@/lib/pwa/install-platform";
import { Download } from "lucide-react";
import { useState } from "react";

export function HomeInstallBanner() {
  const { ready, platform, standalone, dismissed, canPrompt, dismiss, promptInstall } =
    useHomeInstall();
  const [showHow, setShowHow] = useState(false);

  if (!ready || standalone || dismissed) return null;

  const help = installHelpCopy(platform);

  return (
    <Card className="border-primary/20 bg-secondary/40">
      <h2 id="home-install-heading" className="font-semibold">
        Add app to home screen
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">{help.summary}</p>
      {showHow ? (
        <InstallSteps
          platform={platform}
          canPrompt={canPrompt}
          onInstall={() => {
            void promptInstall();
          }}
        />
      ) : canPrompt ? (
        <Button
          className="mt-4"
          fullWidth
          onClick={() => {
            void promptInstall();
          }}
        >
          <Download className="h-4 w-4" aria-hidden />
          Install on this device
        </Button>
      ) : null}
      {showHow ? null : (
        <Button
          className="mt-3"
          variant="secondary"
          fullWidth
          aria-expanded={showHow}
          onClick={() => setShowHow(true)}
        >
          Show how
        </Button>
      )}
      <button
        type="button"
        className="mt-3 w-full text-center text-xs text-muted-foreground underline-offset-2 hover:underline"
        onClick={dismiss}
      >
        Not now
      </button>
    </Card>
  );
}
