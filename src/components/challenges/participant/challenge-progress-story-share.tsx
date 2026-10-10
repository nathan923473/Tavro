"use client";

import { CopyLinkButton } from "@/components/share/copy-link-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BRAND_COLORS } from "@/lib/branding";
import { getAppBaseUrl } from "@/lib/site-url";
import { Download, Share2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export type ChallengeProgressStoryData = {
  challengeTitle: string;
  creatorName: string;
  completedDays: number;
  totalDays: number;
  progressPercent: number;
  bestStreak: number;
  canonicalPath: string;
};

const W = 1080;
const H = 1920;

function drawStoryCard(
  canvas: HTMLCanvasElement,
  data: ChallengeProgressStoryData,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = W;
  canvas.height = H;

  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, BRAND_COLORS.royalBlue);
  grad.addColorStop(1, BRAND_COLORS.navy);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.beginPath();
  ctx.arc(W * 0.85, H * 0.12, 220, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = BRAND_COLORS.mint;
  ctx.font = "bold 42px system-ui, sans-serif";
  ctx.fillText("Tavro", 80, 120);

  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = "32px system-ui, sans-serif";
  ctx.fillText("Shared voluntarily · habits only", 80, 170);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 64px system-ui, sans-serif";
  wrapText(ctx, data.challengeTitle, 80, 320, W - 160, 72, 3);

  ctx.fillStyle = BRAND_COLORS.mint;
  ctx.font = "36px system-ui, sans-serif";
  ctx.fillText(`with ${data.creatorName}`, 80, 520);

  const metricY = 680;
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 96px system-ui, sans-serif";
  ctx.fillText(`${data.completedDays}/${data.totalDays}`, 80, metricY);
  ctx.font = "40px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillText("days completed", 80, metricY + 56);

  ctx.font = "bold 72px system-ui, sans-serif";
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(`${Math.round(data.progressPercent)}%`, 80, metricY + 180);
  ctx.font = "40px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillText("activity progress", 80, metricY + 236);

  if (data.bestStreak > 0) {
    ctx.fillStyle = BRAND_COLORS.mint;
    ctx.font = "36px system-ui, sans-serif";
    ctx.fillText(`Best streak: ${data.bestStreak} days`, 80, metricY + 320);
  }

  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = "34px system-ui, sans-serif";
  wrapText(
    ctx,
    "Join the challenge on Tavro — copy the link separately for Instagram.",
    80,
    H - 220,
    W - 160,
    44,
    3,
  );
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
) {
  const words = text.split(/\s+/);
  let line = "";
  let lineCount = 0;
  let cy = y;

  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cy);
      line = word;
      cy += lineHeight;
      lineCount += 1;
      if (lineCount >= maxLines) return;
    } else {
      line = test;
    }
  }
  if (line && lineCount < maxLines) ctx.fillText(line, x, cy);
}

export function ChallengeProgressStoryShare({ data }: { data: ChallengeProgressStoryData }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    drawStoryCard(canvas, data);
    return canvas;
  }, [data]);

  const challengeUrl = `${getAppBaseUrl()}${data.canonicalPath.startsWith("/") ? data.canonicalPath : `/${data.canonicalPath}`}`;

  async function downloadImage() {
    const canvas = render();
    if (!canvas) return;
    setMessage(null);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/png"),
    );
    if (!blob) {
      setMessage("Could not create image.");
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tavro-${data.challengeTitle.slice(0, 40).replace(/\s+/g, "-").toLowerCase()}.png`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage("Image downloaded — add to Instagram Story and paste your challenge link.");
  }

  async function shareImage() {
    const canvas = render();
    if (!canvas) return;
    setMessage(null);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/png"),
    );
    if (!blob) return;

    if (typeof navigator !== "undefined" && navigator.share && navigator.canShare?.({ files: [new File([blob], "tavro-progress.png", { type: "image/png" })] })) {
      try {
        const file = new File([blob], "tavro-progress.png", { type: "image/png" });
        await navigator.share({
          title: data.challengeTitle,
          text: `My progress on ${data.challengeTitle}`,
          files: [file],
        });
        return;
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return;
      }
    }
    await downloadImage();
  }

  return (
    <Card className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold">Share progress card</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Optional · 9:16 for Stories · no weight or private group data
        </p>
      </div>
      <div className="mx-auto aspect-[9/16] w-full max-w-[220px] overflow-hidden rounded-xl border border-border bg-muted shadow-sm">
        <canvas
          ref={canvasRef}
          className="h-full w-full object-contain"
          aria-label="Progress card preview"
        />
      </div>
      <StoryPreviewEffect render={render} data={data} />
      <div className="grid gap-2">
        <Button type="button" variant="secondary" fullWidth className="gap-2" onClick={downloadImage}>
          <Download className="h-4 w-4" aria-hidden />
          Download image
        </Button>
        <Button type="button" variant="outline" fullWidth className="gap-2" onClick={shareImage}>
          <Share2 className="h-4 w-4" aria-hidden />
          Share
        </Button>
        <CopyLinkButton url={challengeUrl} label="Copy challenge link" fullWidth />
      </div>
      {message ? (
        <p className="text-xs text-muted-foreground" role="status">
          {message}
        </p>
      ) : null}
    </Card>
  );
}

function StoryPreviewEffect({
  render,
  data,
}: {
  render: () => HTMLCanvasElement | null;
  data: ChallengeProgressStoryData;
}) {
  useEffect(() => {
    render();
  }, [render, data.challengeTitle, data.completedDays, data.progressPercent]);
  return null;
}
