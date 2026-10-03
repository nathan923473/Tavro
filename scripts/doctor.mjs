import { existsSync } from "node:fs";
import { createConnection } from "node:net";
import { cwd } from "node:process";

const ports = [3000, 3456];

function checkPort(port) {
  return new Promise((resolve) => {
    const socket = createConnection({ port, host: "127.0.0.1" });
    socket.once("connect", () => {
      socket.end();
      resolve("in_use");
    });
    socket.once("error", () => resolve("free"));
  });
}

console.log("Streakly local setup check\n");

const root = cwd();
if (!existsSync(`${root}/package.json`)) {
  console.error("✗ Run this from the Streakly folder (where package.json lives).");
  console.error(`  Current folder: ${root}`);
  process.exit(1);
}
console.log("✓ package.json found");

if (!existsSync(`${root}/node_modules`)) {
  console.log("✗ node_modules missing — run:  npm install");
} else {
  console.log("✓ node_modules found");
}

console.log(`✓ Node ${process.version}`);
if (parseInt(process.version.slice(1), 10) < 18) {
  console.log("✗ Node 18+ required for Next.js 16");
}

for (const port of ports) {
  const status = await checkPort(port);
  if (status === "in_use") {
    console.log(`• Port ${port} is IN USE — run: npm run stop:dev`);
  } else {
    console.log(`• Port ${port} is free`);
  }
}

console.log(`
If "failed to start server" in the terminal:

  1. npm run stop:dev
  2. npm install
  3. npm run dev

Still failing? Try:

  npm run dev:alt      → http://127.0.0.1:3456
  npm run dev:webpack  → older bundler (if Turbopack crashes)

Do NOT use "npm start" until you have run "npm run build" once.
Use "npm run dev" for daily development.

Open the app at the URL shown after "Ready" (usually http://127.0.0.1:3000).
`);
