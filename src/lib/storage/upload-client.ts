"use client";

import { tryCreateClient } from "@/lib/supabase/client";
import {
  ALLOWED_IMAGE_TYPES,
  CHALLENGE_IMAGE_MAX_BYTES,
  extensionForMime,
  IMAGE_UPLOAD_MAX_BYTES,
} from "@/lib/storage/avatars";

function validateFile(file: File, maxBytes: number) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    throw new Error("Use a JPG, PNG, WebP, or GIF image.");
  }
  if (file.size > maxBytes) {
    throw new Error(`Image must be under ${Math.round(maxBytes / 1024 / 1024)} MB.`);
  }
}

export async function uploadProfileAvatarFile(userId: string, file: File) {
  validateFile(file, IMAGE_UPLOAD_MAX_BYTES);
  const supabase = tryCreateClient();
  if (!supabase) throw new Error("Supabase is not configured.");

  const ext = extensionForMime(file.type);
  const path = `${userId}/avatar.${ext}`;

  const { error } = await supabase.storage.from("avatars").upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}

export async function uploadCommunityMediaFile(
  ownerId: string,
  kind: "avatar" | "banner",
  file: File,
) {
  validateFile(file, CHALLENGE_IMAGE_MAX_BYTES);
  const supabase = tryCreateClient();
  if (!supabase) throw new Error("Supabase is not configured.");

  const ext = extensionForMime(file.type);
  const path = `${ownerId}/${kind}.${ext}`;

  const { error } = await supabase.storage.from("community-media").upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from("community-media").getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}

export async function uploadChallengeMediaFile(
  creatorId: string,
  challengeId: string,
  file: File,
  kind: "cover" | "gallery",
) {
  validateFile(file, CHALLENGE_IMAGE_MAX_BYTES);
  const supabase = tryCreateClient();
  if (!supabase) throw new Error("Supabase is not configured.");

  const ext = extensionForMime(file.type);
  const fileName =
    kind === "cover"
      ? `cover.${ext}`
      : `gallery-${crypto.randomUUID()}.${ext}`;
  const path = `${creatorId}/${challengeId}/${fileName}`;

  const { error } = await supabase.storage.from("challenge-media").upload(path, file, {
    upsert: kind === "cover",
    contentType: file.type,
  });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from("challenge-media").getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}
