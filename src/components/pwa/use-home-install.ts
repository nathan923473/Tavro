"use client";

import {
  detectInstallPlatform,
  HOME_INSTALL_DISMISS_KEY,
  isRunningStandalone,
  type InstallPlatform,
} from "@/lib/pwa/install-platform";
import { useCallback, useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type HomeInstallState = {
  ready: boolean;
  platform: InstallPlatform;
  standalone: boolean;
  dismissed: boolean;
  canPrompt: boolean;
};

function readStandalone(): boolean {
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return isRunningStandalone({
    displayModeStandalone: window.matchMedia("(display-mode: standalone)").matches,
    navigatorStandalone: nav.standalone,
  });
}

function readDismissed(): boolean {
  try {
    return window.localStorage.getItem(HOME_INSTALL_DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

export function useHomeInstall() {
  const [state, setState] = useState<HomeInstallState>({
    ready: false,
    platform: "other",
    standalone: false,
    dismissed: false,
    canPrompt: false,
  });
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    function sync() {
      setState((current) => ({
        ...current,
        ready: true,
        platform: detectInstallPlatform(window.navigator.userAgent),
        standalone: readStandalone(),
        dismissed: readDismissed(),
        canPrompt: deferredPrompt !== null && !readStandalone(),
      }));
    }

    sync();
    const mq = window.matchMedia("(display-mode: standalone)");
    mq.addEventListener("change", sync);
    window.addEventListener("appinstalled", sync);
    return () => {
      mq.removeEventListener("change", sync);
      window.removeEventListener("appinstalled", sync);
    };
  }, [deferredPrompt]);

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = useCallback(() => {
    try {
      window.localStorage.setItem(HOME_INSTALL_DISMISS_KEY, "1");
    } catch {
      // Private mode can block storage; still hide the tip for this view.
    }
    setState((current) => ({ ...current, dismissed: true }));
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (choice.outcome === "accepted") {
      setState((current) => ({ ...current, canPrompt: false, standalone: true }));
    }
  }, [deferredPrompt]);

  return {
    ...state,
    dismiss,
    promptInstall,
  };
}
