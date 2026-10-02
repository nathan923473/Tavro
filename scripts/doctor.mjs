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

if (!existsSync(`${cwd()}/package.json`)) {
  console.error("✗ Run this from the project folder (where package.json lives).");
  console.error(`  Current folder: ${cwd()}`);
  process.exit(1);
}
console.log("✓ package.json found");

const nodeVersion = process.version;
console.log(`✓ Node ${nodeVersion}`);

for (const port of ports) {
  const status = await checkPort(port);
  if (status === "in_use") {
    console.log(`• Port ${port} is IN USE — open http://localhost:${port} or free the port`);
  } else {
    console.log(`• Port ${port} is free — npm run dev can use it`);
  }
}

console.log(`
Next steps:
  npm install
  npm run dev          → http://localhost:3000
  npm run dev:alt      → http://localhost:3456 (if 3000 is busy)
`);
