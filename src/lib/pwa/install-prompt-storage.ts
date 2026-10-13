const DISMISS_KEY = "tavro_pwa_install_dismissed";

export function isInstallPromptDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

export function dismissInstallPrompt(): void {
  try {
    window.localStorage.setItem(DISMISS_KEY, "1");
  } catch {
    /* private mode */
  }
}
