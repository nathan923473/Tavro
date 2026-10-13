export type InstallPlatform =
  | "standalone"
  | "android"
  | "ios-safari"
  | "ios-chrome"
  | "ios-other"
  | "desktop";

export type InstallEnv = {
  platform: InstallPlatform;
  /** Short label for UI, e.g. "Chrome on iPhone". */
  platformLabel: string;
};

function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator &&
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true)
  );
}

export function detectInstallEnv(): InstallEnv {
  if (typeof window === "undefined") {
    return { platform: "desktop", platformLabel: "This device" };
  }

  if (isStandaloneDisplay()) {
    return { platform: "standalone", platformLabel: "Home screen app" };
  }

  const ua = window.navigator.userAgent.toLowerCase();
  const isIos = /iphone|ipad|ipod/.test(ua);
  const isAndroid = /android/.test(ua);

  if (isAndroid) {
    return { platform: "android", platformLabel: "Chrome on Android" };
  }

  if (isIos) {
    if (/crios/.test(ua)) {
      return { platform: "ios-chrome", platformLabel: "Chrome on iPhone" };
    }
    if (/gsa/.test(ua)) {
      return { platform: "ios-chrome", platformLabel: "Google app on iPhone" };
    }
    if (/fxios|edgios|opios/.test(ua)) {
      return { platform: "ios-chrome", platformLabel: "Browser on iPhone" };
    }
    if (/safari/.test(ua)) {
      return { platform: "ios-safari", platformLabel: "Safari on iPhone" };
    }
    return { platform: "ios-other", platformLabel: "Safari on iPhone" };
  }

  return { platform: "desktop", platformLabel: "Computer" };
}

/** Show install help on phones/tablets, not when already installed or on desktop. */
export function shouldShowInstallHelp(platform: InstallPlatform): boolean {
  return (
    platform === "android" ||
    platform === "ios-safari" ||
    platform === "ios-chrome" ||
    platform === "ios-other"
  );
}
