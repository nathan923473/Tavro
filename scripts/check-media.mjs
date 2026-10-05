/**
 * Verifies Supabase is ready for profile + challenge photo uploads.
 * Run: npm run check:media
 */
import { readFileSync, existsSync } from "node:fs";
import { cwd } from "node:process";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  const path = `${cwd()}/.env.local`;
  if (!existsSync(path)) return {};
  const env = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
}

const env = { ...process.env, ...loadEnvLocal() };
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anon) {
  console.error("✗ Missing Supabase URL or anon key in .env.local");
  process.exit(1);
}

const service = env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, service || anon);

const { error: avatarCol } = await supabase.from("profiles").select("avatar_url").limit(1);
if (avatarCol && /avatar_url|schema cache/i.test(avatarCol.message)) {
  console.error("✗ profiles.avatar_url missing");
  console.error("  → Run supabase/scripts/profile-pictures-only.sql in Supabase SQL Editor");
  process.exit(1);
}
console.log("✓ profiles.avatar_url");

const { error: photos } = await supabase.from("challenge_photos").select("id").limit(1);
if (photos && /challenge_photos|schema cache/i.test(photos.message)) {
  console.error("✗ challenge_photos table missing");
  console.error("  → Run 009b_one_shot_fix_media.sql");
  process.exit(1);
}
console.log("✓ challenge_photos table");

const { data: buckets, error: bucketErr } = await supabase.storage.listBuckets();
if (bucketErr) {
  console.warn("⚠ Could not list buckets (anon key):", bucketErr.message);
  console.log("  If uploads fail, run 009b and confirm buckets avatars, challenge-media exist in Supabase → Storage.");
} else {
  for (const id of ["avatars", "challenge-media", "community-media"]) {
    if (buckets.some((b) => b.id === id)) {
      console.log(`✓ storage bucket: ${id}`);
    } else {
      console.error(`✗ missing bucket: ${id} — run 009b_one_shot_fix_media.sql`);
      process.exit(1);
    }
  }
}

console.log("\nPhoto uploads should work. Profile → Profile picture; creators → Studio → Photos.");
