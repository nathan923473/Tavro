"use client";

import {
  removeChallengeCoverAction,
  uploadChallengeCoverAction,
} from "@/app/(app)/studio/media-actions";
import { ChallengeCoverImage } from "@/components/challenges/challenge-cover-image";
import { Button } from "@/components/ui/button";
import { ImagePlus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

type ChallengeCoverFieldProps = {
  challengeId: string;
  coverUrl: string | null;
  title?: string;
  disabled?: boolean;
  required?: boolean;
  onCoverUrlChange?: (url: string | null) => void;
};

export function ChallengeCoverField({
  challengeId,
  coverUrl,
  title,
  disabled = false,
  required = false,
  onCoverUrlChange,
}: ChallengeCoverFieldProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  function upload(file: File) {
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("challengeId", challengeId);
        formData.set("file", file);
        const result = await uploadChallengeCoverAction(formData);
        onCoverUrlChange?.(result.coverUrl);
        setMessage("Cover image updated.");
        router.refresh();
      } catch (e) {
        setMessage(e instanceof Error ? e.message : "Upload failed.");
      } finally {
        URL.revokeObjectURL(localPreview);
        setPreviewUrl(null);
      }
    });
  }

  function remove() {
    startTransition(async () => {
      try {
        await removeChallengeCoverAction(challengeId);
        onCoverUrlChange?.(null);
        setMessage("Cover image removed.");
        router.refresh();
      } catch (e) {
        setMessage(e instanceof Error ? e.message : "Remove failed.");
      }
    });
  }

  const displayUrl = previewUrl ?? coverUrl;

  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-medium">
          Challenge cover image
          {required ? <span className="text-red-600"> *</span> : null}
        </p>
        <p className="text-xs text-muted-foreground">
          {required ? "Required before you publish · " : "Optional · "}
          JPG, PNG or WebP · up to 5 MB · 16:9 looks best on cards
        </p>
      </div>

      <ChallengeCoverImage coverUrl={displayUrl} title={title} />

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        disabled={disabled || pending}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) upload(file);
        }}
      />

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={disabled || pending}
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus className="h-4 w-4" aria-hidden />
          {displayUrl ? "Replace cover" : "Upload cover"}
        </Button>
        {coverUrl && !required ? (
          <Button
            type="button"
            variant="outline"
            disabled={disabled || pending}
            onClick={remove}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            Remove
          </Button>
        ) : null}
      </div>

      {message ? (
        <p
          className={
            /failed|invalid|denied|not found/i.test(message)
              ? "text-sm text-red-600"
              : "text-sm text-muted-foreground"
          }
          role="status"
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
