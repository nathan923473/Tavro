-- Allow challenge creators to delete challenges they own (cascades to participants, schedule, etc.).

drop policy if exists "Creators delete own challenges" on public.challenges;

create policy "Creators delete own challenges"
  on public.challenges for delete
  using (auth.uid() = created_by);
