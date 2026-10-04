#!/bin/bash
# Double-click this file in Finder (Mac) to update and start the app.
# First time: right-click → Open (macOS may block unknown scripts once).

set -e
cd "$(dirname "$0")"

echo ""
echo "=== Streakly / Stride local dev ==="
echo "Folder: $(pwd)"
echo ""

if ! command -v git >/dev/null 2>&1; then
  echo "Git is not installed. Install Xcode Command Line Tools first."
  read -r -p "Press Enter to close…"
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "Node/npm not found. Install Node 18+ from https://nodejs.org"
  read -r -p "Press Enter to close…"
  exit 1
fi

if [ ! -f package.json ]; then
  echo "ERROR: package.json not found. Open the stride project folder, not a subfolder."
  read -r -p "Press Enter to close…"
  exit 1
fi

echo "→ Pulling latest code from GitHub…"
git pull origin main || {
  echo ""
  echo "git pull failed. If this folder was not cloned from GitHub, download the latest"
  echo "code from your repo or ask for help with the git error above."
  read -r -p "Press Enter to close…"
  exit 1
}

if [ ! -d node_modules ]; then
  echo "→ Installing dependencies (first time only)…"
  npm install
fi

echo "→ Stopping any old dev server…"
npm run stop:dev 2>/dev/null || true

echo ""
echo "→ Starting app at http://127.0.0.1:3000"
echo "   Keep this window open. Press Ctrl+C to stop."
echo ""

npm run dev
