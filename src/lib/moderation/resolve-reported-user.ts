import type { ReportedContentType } from "@/lib/moderation/types";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Validates content exists and returns the user id responsible for the content. */
export async function resolveReportedUserId(
  supabase: SupabaseClient,
  contentType: ReportedContentType,
  contentId: string,
): Promise<string | null> {
  switch (contentType) {
    case "profile_avatar":
      return contentId;
    case "creator_avatar":
    case "creator_banner": {
      const { data } = await supabase
        .from("creator_communities")
        .select("owner_id")
        .eq("id", contentId)
        .maybeSingle();
      return data?.owner_id ?? null;
    }
    case "challenge_cover": {
      const { data } = await supabase
        .from("challenges")
        .select("created_by")
        .eq("id", contentId)
        .maybeSingle();
      return data?.created_by ?? null;
    }
    case "challenge_gallery_photo": {
      const { data } = await supabase
        .from("challenge_photos")
        .select("challenge_id, challenge:challenges ( created_by )")
        .eq("id", contentId)
        .maybeSingle();
      const ch = data?.challenge as { created_by: string } | { created_by: string }[] | null;
      const row = Array.isArray(ch) ? ch[0] : ch;
      return row?.created_by ?? null;
    }
    case "creator_announcement_image": {
      const { data } = await supabase
        .from("creator_announcements")
        .select("created_by, image_url")
        .eq("id", contentId)
        .maybeSingle();
      if (!data?.image_url) return null;
      return data.created_by ?? null;
    }
    case "challenge_message": {
      const { data } = await supabase
        .from("challenge_messages")
        .select("author_id")
        .eq("id", contentId)
        .maybeSingle();
      return data?.author_id ?? null;
    }
    case "group_message": {
      const { data } = await supabase
        .from("group_messages")
        .select("author_id")
        .eq("id", contentId)
        .maybeSingle();
      return data?.author_id ?? null;
    }
    default:
      return null;
  }
}
