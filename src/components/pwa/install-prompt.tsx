"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, Share } from "lucide-react";
import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function detectClientEnv() {
  if (typeof window === "undefined") {
    return { isIos: false, isStandalone: false };
  }
  const ua = window.navigator.userAgent.toLowerCase();
  return {
    isIos: /iphone|ipad|ipod/.test(ua),
    isStandalone:
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in window.navigator &&
        (window.navigator as Navigator & { standalone?: boolean }).standalone ===
          true),
  };
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    function syncEnv() {
      const env = detectClientEnv();
      setIsIos(env.isIos);
      setIsStandalone(env.isStandalone);
    }
    syncEnv();
    const mq = window.matchMedia("(display-mode: standalone)");
    mq.addEventListener("change", syncEnv);
    return () => mq.removeEventListener("change", syncEnv);
  }, []);

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (isStandalone || dismissed) {
    return null;
  }

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setDismissed(true);
  }

  return (
    <Card className="border-primary/20 bg-secondary/40">
      <h2 className="font-semibold">Install the app</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Add Tavro to your home screen for a full-screen, app-like
        experience.
      </p>

      {deferredPrompt ? (
        <Button className="mt-4" fullWidth onClick={handleInstall}>
          <Download className="h-4 w-4" aria-hidden />
          Install on this device
        </Button>
      ) : isIos ? (
        <ol className="mt-4 space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <Share className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
            Tap Share in Safari
          </li>
          <li>Scroll and choose &quot;Add to Home Screen&quot;</li>
          <li>Open Tavro from your home screen</li>
        </ol>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          On Android Chrome, open the browser menu and choose &quot;Install
          app&quot; or &quot;Add to Home screen&quot; when prompted.
        </p>
      )}

      <button
        type="button"
        className="mt-3 w-full text-center text-xs text-muted-foreground underline-offset-2 hover:underline"
        onClick={() => setDismissed(true)}
      >
        Not now
      </button>
    </Card>
  );
}
