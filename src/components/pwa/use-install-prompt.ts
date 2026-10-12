"use client";

import {
  detectInstallEnv,
  shouldShowInstallHelp,
  type InstallEnv,
} from "@/lib/pwa/install-env";
import {
  dismissInstallPrompt,
  isInstallPromptDismissed,
} from "@/lib/pwa/install-prompt-storage";
import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function useInstallPrompt() {
  const [env, setEnv] = useState<InstallEnv | null>(null);
  const [dismissed, setDismissed] = useState(true);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    setEnv(detectInstallEnv());
    setDismissed(isInstallPromptDismissed());

    function syncEnv() {
      setEnv(detectInstallEnv());
    }
    const mq = window.matchMedia("(display-mode: standalone)");
    mq.addEventListener("change", syncEnv);

    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      mq.removeEventListener("change", syncEnv);
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const platform = env?.platform ?? "desktop";
  const visible =
    env !== null &&
    !dismissed &&
    shouldShowInstallHelp(platform);

  function dismiss() {
    dismissInstallPrompt();
    setDismissed(true);
  }

  async function triggerNativeInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    dismiss();
  }

  return {
    env,
    platform,
    platformLabel: env?.platformLabel ?? "",
    visible,
    deferredPrompt,
    dismiss,
    triggerNativeInstall,
  };
}
