#!/usr/bin/env node
/**
 * One-time setup on your Mac after cloning stride.
 * Run: node scripts/laptop-setup.mjs
 */
import { existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { cwd } from "node:process";

console.log("Streakly — laptop setup\n");

if (!existsSync(`${cwd()}/package.json`)) {
  console.error("Run this inside the stride folder (where package.json is).");
  process.exit(1);
}

console.log("Installing dependencies…");
execSync("npm install", { stdio: "inherit" });

if (!existsSync(`${cwd()}/.env.local`)) {
  console.log(`
⚠  Create .env.local with your Supabase keys (copy from Supabase dashboard):

   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   See docs/supabase-auth-setup.md
`);
} else {
  console.log("✓ .env.local found");
}

console.log(`
Done. Every day, open this folder in Cursor and run:

   npm run dev

Then in Chrome on THIS Mac open:

   http://127.0.0.1:3000

That URL stays stable while npm run dev is running — no cloud preview links needed.
`);
