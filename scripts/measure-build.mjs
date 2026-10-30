#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

function dirSize(p) {
  let s = 0;
  try {
    for (const e of fs.readdirSync(p, { withFileTypes: true })) {
      const f = path.join(p, e.name);
      if (e.isDirectory()) s += dirSize(f);
      else s += fs.statSync(f).size;
    }
  } catch {
    /* missing */
  }
  return s;
}

function topChunks(chunksDir, n = 8) {
  const files = [];
  function walk(p) {
    try {
      for (const e of fs.readdirSync(p, { withFileTypes: true })) {
        const f = path.join(p, e.name);
        if (e.isDirectory()) walk(f);
        else if (f.endsWith(".js")) files.push({ name: path.basename(f), bytes: fs.statSync(f).size });
      }
    } catch {
      /* */
    }
  }
  walk(chunksDir);
  files.sort((a, b) => b.bytes - a.bytes);
  return files.slice(0, n);
}

const root = process.cwd();
const nextDir = path.join(root, ".next");
const chunks = path.join(nextDir, "static", "chunks");

const report = {
  measuredAt: new Date().toISOString(),
  clientChunksBytes: dirSize(chunks),
  serverAppBytes: dirSize(path.join(nextDir, "server", "app")),
  topClientChunks: topChunks(chunks),
};

console.log(JSON.stringify(report, null, 2));
