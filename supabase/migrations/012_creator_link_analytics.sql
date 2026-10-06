-- Track outbound creator link clicks (aggregate + recent events for charts).

alter table public.creator_links
  add column if not exists click_count int not null default 0;

create table if not exists public.creator_link_click_events (
  id uuid primary key default gen_random_uuid(),
  link_id uuid not null references public.creator_links (id) on delete cascade,
  clicked_at timestamptz not null default now()
);

create index if not exists creator_link_click_events_link_idx
  on public.creator_link_click_events (link_id, clicked_at desc);

alter table public.creator_link_click_events enable row level security;

create policy "Creators read own link click events"
  on public.creator_link_click_events for select
  using (
    exists (
      select 1 from public.creator_links cl
      join public.creator_communities cc on cc.id = cl.community_id
      where cl.id = link_id and cc.owner_id = auth.uid()
    )
  );

create or replace function public.record_creator_link_click(p_link_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  dest text;
begin
  select url into dest
  from public.creator_links
  where id = p_link_id and is_public = true;

  if dest is null or length(trim(dest)) = 0 then
    return null;
  end if;

  update public.creator_links
  set click_count = click_count + 1
  where id = p_link_id;

  insert into public.creator_link_click_events (link_id)
  values (p_link_id);

  return dest;
end;
$$;

revoke all on function public.record_creator_link_click(uuid) from public;
grant execute on function public.record_creator_link_click(uuid) to anon, authenticated;
