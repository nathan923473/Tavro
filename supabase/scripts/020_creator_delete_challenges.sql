-- Paste in Supabase SQL Editor so creators can delete their own challenges from Studio.

drop policy if exists "Creators delete own challenges" on public.challenges;

create policy "Creators delete own challenges"
  on public.challenges for delete
  using (auth.uid() = created_by);
