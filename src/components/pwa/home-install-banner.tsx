"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InstallInstructions } from "@/components/pwa/install-instructions";
import { useInstallPrompt } from "@/components/pwa/use-install-prompt";
import { ChevronDown, Download, Smartphone, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

/** First-visit style tip on Home for mobile browsers (until dismissed). */
export function HomeInstallBanner() {
  const {
    visible,
    platform,
    platformLabel,
    deferredPrompt,
    dismiss,
    triggerNativeInstall,
  } = useInstallPrompt();
  const [expanded, setExpanded] = useState(false);

  if (!visible) return null;

  return (
    <Card className="border-primary/25 bg-gradient-to-br from-secondary/80 to-surface shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Smartphone className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Add app to home screen</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{platformLabel}</p>
          {!expanded ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {platform === "ios-chrome"
                ? "Chrome on iPhone needs an extra step — we’ll show you how."
                : "Tap below for quick steps on this phone."}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          className="shrink-0 rounded-lg p-1 text-muted-foreground hover:bg-muted"
          aria-label="Dismiss install tip"
          onClick={dismiss}
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>

      {expanded ? (
        deferredPrompt ? (
          <Button
            className="mt-3"
            fullWidth
            onClick={() => void triggerNativeInstall()}
          >
            <Download className="h-4 w-4" aria-hidden />
            Install on this device
          </Button>
        ) : (
          <InstallInstructions platform={platform} />
        )
      ) : null}

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        {!expanded ? (
          <Button
            type="button"
            variant="secondary"
            fullWidth
            className="justify-center gap-1"
            onClick={() => setExpanded(true)}
          >
            Show how
            <ChevronDown className="h-4 w-4" aria-hidden />
          </Button>
        ) : null}
        <Link
          href="/profile#add-to-home-screen"
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-2xl border border-border bg-surface px-4 text-sm font-semibold"
        >
          Full guide on Profile
        </Link>
      </div>
    </Card>
  );
}
