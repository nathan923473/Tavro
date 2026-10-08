"use server";

import { requireUserId } from "@/lib/auth/require-user-id";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  ALLOWED_IMAGE_TYPES,
  extensionForMime,
  IMAGE_UPLOAD_MAX_BYTES,
} from "@/lib/storage/avatars";
import { formatImageUploadError } from "@/lib/storage/upload-errors";
import { isAllowedProfileAvatarUrl } from "@/lib/storage/validate-image-url";
import { looksLikeFullPersonalName } from "@/lib/creator-display-name";
import { revalidatePath } from "next/cache";

export async function updateDisplayNameAction(displayName: string) {
  const { supabase, userId } = await requireUserId();
  const trimmed = displayName.trim().slice(0, 80);
  if (!trimmed) throw new Error("Enter a display name.");

  const { data: before } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", userId)
    .maybeSingle();
  const previousDisplayName = before?.display_name?.trim() ?? "";

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: trimmed, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) throw new Error(error.message);

  const { data: community } = await supabase
    .from("creator_communities")
    .select("id, slug, community_name")
    .eq("owner_id", userId)
    .maybeSingle();

  if (community) {
    const communityName = community.community_name?.trim() ?? "";
    const shouldSyncCommunity =
      communityName &&
      previousDisplayName &&
      communityName.toLowerCase() === previousDisplayName.toLowerCase() &&
      communityName.toLowerCase() !== trimmed.toLowerCase();

    const shouldSyncStalePersonalName =
      communityName &&
      communityName.toLowerCase() !== trimmed.toLowerCase() &&
      looksLikeFullPersonalName(communityName) &&
      looksLikeFullPersonalName(trimmed);

    if (shouldSyncCommunity || shouldSyncStalePersonalName) {
      await supabase
        .from("creator_communities")
        .update({
          community_name: trimmed,
          updated_at: new Date().toISOString(),
        })
        .eq("id", community.id)
        .eq("owner_id", userId);
      if (community.slug) {
        revalidatePath(`/creator/${community.slug}`);
      }
    }
  }

  revalidatePath("/profile");
  revalidatePath("/");
  revalidatePath("/challenges");
  revalidatePath("/discover");
  revalidatePath("/studio");
}

export async function setProfileAvatarUrlAction(avatarUrl: string) {
  const { supabase, userId } = await requireUserId();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (!isAllowedProfileAvatarUrl(avatarUrl, supabaseUrl)) {
    throw new Error("Invalid profile image.");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) {
    if (/avatar_url|schema cache/i.test(error.message)) {
      throw new Error(
        "Run supabase/scripts/profile-pictures-only.sql in Supabase SQL Editor, then try again.",
      );
    }
    throw new Error(error.message);
  }

  const { data: community } = await supabase
    .from("creator_communities")
    .select("id, slug, avatar_url")
    .eq("owner_id", userId)
    .maybeSingle();

  if (community && !community.avatar_url?.trim()) {
    await supabase
      .from("creator_communities")
      .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
      .eq("id", community.id);
    if (community.slug) {
      revalidatePath(`/creator/${community.slug}`);
    }
  }

  revalidatePath("/profile");
  revalidatePath("/groups");
  revalidatePath("/discover");
  revalidatePath("/challenges");
  revalidatePath("/");
  revalidatePath("/onboarding");
}

export async function uploadProfileAvatarAction(formData: FormData) {
  const { supabase, userId } = await requireUserId();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Choose an image file.");
  }

  if (
    !ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])
  ) {
    throw new Error("Use a JPG, PNG, WebP, or GIF image.");
  }
  if (file.size > IMAGE_UPLOAD_MAX_BYTES) {
    throw new Error("Image must be under 2 MB.");
  }

  const ext = extensionForMime(file.type);
  const path = `${userId}/avatar.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const admin = createAdminClient();
  const storage = admin ?? supabase;

  const { error: uploadError } = await storage.storage
    .from("avatars")
    .upload(path, bytes, {
      upsert: true,
      contentType: file.type,
    });

  if (uploadError) {
    throw new Error(formatImageUploadError(uploadError.message));
  }

  const { data: publicUrlData } = storage.storage.from("avatars").getPublicUrl(path);
  const avatarUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`;

  await setProfileAvatarUrlAction(avatarUrl);
  return { ok: true as const, avatarUrl };
}
