"use client";

import { userFacingErrorMessage } from "@/lib/errors/user-message";

import { uploadProfileAvatarAction } from "@/app/(app)/profile/actions";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Button } from "@/components/ui/button";
import { ContentGuidelinesReminder } from "@/components/moderation/content-guidelines-reminder";
import { ImagePlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

export function ProfileAvatarEditor({
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
                  const body = new FormData();
                  body.set("file", file);
                  await uploadProfileAvatarAction(body);
                  setMessage("Photo uploaded.");
                  router.refresh();
                } catch (err) {
                  setMessage(userFacingErrorMessage(err, "Upload failed."));
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
          <ContentGuidelinesReminder />
        </div>
      </div>

      {message ? (
        <p
          className={
            /failed|migration|denied|missing/i.test(message)
              ? "text-sm text-red-600"
              : "text-sm text-muted-foreground"
          }
          role={/failed|migration|denied|missing/i.test(message) ? "alert" : "status"}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
