"use client";

import { setProfileAvatarUrlAction } from "@/app/(app)/profile/actions";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Button } from "@/components/ui/button";
import {
  AVATAR_PRESETS,
  presetAvatarValue,
} from "@/lib/storage/avatars";
import { uploadProfileAvatarFile } from "@/lib/storage/upload-client";
import { ImagePlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

export function ProfileAvatarEditor({
  userId,
  displayName,
  avatarUrl,
}: {
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function save(url: string) {
    startTransition(async () => {
      try {
        await setProfileAvatarUrlAction(url);
        setMessage("Profile photo saved.");
        router.refresh();
      } catch (e) {
        setMessage(e instanceof Error ? e.message : "Save failed.");
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <UserAvatar
          displayName={displayName}
          avatarUrl={avatarUrl}
          size="lg"
        />
        <div className="flex-1 space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              startTransition(async () => {
                try {
                  const url = await uploadProfileAvatarFile(userId, file);
                  await setProfileAvatarUrlAction(url);
                  setMessage("Photo uploaded.");
                  router.refresh();
                } catch (err) {
                  setMessage(err instanceof Error ? err.message : "Upload failed.");
                }
              });
            }}
          />
          <Button
            type="button"
            variant="outline"
            fullWidth
            disabled={pending}
            onClick={() => inputRef.current?.click()}
          >
            <ImagePlus className="h-4 w-4" aria-hidden />
            Upload photo
          </Button>
          <p className="text-xs text-muted-foreground">
            JPG, PNG, WebP, or GIF · max 2 MB
          </p>
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Or pick a style</p>
        <div className="grid grid-cols-3 gap-2">
          {AVATAR_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              disabled={pending}
              onClick={() => save(presetAvatarValue(preset.id))}
              className="flex flex-col items-center gap-1 rounded-xl border border-border p-2 text-xs transition hover:border-primary/40"
              aria-label={`Use ${preset.label} avatar`}
            >
              <span
                className="flex h-12 w-12 items-center justify-center rounded-xl text-lg"
                style={{ background: preset.gradient }}
              >
                {preset.emoji}
              </span>
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {message ? (
        <p className="text-sm text-muted-foreground" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
