export function formatImageUploadError(message: string) {
  const m = message.toLowerCase();
  if (m.includes("bucket") && m.includes("not found")) {
    return "Storage bucket missing — run supabase/migrations/009b_one_shot_fix_media.sql in Supabase SQL Editor.";
  }
  if (m.includes("row-level security") || m.includes("policy")) {
    return "Storage permission denied — run 009b_one_shot_fix_media.sql, then sign out and back in.";
  }
  if (m.includes("avatar_url") || m.includes("schema cache")) {
    return "Database needs migration 009b_one_shot_fix_media.sql (profile photos).";
  }
  if (m.includes("challenge_photos")) {
    return "Database needs migration 009b_one_shot_fix_media.sql (challenge gallery).";
  }
  return message;
}
