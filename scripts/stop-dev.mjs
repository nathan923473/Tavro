import { execSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { cwd } from "node:process";

console.log("Stopping Streakly dev servers…\n");

for (const port of [3000, 3456, 43123]) {
  try {
    execSync(`fuser -k ${port}/tcp 2>/dev/null`, { stdio: "ignore" });
    console.log(`• Freed port ${port}`);
  } catch {
    console.log(`• Port ${port} was not in use`);
  }
}

try {
  execSync("pkill -f 'next dev' 2>/dev/null", { stdio: "ignore" });
} catch {
  /* none running */
}

const lock = `${cwd()}/.next/dev/lock`;
if (existsSync(lock)) {
  rmSync(lock);
  console.log("• Removed stale .next/dev/lock");
}

console.log("\nDone. Now run:  npm run dev\n");
