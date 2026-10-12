export type InstallPlatform =
  | "android-chrome"
  | "iphone-safari"
  | "iphone-chrome"
  | "other";

export const HOME_INSTALL_DISMISS_KEY = "tavro_home_install_dismissed";

/** Which install instructions to show for this browser. */
export function detectInstallPlatform(userAgent: string): InstallPlatform {
  const ua = userAgent.toLowerCase();
  const iphone = /iphone|ipod/.test(ua);

  if (iphone && /crios\//.test(ua)) return "iphone-chrome";

  // Safari on iPhone includes Version/… Safari/. Chrome and other iOS browsers do not.
  if (iphone && /version\/[\d.]+/.test(ua) && /safari\//.test(ua)) {
    return "iphone-safari";
  }

  const androidChrome =
    /android/.test(ua) &&
    /chrome\/[\d.]+/.test(ua) &&
    !/edg\/|edga\/|opr\/|samsungbrowser|ucbrowser|; wv\)/.test(ua);

  if (androidChrome) return "android-chrome";
  return "other";
}

export function isRunningStandalone(env: {
  displayModeStandalone: boolean;
  navigatorStandalone?: boolean;
}): boolean {
  return env.displayModeStandalone || env.navigatorStandalone === true;
}

export function installHelpCopy(platform: InstallPlatform): {
  summary: string;
  steps: string[];
  showCopyLink: boolean;
} {
  switch (platform) {
    case "android-chrome":
      return {
        summary:
          "Install Tavro from Chrome so it opens full screen from your home screen.",
        steps: [
          "Tap the Chrome menu (three dots).",
          "Choose Install app or Add to Home screen.",
          "Confirm, then open Tavro from your home screen.",
        ],
        showCopyLink: false,
      };
    case "iphone-safari":
      return {
        summary:
          "Add Tavro from Safari so it opens like an app from your home screen.",
        steps: [
          "Tap the Share button in Safari.",
          "Scroll and tap Add to Home Screen.",
          "Tap Add, then open Tavro from your home screen.",
        ],
        showCopyLink: false,
      };
    case "iphone-chrome":
      return {
        summary:
          "iPhone Chrome can’t add Tavro to your home screen. Copy the link and add it from Safari.",
        steps: [
          "Copy the link.",
          "Open Safari, paste the link, and go to the page.",
          "Tap Share, then Add to Home Screen.",
        ],
        showCopyLink: true,
      };
    default:
      return {
        summary:
          "Add Tavro from Chrome on Android, or from Safari on iPhone.",
        steps: [
          "On Android, open this page in Chrome and choose Install app or Add to Home screen.",
          "On iPhone, open this page in Safari, tap Share, then Add to Home Screen.",
          "If you are in iPhone Chrome, copy the link and open it in Safari first.",
        ],
        showCopyLink: false,
      };
  }
}
