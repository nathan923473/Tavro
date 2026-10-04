# Start the app on your Mac (no Terminal typing)

## One-time setup

1. Make sure this folder is your **stride** project from GitHub (with `package.json` inside).
2. If you never installed dependencies: open Terminal once, `cd` into this folder, run `npm install`.

## Every time you want to run the app

1. In **Finder**, open your **stride** folder.
2. **Double-click** `start-dev.command`.
3. If macOS says it cannot open the file: **right-click** `start-dev.command` → **Open** → **Open** again.
4. A Terminal window opens, pulls latest code, and starts the server.
5. In your browser go to **http://127.0.0.1:3000** → **Profile** for profile photo.

Leave the Terminal window open while you use the app.

## Supabase photos (separate, in the browser)

1. Go to [supabase.com](https://supabase.com) → your project → **SQL Editor**.
2. Open file `supabase/migrations/009b_one_shot_fix_media.sql` from this project in Cursor.
3. Copy all → paste in SQL Editor → **Run**.

That is **not** done by `start-dev.command` — only in Supabase.
