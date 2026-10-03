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

Use the **Terminal** in Cursor (bottom panel), in the Streakly folder:

```bash
npm run stop:dev
npm install
npm run dev
```

Wait for **`✓ Ready`**, then open **http://127.0.0.1:3000** in Chrome or Safari.

| Try this | When |
|----------|------|
| `npm run dev:alt` | Port 3000 is busy → use **http://127.0.0.1:3456** |
| `npm run dev:webpack` | Turbopack error on your Mac |
| `npm run doctor` | Check folder, Node, and ports |

**Not** for daily use: `npm start` only works after `npm run build`. For development always use **`npm run dev`**.

If Cursor shows “failed to start server” on a **Preview** button, ignore it and use the terminal steps above plus the browser URL.

---

## Still stuck?

```bash
npm run doctor
```

Copy the **last 10 lines** from the terminal after `npm run dev` (not just the popup message).
