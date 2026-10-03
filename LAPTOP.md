# Use Streakly on your laptop (no cloud preview)

The Cloud Agent `trycloudflare.com` links **expire**. On your Mac, run the app locally instead.

## One-time setup (~5 min)

### 1. Clone (if you have not already)

```bash
curl -fsSL https://downloads.cursor.com/origin/install.sh | sh
origin auth login
origin repo clone nathan-stone/stride
```

If `origin` is not found:

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

Browse repo: https://cursor.com/codebase/nathan-stone/stride (private)

### 2. Open in Cursor

**File → Open Folder** → your `stride` folder.

### 3. Environment file

Create **`.env.local`** in the project root with Supabase keys (same as cloud agent). See **`docs/supabase-auth-setup.md`**.

### 4. Install

In Cursor **Terminal**:

```bash
node scripts/laptop-setup.mjs
```

## Every time you use the app

```bash
npm run dev
```

Open **http://127.0.0.1:3000** in Chrome on the **same Mac**.

Keep the terminal open. Closing it stops the server — that is normal, not “getting kicked out” of your account.

## Permanent public URL (optional)

Use **Publish → Vercel** in Cursor, or see **`docs/permanent-hosting.md`**.
