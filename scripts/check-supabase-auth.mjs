/**
 * Sign-up smoke test (.env.local).
 * Uses SUPABASE_SERVICE_ROLE_KEY when set (matches app sign-up path).
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
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
  process.exit(1);
}

const email = `streakly-check+${Date.now()}@mailinator.com`;
const password = "StreaklyCheck1!";

async function tryAdminSignup() {
  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) return { ok: false, msg: error.message };
  if (data.user?.id) {
    await admin.from("profiles").upsert({
      id: data.user.id,
      display_name: "Check",
      referral_code: "check000",
    });
  }
  return { ok: true };
}

async function tryAnonSignup() {
  const res = await fetch(`${url}/auth/v1/signup`, {
    method: "POST",
    headers: { apikey: anonKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.text();
  let json;
  try {
    json = JSON.parse(body);
  } catch {
    json = { raw: body };
  }
  if (res.ok && (json.access_token || json.id)) return { ok: true };
  return {
    ok: false,
    msg: json.msg || json.error_description || json.message || body,
    error_code: json.error_code,
  };
}

let result;
if (serviceKey) {
  console.log("Testing sign-up via service role (same as app Sign up)…");
  result = await tryAdminSignup();
} else {
  console.log("Testing sign-up via anon key (add SUPABASE_SERVICE_ROLE_KEY for app-style sign-up)…");
  result = await tryAnonSignup();
}

if (result.ok) {
  console.log("✓ Sign-up works. Delete the test user in Supabase → Authentication → Users if you like.");
  process.exit(0);
}

console.error("✗ Sign-up failed:", result.msg);

if (String(result.msg || "").includes("Database error saving new user")) {
  console.error(`
→ Run in Supabase SQL Editor:
  supabase/migrations/003_fix_signup_profile_trigger.sql
`);
}

if (
  String(result.msg || "").includes("rate limit") ||
  result.error_code === "over_email_send_rate_limit"
) {
  console.error(`
→ Add SUPABASE_SERVICE_ROLE_KEY to .env.local (server-only), or turn OFF Confirm email in Supabase.
`);
}

process.exit(1);
