"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InstallInstructions } from "@/components/pwa/install-instructions";
import { useInstallPrompt } from "@/components/pwa/use-install-prompt";
import { Download, Smartphone } from "lucide-react";
type InstallPromptProps = {
  id?: string;
};

/** Full install help on Profile. */
export function InstallPrompt({ id = "add-to-home-screen" }: InstallPromptProps) {
  const {
    visible,
    platform,
    platformLabel,
    deferredPrompt,
    dismiss,
    triggerNativeInstall,
  } = useInstallPrompt();

  if (!visible) return null;

  return (
    <div id={id} className="scroll-mt-24">
    <Card className="border-primary/20 bg-secondary/40">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Smartphone className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold">Add to home screen</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Detected: {platformLabel}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Open Tavro like an app — full screen, one tap from your home screen.
          </p>
        </div>
      </div>

      {deferredPrompt ? (
        <Button className="mt-4" fullWidth onClick={() => void triggerNativeInstall()}>
          <Download className="h-4 w-4" aria-hidden />
          Install on this device
        </Button>
      ) : (
        <InstallInstructions platform={platform} />
      )}

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          className="flex-1 text-center text-xs text-muted-foreground underline-offset-2 hover:underline"
          onClick={dismiss}
        >
          Not now — hide this tip
        </button>
      </div>
    </Card>
    </div>
  );
}
