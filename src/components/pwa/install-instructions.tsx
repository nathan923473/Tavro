"use client";

import type { InstallPlatform } from "@/lib/pwa/install-env";
import { CopyLinkButton } from "@/components/share/copy-link-button";
import { Share } from "lucide-react";

type InstallInstructionsProps = {
  platform: InstallPlatform;
  compact?: boolean;
  pageUrl?: string;
};

export function InstallInstructions({
  platform,
  compact = false,
  pageUrl,
}: InstallInstructionsProps) {
  const url =
    pageUrl ??
    (typeof window !== "undefined" ? window.location.href : "https://tavro-tan.vercel.app");

  const stepClass = compact
    ? "text-sm text-muted-foreground"
    : "text-sm text-muted-foreground";

  if (platform === "android") {
    return (
      <ol className={`mt-3 list-decimal space-y-2 pl-5 ${stepClass}`}>
        <li>
          Tap <strong className="text-foreground">⋮</strong> (top right in Chrome).
        </li>
        <li>
          Choose <strong className="text-foreground">Install app</strong> or{" "}
          <strong className="text-foreground">Add to Home screen</strong>.
        </li>
        <li>Open Tavro from your home screen for the full-screen app.</li>
      </ol>
    );
  }

  if (platform === "ios-safari" || platform === "ios-other") {
    return (
      <ol className={`mt-3 list-decimal space-y-2 pl-5 ${stepClass}`}>
        <li>
          Tap{" "}
          <Share className="inline h-3.5 w-3.5 text-primary" aria-hidden />{" "}
          <strong className="text-foreground">Share</strong> (bottom or top of Safari).
        </li>
        <li>
          Scroll down and tap{" "}
          <strong className="text-foreground">Add to Home Screen</strong>.
        </li>
        <li>
          Tap <strong className="text-foreground">Add</strong>, then open Tavro from
          the new icon.
        </li>
      </ol>
    );
  }

  if (platform === "ios-chrome") {
    return (
      <div className="mt-3 space-y-3">
        <p className={stepClass}>
          On iPhone, <strong className="text-foreground">Share in Chrome often
          won&apos;t show</strong> Add to Home Screen. Use either path below:
        </p>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Option A — Chrome menu
          </p>
          <ol className={`mt-1 list-decimal space-y-1 pl-5 ${stepClass}`}>
            <li>
              Tap <strong className="text-foreground">⋯</strong> in Chrome.
            </li>
            <li>
              Tap <strong className="text-foreground">Add to Home Screen</strong>{" "}
              if you see it.
            </li>
          </ol>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Option B — Safari (always works)
          </p>
          <ol className={`mt-1 list-decimal space-y-1 pl-5 ${stepClass}`}>
            <li>Copy the link below and open <strong className="text-foreground">Safari</strong>.</li>
            <li>Paste the link, tap Share, scroll → Add to Home Screen.</li>
          </ol>
          {!compact ? (
            <div className="mt-2">
              <CopyLinkButton
                url={url}
                label="Copy Tavro link for Safari"
                fullWidth
                variant="secondary"
              />
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <p className={`mt-3 ${stepClass}`}>
      On your phone, open Tavro in Safari or Chrome and use Add to Home Screen /
      Install app from the browser menu.
    </p>
  );
}
