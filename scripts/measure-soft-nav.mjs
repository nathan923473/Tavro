/**
 * Measure client-side soft navigations between main tabs in Chromium.
 * Waits for content that exists only after data loads (not Suspense fallbacks).
 * Usage: node scripts/measure-soft-nav.mjs [baseUrl]
 */
import { readFileSync } from "node:fs";
import { createServerClient } from "@supabase/ssr";
import { chromium } from "playwright";

function loadEnvLocal() {
  const env = {};
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
}

async function authCookies(env, baseUrl) {
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
  const origin = new URL(baseUrl).origin;
  return [...jar.entries()].map(([name, value]) => ({
    name,
    value,
    url: origin,
  }));
}

/** Markers present only after server data renders (not in RouteFallback). */
const READY = {
  "/": "Set up habits or join a challenge",
  "/progress": "Your private space",
  "/challenges": "100% free at launch",
  "/groups": "Create your group",
  "/profile": "Grow with referrals",
};

async function main() {
  const base = (process.argv[2] || "http://127.0.0.1:3457").replace(/\/$/, "");
  const env = loadEnvLocal();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  await context.addCookies(await authCookies(env, base));
  const page = await context.newPage();

  await page.goto(base + "/", { waitUntil: "networkidle" });
  await page.getByText(READY["/"], { exact: false }).first().waitFor({ timeout: 20000 });

  const hops = [
    ["/", "/progress"],
    ["/progress", "/challenges"],
    ["/challenges", "/groups"],
    ["/groups", "/profile"],
    ["/profile", "/"],
    ["/", "/progress"],
    ["/progress", "/"],
  ];

  const results = [];
  for (const [from, to] of hops) {
    const marker = READY[to];
    const tShell = Date.now();
    await page.click(`nav[aria-label="Main navigation"] a[href="${to}"]`);
    // Shell: destination title in h1 (fallback or real)
    await page.waitForFunction(() => {
      const h1 = document.querySelector("h1");
      return Boolean(h1?.textContent?.trim());
    }, null, { timeout: 15000 });
    const shellMs = Date.now() - tShell;

    await page.getByText(marker, { exact: false }).first().waitFor({ timeout: 20000 });
    const contentMs = Date.now() - tShell;

    results.push({ from, to, shellMs, contentMs });
    console.log(
      `${from} -> ${to}: shell=${shellMs}ms content=${contentMs}ms`,
    );
    await page.waitForTimeout(50);
  }

  console.log(JSON.stringify(results, null, 2));
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
