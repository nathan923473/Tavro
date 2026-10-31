#!/usr/bin/env node
/**
 * Change a user's login email in Supabase Auth (same user ID — admin, profile, data stay).
 *
 * Prerequisites:
 * - .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 * - User UID from Supabase Dashboard → Authentication → Users → click user → copy UUID
 *
 * Run from your project folder (where package.json lives):
 *
 *   npm run change-user-email -- YOUR-USER-UUID new@email.com
 *
 * Example:
 *   npm run change-user-email -- a1b2c3d4-.... jack@newdomain.com
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { cwd } from "node:process";

function loadEnvLocal() {
  const path = `${cwd()}/.env.local`;
  if (!existsSync(path)) {
    console.error("Missing .env.local in this folder. Run from your Streakly project root.");
    process.exit(1);
  }
  const env = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const m = trimmed.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return env;
}

const userId = process.argv[2]?.trim();
const newEmail = process.argv[3]?.trim().toLowerCase();

if (!userId || !newEmail || !newEmail.includes("@")) {
  console.error(`
Usage:
  npm run change-user-email -- USER-UUID new@email.com

Where to get USER-UUID:
  1. Open https://supabase.com/dashboard
  2. Your project → Authentication → Users
  3. Click your user row
  4. Copy "User UID" (long id like xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)

Where to run this command:
  Terminal in Cursor (or Mac Terminal), after:
  cd path/to/your/streakly-or-stride-folder
`);
  process.exit(1);
}

const env = loadEnvLocal();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error } = await admin.auth.admin.updateUserById(userId, {
  email: newEmail,
  email_confirm: false,
});

if (error) {
  console.error("Failed:", error.message);
  process.exit(1);
}

const ownership = await admin
  .from("profiles")
  .update({ email_ownership_verified_at: null })
  .eq("id", userId);
if (
  ownership.error &&
  !/email_ownership_verified_at|schema cache/i.test(ownership.error.message)
) {
  console.error("Email changed, but the ownership flag was not cleared:", ownership.error.message);
}

const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
  type: "magiclink",
  email: newEmail,
});

console.log("Login email is now:", data.user?.email);
console.log("The new address is not verified. Do not mark it confirmed from the dashboard.");
if (linkError) {
  console.error("Could not create a verification link:", linkError.message);
  console.log("Ask them to use Forgot password after Confirm email is on.");
} else if (linkData?.properties?.action_link) {
  console.log("Send this one-time link to the new inbox. Opening it verifies the address:");
  console.log(linkData.properties.action_link);
}
