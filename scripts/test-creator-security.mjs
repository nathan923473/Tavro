/**
 * Creator verification security checks (requires .env.local + migration 005).
 * Confirms non-admin cannot call admin RPCs when using anon session (simulated).
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

if (!url || !anonKey || !serviceKey) {
  console.error("Need NEXT_PUBLIC_SUPABASE_URL, ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

console.log("Creator security checks\n");

// 1) approve_creator_application must reject without admin session
const anonClient = createClient(url, anonKey);
const { error: approveErr } = await anonClient.rpc("approve_creator_application", {
  app_id: "00000000-0000-0000-0000-000000000000",
});
if (approveErr?.message?.includes("not authorized") || approveErr?.message?.includes("JWT")) {
  console.log("✓ Anonymous/non-admin cannot approve applications");
} else {
  console.error("✗ Expected approve_creator_application to fail for anon:", approveErr);
}

// 2) direct insert into creator_applications should be denied (policy removed)
const { error: insertErr } = await anonClient.from("creator_applications").insert({
  user_id: "00000000-0000-0000-0000-000000000000",
  display_name: "Evil",
  pitch: "Should not work ever at all",
  social_link: "https://example.com/x",
  status: "approved",
});
if (insertErr) {
  console.log("✓ Direct application insert blocked without auth/RPC");
} else {
  console.error("✗ Direct insert should fail");
}

// 3) profile privilege trigger exists (documented — full test needs authenticated user JWT)
console.log("• Profile creator_status/is_admin changes require admin (DB trigger in migration 005)");

console.log("\nManual UI tests:");
console.log("  - Member cannot open /admin/creator-applications");
console.log("  - Member cannot approve self via UI");
console.log("  - Verified application still needs admin Approve for Studio access");

process.exit(0);
