/**
 * Confirms Supabase env is present and the Auth health endpoint responds.
 * Does not create users and never marks an email as confirmed.
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
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey || url.includes("placeholder")) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
  process.exit(1);
}

console.log("Sign-up sends a Supabase confirmation email. Keep Confirm email ON.");
console.log("Run supabase/migrations/052_email_ownership_and_auth_limits.sql before launch.");
if (!env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log("SUPABASE_SERVICE_ROLE_KEY is unset. Inbox ownership cannot be recorded after the link is opened.");
}
if (!env.TURNSTILE_SECRET_KEY || !env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
  console.log("Turnstile keys are unset. Production sign-up stays closed until both keys are set.");
}

const response = await fetch(`${url}/auth/v1/health`, {
  headers: { apikey: anonKey },
});
if (!response.ok) {
  console.error("Auth health check failed:", response.status);
  process.exit(1);
}

console.log("Auth service responded. No test user was created.");
