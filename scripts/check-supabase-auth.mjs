/**
 * Quick sign-up smoke test (uses .env.local anon key).
 * "Database error saving new user" → run supabase/migrations/003_fix_signup_profile_trigger.sql
 */
import { readFileSync, existsSync } from "node:fs";
import { cwd } from "node:process";

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
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
  process.exit(1);
}

const email = `streakly-check+${Date.now()}@mailinator.com`;
const password = "StreaklyCheck1!";

const res = await fetch(`${url}/auth/v1/signup`, {
  method: "POST",
  headers: {
    apikey: key,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ email, password }),
});

const body = await res.text();
let json;
try {
  json = JSON.parse(body);
} catch {
  json = { raw: body };
}

if (res.ok && (json.access_token || json.id)) {
  console.log("✓ Sign-up works (test user created). You can delete it in Supabase → Authentication → Users.");
  process.exit(0);
}

console.error("✗ Sign-up failed:", json.msg || json.error_description || json.message || body);

if (String(json.msg || "").includes("Database error saving new user")) {
  console.error(`
→ Fix: Supabase Dashboard → SQL Editor → paste and run:
  supabase/migrations/003_fix_signup_profile_trigger.sql
`);
}

if (
  String(json.msg || "").includes("rate limit") ||
  json.error_code === "over_email_send_rate_limit"
) {
  console.error(`
→ Fix (pick one):
  1. Supabase → Authentication → Providers → Email → turn OFF "Confirm email"
  2. Supabase → Authentication → Rate limits → raise email limits (or wait ~1 hour)
  3. Supabase → Authentication → Users → Add user → set password → enable "Auto confirm"
     Then log in in the app with that email (no sign-up needed).
`);
}

process.exit(1);
