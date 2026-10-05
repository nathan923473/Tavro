"use server";

import { requireUserId } from "@/lib/auth/require-user-id";
import { isAllowedPublicMediaUrl } from "@/lib/storage/validate-image-url";
import { revalidatePath } from "next/cache";

const supabaseUrl = () => process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

export async function setCommunityMediaUrlsAction(input: {
  avatarUrl?: string | null;
  bannerUrl?: string | null;
}) {
  const { supabase, userId } = await requireUserId();
  const patch: Record<string, string | null> = {};

  if (input.avatarUrl !== undefined) {
    if (input.avatarUrl && !isAllowedPublicMediaUrl(input.avatarUrl, supabaseUrl(), "community-media")) {
      throw new Error("Invalid community avatar URL.");
    }
    patch.avatar_url = input.avatarUrl;
  }
  if (input.bannerUrl !== undefined) {
    if (input.bannerUrl && !isAllowedPublicMediaUrl(input.bannerUrl, supabaseUrl(), "community-media")) {
      throw new Error("Invalid community banner URL.");
    }
    patch.banner_url = input.bannerUrl;
  }

  if (!Object.keys(patch).length) return;

  const { error } = await supabase
    .from("creator_communities")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("owner_id", userId);

  if (error) throw new Error(error.message);

  const { data: community } = await supabase
    .from("creator_communities")
    .select("slug")
    .eq("owner_id", userId)
    .maybeSingle();

  if (community?.slug) {
    revalidatePath(`/creator/${community.slug}`);
    revalidatePath(`/creator/${community.slug}/edit`);
  }
  revalidatePath("/studio");
}

export async function setChallengeCoverUrlAction(challengeId: string, coverUrl: string | null) {
  const { supabase, userId } = await requireUserId();
  if (coverUrl && !isAllowedPublicMediaUrl(coverUrl, supabaseUrl(), "challenge-media")) {
    throw new Error("Invalid cover image URL.");
  }

  const { error } = await supabase
    .from("challenges")
    .update({ cover_url: coverUrl, updated_at: new Date().toISOString() })
    .eq("id", challengeId)
    .eq("created_by", userId);

  if (error) {
    if (/cover_url|schema cache/i.test(error.message)) {
      throw new Error(
        "Challenge cover needs migration 009b_one_shot_fix_media.sql (cover_url on challenges should already exist from 002 — check Supabase).",
      );
    }
    throw new Error(error.message);
  }

  revalidatePath("/studio");
  revalidatePath(`/studio/challenges/${challengeId}/photos`);
  revalidatePath("/challenges");
}

export async function addChallengePhotoAction(challengeId: string, imageUrl: string) {
  const { supabase, userId } = await requireUserId();
  if (!isAllowedPublicMediaUrl(imageUrl, supabaseUrl(), "challenge-media")) {
    throw new Error("Invalid photo URL.");
  }

  const { data: challenge } = await supabase
    .from("challenges")
    .select("id")
    .eq("id", challengeId)
    .eq("created_by", userId)
    .maybeSingle();
  if (!challenge) throw new Error("Challenge not found.");

  const { count } = await supabase
    .from("challenge_photos")
    .select("*", { count: "exact", head: true })
    .eq("challenge_id", challengeId);

  const { error } = await supabase.from("challenge_photos").insert({
    challenge_id: challengeId,
    image_url: imageUrl,
    sort_order: count ?? 0,
  });
  if (error) {
    if (/challenge_photos|schema cache/i.test(error.message)) {
      throw new Error(
        "Challenge gallery needs migration 009b_one_shot_fix_media.sql in Supabase SQL Editor.",
      );
    }
    throw new Error(error.message);
  }

  revalidatePath(`/studio/challenges/${challengeId}/photos`);
  revalidatePath("/challenges");
}

export async function removeChallengePhotoAction(photoId: string) {
  const { supabase, userId } = await requireUserId();

  const { data: photo } = await supabase
    .from("challenge_photos")
    .select("id, challenge_id")
    .eq("id", photoId)
    .maybeSingle();
  if (!photo) throw new Error("Photo not found.");

  const { data: challenge } = await supabase
    .from("challenges")
    .select("id")
    .eq("id", photo.challenge_id)
    .eq("created_by", userId)
    .maybeSingle();
  if (!challenge) throw new Error("Photo not found.");

  const { error } = await supabase.from("challenge_photos").delete().eq("id", photoId);
  if (error) throw new Error(error.message);

  revalidatePath(`/studio/challenges/${photo.challenge_id}/photos`);
  revalidatePath("/challenges");
}
