"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function slugify(title: string): string {
  return `${title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40)}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function createPrivateChallenge(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const startDate = String(formData.get("start_date") ?? "");
  const endDate = String(formData.get("end_date") ?? "");

  if (!title || !startDate || !endDate) {
    return { ok: false as const, error: "Title and dates are required." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Log in required." };

  const inviteSlug = slugify(title);

  const { data, error } = await supabase
    .from("challenges")
    .insert({
      created_by: user.id,
      title,
      description,
      start_date: startDate,
      end_date: endDate,
      visibility: "private",
      invite_slug: inviteSlug,
    })
    .select("id, invite_slug")
    .single();

  if (error) {
    return { ok: false as const, error: error.message };
  }

  await supabase.from("challenge_invites").insert({
    challenge_id: data.id,
    token: inviteSlug,
    created_by: user.id,
  });

  revalidatePath("/challenges");
  return { ok: true as const, invitePath: `/join/${data.invite_slug}` };
}

export async function createPublicChallenge(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const startDate = String(formData.get("start_date") ?? "");
  const endDate = String(formData.get("end_date") ?? "");

  if (!title || !startDate || !endDate) {
    return { ok: false as const, error: "Title and dates are required." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Log in required." };

  const { data: community } = await supabase
    .from("creator_communities")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!community) {
    return {
      ok: false as const,
      error:
        "Create your creator community first (Studio → Edit community) after approval.",
    };
  }

  const inviteSlug = slugify(title);

  const { error } = await supabase.from("challenges").insert({
    created_by: user.id,
    community_id: community.id,
    title,
    description,
    start_date: startDate,
    end_date: endDate,
    visibility: "public",
    invite_slug: inviteSlug,
  });

  if (error) {
    return { ok: false as const, error: error.message };
  }

  revalidatePath("/challenges");
  revalidatePath("/studio");
  return { ok: true as const, invitePath: `/join/${inviteSlug}` };
}
