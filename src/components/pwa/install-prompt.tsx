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
    return {
      isIos: false,
      isIosChrome: false,
      isStandalone: false,
    };
  }
  const ua = window.navigator.userAgent.toLowerCase();
  const isIos = /iphone|ipad|ipod/.test(ua);
  return {
    isIos,
    /** iPhone Chrome/Firefox/etc. — Share sheet often omits Add to Home Screen. */
    isIosChrome:
      isIos &&
      (/crios/.test(ua) ||
        /fxios/.test(ua) ||
        /edgios/.test(ua) ||
        /gsa/.test(ua)),
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
  const [isIosChrome, setIsIosChrome] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    function syncEnv() {
      const env = detectClientEnv();
      setIsIos(env.isIos);
      setIsIosChrome(env.isIosChrome);
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
      ) : isIos && isIosChrome ? (
        <ol className="mt-4 space-y-2 text-sm text-muted-foreground">
          <li>
            On iPhone, <strong className="text-foreground">Chrome and Google</strong>{" "}
            often hide &quot;Add to Home Screen&quot; in Share. Use one of these:
          </li>
          <li>
            In Chrome: tap <strong className="text-foreground">⋯</strong> (menu) →{" "}
            <strong className="text-foreground">Add to Home Screen</strong> if you
            see it.
          </li>
          <li>
            Or copy the address, open <strong className="text-foreground">Safari</strong>
            , paste the link, tap{" "}
            <Share className="inline h-3.5 w-3.5 text-primary" aria-hidden /> Share,
            scroll down → <strong className="text-foreground">Add to Home Screen</strong>.
          </li>
        </ol>
      ) : isIos ? (
        <ol className="mt-4 space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <Share className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
            In <strong className="text-foreground">Safari</strong>, tap Share
          </li>
          <li>
            Scroll the row of actions and tap{" "}
            <strong className="text-foreground">Add to Home Screen</strong>
          </li>
          <li>Open Tavro from your home screen icon</li>
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
