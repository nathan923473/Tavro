/**
 * Patches common old "Groups" UI copy → "private accountability group(s)".
 * Run on your Mac if git pull did not bring agent commits yet:
 *   node scripts/apply-pag-branding.mjs
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { cwd } from "node:process";

const root = cwd();

const replacements = [
  {
    path: "src/app/(app)/groups/page.tsx",
    pairs: [
      ['title: "Groups"', 'title: "Private accountability groups"'],
      ['title="Groups"', 'title="Private accountability groups"'],
      [
        'subtitle="Small private circles · optional"',
        'subtitle="Member-only private accountability groups · 4–8 people"',
      ],
      [
        'subtitle="Small circles, private encouragement"',
        'subtitle="Member-only private accountability groups · 4–8 people"',
      ],
      ['export const metadata = { title: "Groups" };', 'export const metadata = { title: "Private accountability groups" };'],
    ],
  },
  {
    path: "src/components/groups/groups-interactive.tsx",
    pairs: [
      ['Create a group', "Create a private accountability group"],
      ['Create group', "Create private accountability group"],
      ['Join with invite code', "Join a private accountability group"],
      ['Join group', "Join private accountability group"],
      ['Start a group', "Start a private accountability group"],
      ['Accountability groups', "Private accountability groups"],
      ['private group (4–8 people)', "private accountability group (4–8 people)"],
      ['You&apos;re not in a group', "You're not in a private accountability group yet"],
      ["You're not in a group", "You're not in a private accountability group yet"],
      ['Group chat', "Private accountability group chat"],
      ['Copy group invite', "Copy private accountability group invite"],
      ['Leave group', "Leave private accountability group"],
      [
        "Private groups of 4–8 people. Creators never see these chats or weigh-ins.",
        "Private accountability groups of 4–8 people. Creators never see these chats or weigh-ins.",
      ],
    ],
  },
  {
    path: "src/components/layout/bottom-nav.tsx",
    pairs: [
      ['label: "Groups"', 'label: "P.A. groups"'],
    ],
  },
];

let changed = 0;

for (const { path, pairs } of replacements) {
  const full = `${root}/${path}`;
  if (!existsSync(full)) {
    console.warn(`⚠ Skip (missing): ${path}`);
    continue;
  }
  let text = readFileSync(full, "utf8");
  let fileChanged = false;
  for (const [from, to] of pairs) {
    if (text.includes(from)) {
      text = text.split(from).join(to);
      fileChanged = true;
      console.log(`✓ ${path}: "${from.slice(0, 40)}…" → updated`);
    }
  }
  if (fileChanged) {
    writeFileSync(full, text);
    changed += 1;
  }
}

if (changed === 0) {
  console.log(
    "No old strings found — either already branded or files differ. Open src/app/(app)/groups/page.tsx and confirm the title says Private accountability groups.",
  );
} else {
  console.log(`\nUpdated ${changed} file(s). Restart: npm run stop:dev && npm run dev:alt`);
}
