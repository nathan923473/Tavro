"use client";

import { setCommunityMediaUrlsAction } from "@/app/(app)/studio/media-actions";
import { Button } from "@/components/ui/button";
import { uploadCommunityMediaFile } from "@/lib/storage/upload-client";
import { ImageIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

export function CommunityMediaUpload({
  ownerId,
  avatarUrl,
  bannerUrl,
}: {
  ownerId: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
}) {
  const router = useRouter();
  const avatarInput = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function upload(kind: "avatar" | "banner", file: File) {
    startTransition(async () => {
      try {
        const url = await uploadCommunityMediaFile(ownerId, kind, file);
        await setCommunityMediaUrlsAction(
          kind === "avatar" ? { avatarUrl: url } : { bannerUrl: url },
        );
        setMessage(`${kind === "avatar" ? "Profile" : "Banner"} image saved.`);
        router.refresh();
      } catch (e) {
        setMessage(e instanceof Error ? e.message : "Upload failed.");
      }
    });
  }

  return (
    <div className="space-y-3">
      {bannerUrl ? (
        <div className="relative h-24 w-full overflow-hidden rounded-xl">
          <Image src={bannerUrl} alt="" fill className="object-cover" unoptimized />
        </div>
      ) : null}
      {avatarUrl ? (
        <div className="relative h-16 w-16 overflow-hidden rounded-xl">
          <Image src={avatarUrl} alt="" fill className="object-cover" unoptimized />
        </div>
      ) : null}

      <input
        ref={avatarInput}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) upload("avatar", file);
        }}
      />
      <input
        ref={bannerInput}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) upload("banner", file);
        }}
      />

      <Button
        type="button"
        variant="outline"
        fullWidth
        className="justify-start"
        disabled={pending}
        onClick={() => avatarInput.current?.click()}
      >
        <ImageIcon className="h-4 w-4" aria-hidden />
        Upload community profile photo
      </Button>
      <Button
        type="button"
        variant="outline"
        fullWidth
        className="justify-start"
        disabled={pending}
        onClick={() => bannerInput.current?.click()}
      >
        <ImageIcon className="h-4 w-4" aria-hidden />
        Upload banner photo
      </Button>
      <p className="text-xs text-muted-foreground">Shown on your public creator page · max 5 MB</p>
      {message ? (
        <p className="text-sm text-muted-foreground" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
