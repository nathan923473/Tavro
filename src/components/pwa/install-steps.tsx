"use client";

import { CopyLinkButton } from "@/components/share/copy-link-button";
import { Button } from "@/components/ui/button";
import { installHelpCopy, type InstallPlatform } from "@/lib/pwa/install-platform";
import { Download, Share } from "lucide-react";

export function InstallSteps({
  platform,
  canPrompt,
  onInstall,
}: {
  platform: InstallPlatform;
  canPrompt: boolean;
  onInstall: () => void;
}) {
  const help = installHelpCopy(platform);

  return (
    <div className="mt-3">
      <ol className="list-none space-y-2 text-sm text-muted-foreground">
        {help.steps.map((step, index) => (
          <li key={step} className="flex items-start gap-2">
            {platform === "iphone-safari" && index === 0 ? (
              <Share className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
            ) : (
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {index + 1}
              </span>
            )}
            <span>{step}</span>
          </li>
        ))}
      </ol>
      {help.showCopyLink ? (
        <div className="mt-3">
          <CopyLinkButton url="/" label="Copy link" fullWidth />
        </div>
      ) : null}
      {canPrompt ? (
        <Button className="mt-3" fullWidth onClick={onInstall}>
          <Download className="h-4 w-4" aria-hidden />
          Install on this device
        </Button>
      ) : null}
    </div>
  );
}
