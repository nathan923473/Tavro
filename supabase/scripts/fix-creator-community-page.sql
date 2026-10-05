-- Fix creator community page + discover list (run once in Supabase SQL Editor).

-- Needed for community page social links
alter table public.creator_communities
  add column if not exists social_links jsonb not null default '[]'::jsonb;

-- Let anyone see display names of approved creators (public community pages)
drop policy if exists "Public read creator community owner names" on public.profiles;
create policy "Public read creator community owner names"
  on public.profiles for select
  using (
    exists (
      select 1
      from public.creator_communities cc
      where cc.owner_id = profiles.id
    )
  );

-- Challenge list fields used in Discover tab
alter table public.challenges
  add column if not exists focus_areas text[] not null default '{}';
