import { createClient } from "@/lib/supabase/server";

export async function checkMediaDatabaseSetup(): Promise<{
  ok: boolean;
  message: string;
}> {
  try {
    const supabase = await createClient();
    const { error: profileCol } = await supabase
      .from("profiles")
      .select("avatar_url")
      .limit(1);

    if (profileCol && /avatar_url|schema cache/i.test(profileCol.message)) {
      return {
        ok: false,
        message:
          'Run supabase/scripts/profile-pictures-only.sql in Supabase SQL Editor.',
      };
    }

    const { error: photosTable } = await supabase
      .from("challenge_photos")
      .select("id")
      .limit(1);

    if (photosTable && /challenge_photos|schema cache/i.test(photosTable.message)) {
      return {
        ok: false,
        message:
          "Run 009b_one_shot_fix_media.sql for challenge gallery photos.",
      };
    }

    return {
      ok: true,
      message: "Photo uploads ready (migration 009 applied).",
    };
  } catch {
    return { ok: false, message: "Could not verify photo upload setup." };
  }
}
