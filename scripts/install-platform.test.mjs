#!/usr/bin/env node
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  detectInstallPlatform,
  installHelpCopy,
  isRunningStandalone,
} from "../src/lib/pwa/install-platform.ts";

const IPHONE_SAFARI =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const IPHONE_CHROME =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.6478.54 Mobile/15E148 Safari/604.1";
const ANDROID_CHROME =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.6478.122 Mobile Safari/537.36";
const DESKTOP_CHROME =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

test("detects Android Chrome, iPhone Safari, and iPhone Chrome", () => {
  assert.equal(detectInstallPlatform(ANDROID_CHROME), "android-chrome");
  assert.equal(detectInstallPlatform(IPHONE_SAFARI), "iphone-safari");
  assert.equal(detectInstallPlatform(IPHONE_CHROME), "iphone-chrome");
  assert.equal(detectInstallPlatform(DESKTOP_CHROME), "other");
});

test("copy link is only for iPhone Chrome", () => {
  assert.equal(installHelpCopy("iphone-chrome").showCopyLink, true);
  assert.equal(installHelpCopy("iphone-safari").showCopyLink, false);
  assert.equal(installHelpCopy("android-chrome").showCopyLink, false);
  assert.match(installHelpCopy("iphone-chrome").steps[0], /Copy the link/);
  assert.match(installHelpCopy("iphone-safari").steps[1], /Add to Home Screen/);
  assert.match(installHelpCopy("android-chrome").steps[1], /Install app/);
});

test("standalone display hides the install tip", () => {
  assert.equal(
    isRunningStandalone({ displayModeStandalone: true, navigatorStandalone: false }),
    true,
  );
  assert.equal(
    isRunningStandalone({ displayModeStandalone: false, navigatorStandalone: true }),
    true,
  );
  assert.equal(
    isRunningStandalone({ displayModeStandalone: false, navigatorStandalone: false }),
    false,
  );
});
