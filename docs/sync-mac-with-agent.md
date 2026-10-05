# Your Mac still shows old UI?

Cloud Agent commits often go to a **Cursor git remote**, not automatically to `github.com/nathan-stone/stride`.

If the Groups tab still says **"Groups"** / **"Create group"**, your Mac folder is **behind**.

## Fix in Cursor (recommended)

1. Open the **same project** on your Mac in Cursor.
2. Open **Source Control** (branch icon).
3. **Pull** or **merge** changes from the Cloud Agent branch, or use **Apply** on the agent’s file changes.
4. Restart: `npm run stop:dev && npm run dev:alt`
5. Hard refresh the browser (Cmd+Shift+R).

## Check you have the new branding

Run in the project folder:

```bash
npm run check:branding
```

You should see **✓ Branding OK**. If not, the files listed are still old.

## After sync, the Groups screen must show

- Page title: **Private accountability groups** (not "Groups")
- Bottom tab: **P.A. groups**
- Button: **Create private accountability group**
