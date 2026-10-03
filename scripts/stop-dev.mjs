import { execSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { cwd } from "node:process";

function killPort(port) {
  const isWin = process.platform === "win32";
  try {
    if (isWin) {
      execSync(
        `for /f "tokens=5" %a in ('netstat -aon ^| findstr :${port}') do taskkill /F /PID %a`,
        { stdio: "ignore", shell: "cmd.exe" },
      );
      console.log(`• Freed port ${port}`);
      return;
    }
    // macOS + Linux: lsof is available on Mac; fuser on many Linux images
    try {
      const pids = execSync(`lsof -ti tcp:${port}`, { encoding: "utf8" }).trim();
      if (pids) {
        for (const pid of pids.split("\n").filter(Boolean)) {
          execSync(`kill -9 ${pid}`, { stdio: "ignore" });
        }
        console.log(`• Freed port ${port}`);
        return;
      }
    } catch {
      /* no process */
    }
    try {
      execSync(`fuser -k ${port}/tcp 2>/dev/null`, { stdio: "ignore" });
      console.log(`• Freed port ${port}`);
    } catch {
      console.log(`• Port ${port} was not in use`);
    }
  } catch {
    console.log(`• Port ${port} was not in use`);
  }
}

console.log("Stopping Streakly dev servers…\n");

for (const port of [3000, 3456, 43123]) {
  killPort(port);
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
