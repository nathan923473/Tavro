/**
 * Click-to-visible shell time with RSC artificially delayed.
 * Proves the destination header paints before the slow server response.
 *
 * Usage: node scripts/measure-instant-shell.mjs http://127.0.0.1:43123
 */
import { chromium } from "playwright";

const base = (process.argv[2] || "http://127.0.0.1:43123").replace(/\/$/, "");
const RSC_DELAY_MS = 4000;

const shells = [
  ["/groups", "Private accountability groups"],
  ["/challenges", "Challenges"],
  ["/progress", "Progress"],
  ["/profile", "Profile"],
  ["/", "Today"],
];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  let armed = false;

  await page.route("**/*", async (route) => {
    const headers = route.request().headers();
    const isRsc = headers["rsc"] === "1" || headers["next-router-prefetch"] === "1";
    if (armed && isRsc) {
      await new Promise((r) => setTimeout(r, RSC_DELAY_MS));
    }
    await route.continue();
  });

  const coldStart = Date.now();
  await page.goto(base + "/", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.locator("nav[aria-label='Main navigation']").waitFor({ timeout: 30000 });
  const coldMs = Date.now() - coldStart;
  armed = true;

  const results = [];
  for (const [href, title] of shells) {
    const started = Date.now();
    await page.locator(`nav[aria-label="Main navigation"] a[href="${href}"]`).click();
    await page.getByRole("heading", { name: title, exact: true }).waitFor({ timeout: 2000 });
    const ms = Date.now() - started;
    results.push({ href, title, clickToHeadingMs: ms });
  }

  console.log(JSON.stringify({ coldDocumentMs: coldMs, rscDelayMs: RSC_DELAY_MS, results }, null, 2));
  const slow = results.filter((r) => r.clickToHeadingMs > 500);
  await browser.close();
  if (slow.length) {
    console.error("Shell slower than 500ms:", slow);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});