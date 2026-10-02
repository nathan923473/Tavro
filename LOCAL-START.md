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

## Still stuck?

```bash
npm run doctor
```

Send a screenshot of the terminal after `npm run fresh` and the browser error page.
