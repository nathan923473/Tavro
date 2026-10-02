"use client";

import { Button } from "@/components/ui/button";
import { Check, Link2 } from "lucide-react";
import { useState } from "react";

type CopyLinkButtonProps = {
  url: string;
  label?: string;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  fullWidth?: boolean;
};

export function CopyLinkButton({
  url,
  label = "Copy invite link",
  variant = "outline",
  fullWidth,
}: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const fullUrl = url.startsWith("http")
      ? url
      : `${window.location.origin}${url.startsWith("/") ? url : `/${url}`}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", fullUrl);
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      fullWidth={fullWidth}
      onClick={handleCopy}
      aria-label={label}
    >
      {copied ? (
        <Check className="h-4 w-4" aria-hidden />
      ) : (
        <Link2 className="h-4 w-4" aria-hidden />
      )}
      {copied ? "Link copied" : label}
    </Button>
  );
}
