-- Run this ONLY if 007_one_shot_fix_groups.sql failed with "policy already exists" (42710).
-- 1. New SQL tab → delete ALL text in the editor
-- 2. Paste this entire file → Run → Success
-- 3. Paste supabase/migrations/007_one_shot_fix_groups.sql → Run once

drop policy if exists "Groups readable by members" on public.accountability_groups;
drop policy if exists "Group members readable by co-members" on public.group_members;
drop policy if exists "Group messages readable by members" on public.group_messages;
drop policy if exists "Group members post messages" on public.group_messages;
drop policy if exists "Group co-members read profile names" on public.profiles;

drop function if exists public.is_group_member(uuid, uuid) cascade;
drop function if exists public.shares_group_with(uuid, uuid) cascade;
