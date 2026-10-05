# Run Streakly locally (simple steps)

Use this in **Cursor’s terminal** for this project (`/workspace`), or on your Mac/PC inside the cloned folder.

## One-time setup

```bash
npm install
```

## Every time you open the app

### Step 1 — Stop old servers (fixes “port in use” / 43123 errors)

```bash
npm run stop:dev
```

### Step 2 — Start the app (one terminal, leave it open)

```bash
npm run dev
```

Wait until you see:

```text
✓ Ready
Local: http://127.0.0.1:3000
```

### Step 3 — Open the app in the browser

Copy this into the browser address bar on **the same machine** as the terminal:

```text
http://127.0.0.1:3000
```

Or click the `http://127.0.0.1:3000` link in the terminal if your terminal supports it.

---

## Shortcut (steps 1 + 2 combined)

```bash
npm run fresh
```

Then open **http://127.0.0.1:3000**.

---

## Rules

| Do | Don’t |
|----|--------|
| Run `npm` commands in the **terminal** | Paste commands into `package.json` |
| Use **one** terminal with `npm run dev` running | Run `dev`, `dev:alt`, and `fresh` all at once |
| Open **127.0.0.1:3000** on the same computer | Expect your phone’s browser to open the agent’s localhost |

---

## “Failed to start server”

Almost always **port 3000 is already in use** (an old `npm run dev` still running).

### Fix A — use port 3456 (try this first)

In Cursor **Terminal**, run **one line**:

```bash
npm run stop:dev && npm run dev:alt
```

Then open **http://127.0.0.1:3456** (not 3000).

### Fix B — free port 3000, then start

```bash
npm run stop:dev
npm run dev
```

Wait for **`✓ Ready`**, then **http://127.0.0.1:3000**.

### Fix C — Mac still says “address already in use”

```bash
lsof -ti tcp:3000 | xargs kill -9 2>/dev/null; npm run dev
```

| Try this | When |
|----------|------|
| `npm run dev:alt` + **127.0.0.1:3456** | Port 3000 busy (most common) |
| `npm run dev:webpack` | Turbopack error on your Mac |
| `npm run doctor` | Check folder, Node, and ports |
| `npm install` | “Cannot find module” errors |

**Not** for daily use: `npm start` only works after `npm run build`. For development always use **`npm run dev`**.

If Cursor shows “failed to start server” on a **Preview** button, ignore it and use the terminal steps above plus the browser URL.

---

## Log in doesn’t work

Do these in order:

1. **`.env.local`** in the stride folder must have your Supabase **URL** and **anon key** (Project Settings → API). Not empty, not from a different project.
2. **Restart** the dev server after any `.env.local` change (`Ctrl+C`, then `npm run dev:alt` again).
3. Open the app on the **same port** as the terminal (**3456** if you used `dev:alt`).
4. Supabase → **Authentication → Users** — is your email listed? If not, use **Sign up** in the app (not Log in).
5. Supabase → **Authentication → Providers → Email** → turn **OFF** “Confirm email”.
6. Supabase → **Authentication → URL configuration** → add `http://127.0.0.1:3456/**` to Redirect URLs.
7. In terminal: `npm run check:auth` — if it fails, follow the message (often run migration **003**).

On the Log in page, read the **red text** under the button — it tells you wrong password vs setup issue.

---

## Still stuck?

```bash
npm run doctor
```

Copy the **last 10 lines** from the terminal after `npm run dev` (not just the popup message).
