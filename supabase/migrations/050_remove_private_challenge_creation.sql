-- Stop members from creating invite-only (private) challenges; creators use public challenges only.

drop policy if exists "Members create private challenges" on public.challenges;

drop policy if exists "Approved creators create public challenges" on public.challenges;
create policy "Approved creators create public challenges"
  on public.challenges for insert
  with check (
    auth.uid() = created_by
    and visibility = 'public'
    and public.is_approved_creator(auth.uid())
  );
