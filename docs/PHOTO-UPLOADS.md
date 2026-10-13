# Profile & challenge photos

## One-time Supabase setup (required)

### Profile pictures only

1. Supabase → **SQL Editor** → **New query**.
2. Paste the **entire** file **`supabase/scripts/profile-pictures-only.sql`**.
3. Click **Run**.

This adds `profiles.avatar_url` and the **avatars** storage bucket.

### Profile + creator challenge photos

Use **`supabase/migrations/009b_one_shot_fix_media.sql`** instead (includes challenge gallery buckets).

Verify locally:

```bash
npm run check:media
```

## Members — profile picture

1. **Profile** tab → **Profile picture** card.
2. **Upload photo** or pick one of the six styles.
3. Your photo appears on Profile, Home, and **private accountability group** member list.

You can also set a photo during **onboarding** (step “Add a profile picture”).

## Creators — challenge images

1. **Creator Studio** → **Challenge cover & gallery**, or publish a public challenge and use the photo uploader on the success screen.
2. Per challenge:
   - **Cover photo** — wide banner on the invite page
   - **Gallery photos** — grid on the challenge card

Community **banner** and **profile photo** for your public page: **Studio** → **Community avatar & banner** (or edit community).

## Troubleshooting

| Symptom | Fix |
|--------|-----|
| “Could not find avatar_url column” | Run **009b** SQL |
| “Bucket not found” | Run **009b** SQL |
| Upload works but image doesn’t save | Hard refresh; check Profile card for red error text |
| Challenge gallery insert fails | Run **009b**; confirm you own the challenge |

`.env.local` must include `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. No service role key is required for normal uploads.
