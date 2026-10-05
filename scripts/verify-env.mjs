/**
 * Quick check: .env.local points at Supabase and keys look present.
 * Run: npm run verify:env
 */
import { existsSync, readFileSync } from "node:fs";
import { cwd } from "node:process";

const path = `${cwd()}/.env.local`;
if (!existsSync(path)) {
  console.error("✗ Missing .env.local in this folder.");
  console.error("  Copy .env.example → .env.local and paste keys from Supabase → Settings → API.");
  process.exit(1);
}

const env = {};
for (const line of readFileSync(path, "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = env.SUPABASE_SERVICE_ROLE_KEY;

let ok = true;
if (!url?.includes("supabase.co")) {
  console.error("✗ NEXT_PUBLIC_SUPABASE_URL missing or invalid");
  ok = false;
} else {
  console.log("✓ Supabase URL:", url);
}

if (!anon || anon.length < 20) {
  console.error("✗ NEXT_PUBLIC_SUPABASE_ANON_KEY missing");
  ok = false;
} else {
  console.log("✓ Anon/publishable key present");
}

if (!service) {
  console.warn("⚠ SUPABASE_SERVICE_ROLE_KEY missing — sign-up may need email confirm");
} else {
  console.log("✓ Service role key present (recommended)");
}

if (!ok) process.exit(1);
console.log("\nRestart npm run dev after any .env change. Then: npm run check:auth");
