-- Admin-only test creator access.
-- Reuses profiles.creator_status (approved / not) and is_test_account.
-- Does not approve public applications, delete challenges, communities,
-- accountability groups, or replace existing RLS policies.

alter table public.profiles
  add column if not exists is_test_account boolean not null default false;

-- Keep the trusted-RPC flag from 039, and stop members flipping is_test_account.
create or replace function public.protect_profile_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_setting('app.allow_privileged_profile_update', true) = 'true' then
    return new;
  end if;

  if auth.uid() is null then
    return new;
  end if;
  if public.is_admin(auth.uid()) then
    return new;
  end if;
  if new.creator_status is distinct from old.creator_status then
    raise exception 'cannot change creator_status';
  end if;
  if new.is_admin is distinct from old.is_admin then
    raise exception 'cannot change is_admin';
  end if;
  if new.is_creator is distinct from old.is_creator then
    raise exception 'cannot change is_creator';
  end if;
  if new.is_test_account is distinct from old.is_test_account then
    raise exception 'cannot change is_test_account';
  end if;
  return new;
end;
$$;

create or replace function public.admin_lookup_account_by_email(p_email text)
returns table (
  user_id uuid,
  email text,
  display_name text,
  creator_status public.creator_status,
  is_test_account boolean,
  is_creator boolean,
  is_admin boolean,
  has_open_application boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_email text := lower(trim(coalesce(p_email, '')));
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'not authorized';
  end if;

  if length(v_email) < 3
     or length(v_email) > 320
     or position('@' in v_email) = 0 then
    raise exception 'valid email required';
  end if;

  return query
  select
    p.id,
    u.email::text,
    p.display_name,
    p.creator_status,
    p.is_test_account,
    p.is_creator,
    p.is_admin,
    exists (
      select 1
      from public.creator_applications a
      where a.user_id = p.id
        and a.status in ('pending', 'pending_verification', 'awaiting_review')
    )
  from public.profiles p
  join auth.users u on u.id = p.id
  where lower(u.email) = v_email
  limit 1;
end;
$$;

create or replace function public.admin_list_test_creator_accounts()
returns table (
  user_id uuid,
  email text,
  display_name text,
  creator_status public.creator_status,
  is_test_account boolean,
  is_creator boolean,
  is_admin boolean,
  has_open_application boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
#variable_conflict use_column
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'not authorized';
  end if;

  return query
  select
    p.id,
    u.email::text,
    p.display_name,
    p.creator_status,
    p.is_test_account,
    p.is_creator,
    p.is_admin,
    exists (
      select 1
      from public.creator_applications a
      where a.user_id = p.id
        and a.status in ('pending', 'pending_verification', 'awaiting_review')
    )
  from public.profiles p
  left join auth.users u on u.id = p.id
  where p.is_test_account
  order by lower(coalesce(u.email, p.display_name, p.id::text))
  limit 200;
end;
$$;

create or replace function public.admin_grant_test_creator_access(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  prof public.profiles%rowtype;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'not authorized';
  end if;
  if p_user_id is null then
    raise exception 'account required';
  end if;

  select * into prof
  from public.profiles
  where id = p_user_id
  for update;

  if not found then
    raise exception 'account not found';
  end if;

  -- Leave real creators on the public application path.
  if prof.creator_status = 'approved' and prof.is_test_account = false then
    raise exception 'account is already an approved creator';
  end if;

  perform set_config('app.allow_privileged_profile_update', 'true', true);

  update public.profiles
  set
    is_test_account = true,
    creator_status = 'approved',
    is_creator = true,
    updated_at = now()
  where id = p_user_id;
end;
$$;

create or replace function public.admin_revoke_test_creator_access(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  prof public.profiles%rowtype;
  next_status public.creator_status := 'none';
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'not authorized';
  end if;
  if p_user_id is null then
    raise exception 'account required';
  end if;

  select * into prof
  from public.profiles
  where id = p_user_id
  for update;

  if not found then
    raise exception 'account not found';
  end if;
  if prof.is_test_account is not true then
    raise exception 'only test accounts can have creator access revoked here';
  end if;
  if prof.creator_status <> 'approved' and prof.is_creator = false then
    raise exception 'account does not have creator access';
  end if;

  if exists (
    select 1
    from public.creator_applications
    where user_id = p_user_id
      and status in ('pending', 'pending_verification', 'awaiting_review')
  ) then
    next_status := 'pending';
  elsif exists (
    select 1
    from public.creator_applications
    where user_id = p_user_id
      and status = 'rejected'
  ) and not exists (
    select 1
    from public.creator_applications
    where user_id = p_user_id
      and status = 'approved'
  ) then
    next_status := 'rejected';
  end if;

  perform set_config('app.allow_privileged_profile_update', 'true', true);

  update public.profiles
  set
    creator_status = next_status,
    is_creator = false,
    updated_at = now()
  where id = p_user_id;
end;
$$;

revoke all on function public.admin_lookup_account_by_email(text) from public;
grant execute on function public.admin_lookup_account_by_email(text) to authenticated;

revoke all on function public.admin_list_test_creator_accounts() from public;
grant execute on function public.admin_list_test_creator_accounts() to authenticated;

revoke all on function public.admin_grant_test_creator_access(uuid) from public;
grant execute on function public.admin_grant_test_creator_access(uuid) to authenticated;

revoke all on function public.admin_revoke_test_creator_access(uuid) from public;
grant execute on function public.admin_revoke_test_creator_access(uuid) to authenticated;

comment on function public.admin_grant_test_creator_access(uuid) is
  'Admin-only. Marks one account as a test account and sets creator_status=approved. Does not change creator_applications.';

comment on function public.admin_revoke_test_creator_access(uuid) is
  'Admin-only. Removes creator access from a test account. Does not delete challenges, communities, groups, or applications.';
