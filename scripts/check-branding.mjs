import { readFileSync, existsSync } from "node:fs";
import { cwd } from "node:process";

const files = [
  "src/app/(app)/groups/page.tsx",
  "src/components/groups/groups-interactive.tsx",
  "src/lib/copy/accountability-groups.ts",
  "src/components/layout/bottom-nav.tsx",
];

const mustInclude = /private accountability group|ACCOUNTABILITY_GROUP/;
const mustNotInclude = ["title=\"Groups\"", 'label: "Groups"', "Create group"];

let ok = true;

for (const file of files) {
  const path = `${cwd()}/${file}`;
  if (!existsSync(path)) {
    console.error(`✗ Missing ${file}`);
    ok = false;
    continue;
  }
  const text = readFileSync(path, "utf8");
  if (!mustInclude.test(text) && file !== "src/components/layout/bottom-nav.tsx") {
    console.error(`✗ ${file} — does not mention "${mustInclude}"`);
    ok = false;
  }
  for (const bad of mustNotInclude) {
    if (text.includes(bad)) {
      console.error(`✗ ${file} — still contains old UI: ${bad}`);
      ok = false;
    }
  }
}

if (ok) {
  console.log("✓ Branding OK — private accountability groups copy is in your files.");
  console.log("  Restart npm run dev:alt and hard-refresh the browser.");
} else {
  console.error("\n→ Pull/merge Cloud Agent changes or copy files from the latest agent commit.");
  process.exit(1);
}
