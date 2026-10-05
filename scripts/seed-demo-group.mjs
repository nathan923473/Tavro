/**
 * Add demo members + sample check-ins and chat to your accountability group.
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local (Supabase → Settings → API).
 *
 * Usage:
 *   npm run seed:demo-group
 *   npm run seed:demo-group -- XL9BAZ
 *   npm run seed:demo-group -- --invite=XL9BAZ
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
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

const DEMO_PASSWORD = "StrideDemo1!";
const DEMO_MEMBERS = [
  { key: "maria", displayName: "Maria Chen", checkedIn: true },
  { key: "jordan", displayName: "Jordan Lee", checkedIn: true },
  { key: "alex", displayName: "Alex Rivera", checkedIn: false },
  { key: "sam", displayName: "Sam Taylor", checkedIn: true },
  { key: "riley", displayName: "Riley Kim", checkedIn: false },
];

const SAMPLE_MESSAGES = [
  { authorKey: "maria", body: "Morning walk done — 3 miles before coffee ☀️" },
  { authorKey: "jordan", body: "Same here. Who’s in for tomorrow 6am?" },
  { authorKey: "sam", body: "I’m in. Post a pic when you finish if you can!" },
  { authorKey: "alex", body: "Running late today but still doing my steps after work." },
];

function parseInviteArg(argv) {
  for (const a of argv) {
    if (a.startsWith("--invite=")) return a.slice("--invite=".length).trim();
    if (a && !a.startsWith("-")) return a.trim();
  }
  return "XL9BAZ";
}

function todayDateKey() {
  return new Date().toISOString().slice(0, 10);
}

async function findOrCreateDemoUser(admin, { key, displayName }) {
  const email = `stride-demo-${key}@example.com`;
  const { data: list, error: listErr } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listErr) throw new Error(listErr.message);

  let user = list.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase(),
  );

  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { display_name: displayName },
    });
    if (error) throw new Error(`Create ${email}: ${error.message}`);
    user = data.user;
  }

  await admin.from("profiles").upsert({
    id: user.id,
    display_name: displayName,
  });

  return user.id;
}

async function main() {
  if (!url || !serviceKey) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
    );
    process.exit(1);
  }

  const inviteCode = parseInviteArg(process.argv.slice(2)).toUpperCase();
  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: group, error: groupErr } = await admin
    .from("accountability_groups")
    .select("id, name, invite_code")
    .eq("invite_code", inviteCode)
    .maybeSingle();

  if (groupErr) throw new Error(groupErr.message);
  if (!group) {
    console.error(
      `No group with invite code ${inviteCode}. Create one in the app or pass your code:`,
    );
    console.error("  npm run seed:demo-group -- YOURCODE");
    process.exit(1);
  }

  console.log(`Seeding demo members into "${group.name}" (${group.invite_code})…`);

  const userIds = {};
  for (const member of DEMO_MEMBERS) {
    userIds[member.key] = await findOrCreateDemoUser(admin, member);
    const { error } = await admin.from("group_members").upsert(
      { group_id: group.id, user_id: userIds[member.key] },
      { onConflict: "group_id,user_id" },
    );
    if (error) throw new Error(`Member ${member.displayName}: ${error.message}`);
    console.log(`  ✓ ${member.displayName}`);
  }

  const today = todayDateKey();
  for (const member of DEMO_MEMBERS) {
    if (!member.checkedIn) continue;
    const { error } = await admin.from("daily_check_ins").upsert(
      { user_id: userIds[member.key], check_in_date: today },
      { onConflict: "user_id,check_in_date" },
    );
    if (error) throw new Error(`Check-in ${member.displayName}: ${error.message}`);
  }

  const { count } = await admin
    .from("group_messages")
    .select("id", { count: "exact", head: true })
    .eq("group_id", group.id);

  if ((count ?? 0) === 0) {
    const rows = SAMPLE_MESSAGES.map((m) => ({
      group_id: group.id,
      author_id: userIds[m.authorKey],
      body: m.body,
    }));
    const { error } = await admin.from("group_messages").insert(rows);
    if (error) {
      console.error("\n✗ Could not insert chat messages:", error.message);
      console.error(
        "  Run supabase/scripts/fix-group-messages.sql in Supabase SQL Editor, then re-run this script.",
      );
      process.exit(1);
    }
    console.log(`  ✓ ${rows.length} sample chat messages`);
  } else {
    console.log("  (Chat already has messages — skipped adding more)");
  }

  console.log(`
Done. Refresh http://127.0.0.1:3456/groups — you should see ~${DEMO_MEMBERS.length + 1} members (you + demo), check-ins, and chat.

Demo logins (optional, for testing another device):
  Email: stride-demo-maria@example.com  Password: ${DEMO_PASSWORD}
  (same pattern for jordan, alex, sam, riley)
`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
