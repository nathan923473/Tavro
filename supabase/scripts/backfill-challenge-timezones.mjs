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

async function main() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const { data: rows, error } = await supabase
    .from("challenges")
    .select("id, start_date, end_date, created_by, start_at, challenge_timezone")
    .is("start_at", null);

  if (error) {
    console.error("Fetch failed:", error.message);
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
