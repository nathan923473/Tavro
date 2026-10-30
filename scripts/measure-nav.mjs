/**
 * Measure authenticated document navigation timings for main tabs.
 * Usage: node scripts/measure-nav.mjs [baseUrl]
 */
import { readFileSync } from "node:fs";
import { createServerClient } from "@supabase/ssr";

function loadEnvLocal() {
  const env = {};
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
}

async function signInCookieHeader(env) {
  const jar = new Map();
  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => [...jar.entries()].map(([name, value]) => ({ name, value })),
        setAll: (cookies) => {
          for (const c of cookies) jar.set(c.name, c.value);
        },
      },
    },
  );
  const { error } = await supabase.auth.signInWithPassword({
    email: "stride-demo-maria@example.com",
    password: "StrideDemo1!",
  });
  if (error) throw error;
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

async function timeGet(url, headers) {
  const started = performance.now();
  const res = await fetch(url, { headers, redirect: "manual" });
  const buf = await res.arrayBuffer();
  return {
    status: res.status,
    ms: Math.round(performance.now() - started),
    bytes: buf.byteLength,
  };
}

async function main() {
  const base = (process.argv[2] || "http://127.0.0.1:3457").replace(/\/$/, "");
  const env = loadEnvLocal();
  const cookie = await signInCookieHeader(env);
  const routes = ["/", "/groups", "/challenges", "/progress", "/profile"];

  console.log(`base=${base}`);
  console.log("=== document GET (3 samples / route) ===");
  const summary = {};
  for (const route of routes) {
    const samples = [];
    for (let i = 0; i < 3; i++) {
      const row = await timeGet(`${base}${route}`, {
        cookie,
        accept: "text/html",
      });
      samples.push(row.ms);
      if (row.status !== 200) {
        console.log(`${route} status=${row.status}`);
      }
    }
    const avg = Math.round(samples.reduce((a, b) => a + b, 0) / samples.length);
    summary[route] = { avg, samples };
    console.log(`${route.padEnd(12)} avg=${avg}ms  samples=${samples.join(",")}`);
  }
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
