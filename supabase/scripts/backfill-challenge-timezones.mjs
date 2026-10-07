#!/usr/bin/env node
/**
 * Backfill challenges.start_at, end_at, challenge_timezone (legacy date-only rows).
 * Requires: 021 migration applied. Uses SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from env.
 */
import { createClient } from "@supabase/supabase-js";
import { addDays } from "date-fns";
import { TZDate } from "@date-fns/tz";

const DEFAULT_TZ = "Australia/Melbourne";

function isValidIana(tz) {
  if (!tz || typeof tz !== "string" || !tz.includes("/")) return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

function parts(dateKey) {
  const [y, m, d] = dateKey.split("-").map(Number);
  return { y, m: m - 1, d };
}

function midnightUtc(dateKey, timeZone) {
  const { y, m, d } = parts(dateKey);
  return new Date(new TZDate(y, m, d, 0, 0, 0, timeZone).getTime());
}

function exclusiveEndUtc(endDateKey, timeZone) {
  const { y, m, d } = parts(endDateKey);
  const endLocal = new TZDate(y, m, d, 0, 0, 0, timeZone);
  const next = addDays(endLocal, 1);
  return new Date(
    new TZDate(next.getFullYear(), next.getMonth(), next.getDate(), 0, 0, 0, timeZone).getTime(),
  );
}

function normalizeSupabaseUrl(raw) {
  const trimmed = String(raw).trim().replace(/^["']|["']$/g, "");
  let url = trimmed.replace(/\/+$/, "");
  if (url.endsWith("/rest/v1")) {
    url = url.slice(0, -"/rest/v1".length).replace(/\/+$/, "");
  }
  if (!/^https?:\/\/.+/i.test(url)) {
    throw new Error(
      'SUPABASE_URL must be the Project URL, e.g. https://abcdefghijklmnop.supabase.co (from Supabase → Project Settings → API).',
    );
  }
  if (/supabase\.com\/dashboard|\/project\//i.test(url)) {
    throw new Error(
      "That looks like a dashboard link. Use Project URL from Settings → API (https://YOUR_REF.supabase.co), not the browser address bar.",
    );
  }
  if (url.includes(" ") || url.includes("\n")) {
    throw new Error("SUPABASE_URL contains spaces or line breaks — check your paste and quotes.");
  }
  return url;
}

async function main() {
  const urlRaw = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const keyRaw = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!urlRaw || !keyRaw) {
    console.error("Set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }

  let url;
  try {
    url = normalizeSupabaseUrl(urlRaw);
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e));
    process.exit(1);
  }

  const key = String(keyRaw).trim().replace(/^["']|["']$/g, "");
  if (!key.startsWith("eyJ")) {
    console.error(
      "SUPABASE_SERVICE_ROLE_KEY should be the long JWT from Settings → API → service_role (secret), not the anon key or a database password.",
    );
    process.exit(1);
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const { data: rows, error } = await supabase
    .from("challenges")
    .select("id, start_date, end_date, created_by, start_at, challenge_timezone")
    .is("start_at", null);

  if (error) {
    console.error("Fetch failed:", error.message);
    if (/invalid path/i.test(error.message)) {
      console.error(
        "\nUsually this means SUPABASE_URL is wrong. It must be exactly:\n  https://YOUR_PROJECT_REF.supabase.co\nCopy it from Supabase → Project Settings → API → Project URL.\nDo not add /rest/v1 or paste the dashboard URL.",
      );
    }
    process.exit(1);
  }

  const list = rows ?? [];
  console.log(`Found ${list.length} challenge(s) needing backfill.`);

  const creatorIds = [...new Set(list.map((r) => r.created_by))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, timezone")
    .in("id", creatorIds.length ? creatorIds : ["00000000-0000-0000-0000-000000000000"]);

  const tzByCreator = new Map((profiles ?? []).map((p) => [p.id, p.timezone]));

  let ok = 0;
  let fallbackMelbourne = 0;
  let creatorTz = 0;
  const failures = [];

  for (const ch of list) {
    let Z = tzByCreator.get(ch.created_by);
    if (isValidIana(Z)) {
      creatorTz += 1;
    } else {
      Z = DEFAULT_TZ;
      fallbackMelbourne += 1;
    }

    try {
      const startAt = midnightUtc(ch.start_date, Z);
      const endAt = exclusiveEndUtc(ch.end_date, Z);
      const { error: upErr } = await supabase
        .from("challenges")
        .update({
          challenge_timezone: Z,
          start_at: startAt.toISOString(),
          end_at: endAt.toISOString(),
          schedule_mode: "fixed_instant",
        })
        .eq("id", ch.id);

      if (upErr) {
        failures.push({ id: ch.id, error: upErr.message });
      } else {
        ok += 1;
      }
    } catch (e) {
      failures.push({ id: ch.id, error: e instanceof Error ? e.message : String(e) });
    }
  }

  const { count: nullStart } = await supabase
    .from("challenges")
    .select("*", { count: "exact", head: true })
    .is("start_at", null);

  console.log(
    JSON.stringify(
      {
        backfilled: ok,
        creatorTimezoneUsed: creatorTz,
        melbourneFallback: fallbackMelbourne,
        failures,
        remainingNullStartAt: nullStart ?? null,
      },
      null,
      2,
    ),
  );

  if (failures.length) process.exit(1);
}

main();
