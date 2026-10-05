"use client";

import {
  addChallengePhotoAction,
  removeChallengePhotoAction,
  setChallengeCoverUrlAction,
} from "@/app/(app)/studio/media-actions";
import { Button } from "@/components/ui/button";
import { uploadChallengeMediaFile } from "@/lib/storage/upload-client";
import { ImagePlus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

type Photo = { id: string; image_url: string };

export function ChallengePhotosEditor({
  challengeId,
  creatorId,
  title,
  coverUrl,
  photos,
}: {
  challengeId: string;
  creatorId: string;
  title: string;
  coverUrl: string | null;
  photos: Photo[];
}) {
  const router = useRouter();
  const coverInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function uploadCover(file: File) {
    startTransition(async () => {
      try {
        const url = await uploadChallengeMediaFile(creatorId, challengeId, file, "cover");
        await setChallengeCoverUrlAction(challengeId, url);
        setMessage("Cover photo updated.");
        router.refresh();
      } catch (e) {
        setMessage(e instanceof Error ? e.message : "Upload failed.");
      }
    });
  }

  function uploadGallery(file: File) {
    startTransition(async () => {
      try {
        const url = await uploadChallengeMediaFile(creatorId, challengeId, file, "gallery");
        await addChallengePhotoAction(challengeId, url);
        setMessage("Photo added to challenge page.");
        router.refresh();
      } catch (e) {
        setMessage(e instanceof Error ? e.message : "Upload failed.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">
          Cover and gallery appear on your public challenge invite page.
        </p>
      </div>

      <div className="relative aspect-[2/1] w-full overflow-hidden rounded-xl bg-muted">
        {coverUrl ? (
          <Image src={coverUrl} alt="" fill className="object-cover" unoptimized />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No cover yet
          </div>
        )}
      </div>

      <input
        ref={coverInput}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) uploadCover(file);
        }}
      />
      <input
        ref={galleryInput}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) uploadGallery(file);
        }}
      />

      <div className="grid gap-2">
        <Button
          type="button"
          disabled={pending}
          onClick={() => coverInput.current?.click()}
        >
          <ImagePlus className="h-4 w-4" aria-hidden />
          {coverUrl ? "Replace cover photo" : "Add cover photo"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={pending}
          onClick={() => galleryInput.current?.click()}
        >
          <ImagePlus className="h-4 w-4" aria-hidden />
          Add gallery photo
        </Button>
      </div>

      {photos.length > 0 ? (
        <ul className="grid grid-cols-2 gap-2">
          {photos.map((photo) => (
            <li key={photo.id} className="relative aspect-square overflow-hidden rounded-xl">
              <Image
                src={photo.image_url}
                alt=""
                fill
                className="object-cover"
                unoptimized
              />
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    try {
                      await removeChallengePhotoAction(photo.id);
                      router.refresh();
                    } catch (e) {
                      setMessage(e instanceof Error ? e.message : "Remove failed.");
                    }
                  })
                }
                className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white"
                aria-label="Remove photo"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {message ? (
        <p
          className={
            /failed|migration|denied|missing|invalid/i.test(message)
              ? "text-sm text-red-600"
              : "text-sm text-muted-foreground"
          }
          role={/failed|migration|denied|missing|invalid/i.test(message) ? "alert" : "status"}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
