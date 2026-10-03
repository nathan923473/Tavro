-- STEP 2 of 2 — Run AFTER 005a_application_status_enum_values.sql
-- Requires: 002_member_creator_accounts.sql

create extension if not exists "pgcrypto" with schema extensions;

do $m$
begin
  create type public.verification_method as enum ('bio', 'dm', 'admin_manual');
exception
  when duplicate_object then null;
end $m$;

do $m$
begin
  create type public.verification_state as enum ('pending', 'verified', 'expired', 'failed');
exception
  when duplicate_object then null;
end $m$;

alter table public.creator_applications
  add column if not exists verification_code text,
  add column if not exists verification_code_expires_at timestamptz,
  add column if not exists verification_state public.verification_state,
  add column if not exists verification_method public.verification_method,
  add column if not exists verification_verified_at timestamptz,
  add column if not exists verification_checked_at timestamptz,
  add column if not exists dm_verification_requested_at timestamptz;

update public.creator_applications
set verification_state = 'pending'
where verification_state is null;

alter table public.creator_applications
  alter column verification_state set default 'pending';

do $m$
begin
  alter table public.creator_applications
    alter column verification_state set not null;
exception
  when others then null;
end $m$;

comment on column public.creator_applications.social_link is 'Required public profile URL for ownership verification';

create unique index if not exists creator_applications_verification_code_unique
  on public.creator_applications (verification_code)
  where verification_code is not null;

drop index if exists public.creator_applications_one_pending;
drop index if exists public.creator_applications_one_open;

create unique index if not exists creator_applications_one_open
  on public.creator_applications (user_id)
  where status in (
    'pending',
    'pending_verification',
    'awaiting_review'
  );

create or replace function public.protect_profile_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
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
  return new;
end;
$$;

drop trigger if exists protect_profile_privileged_columns on public.profiles;
create trigger protect_profile_privileged_columns
  before update on public.profiles
  for each row execute function public.protect_profile_privileged_columns();

create or replace function public.generate_creator_verification_code()
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  candidate text;
  tries int := 0;
begin
  loop
    tries := tries + 1;
    if tries > 20 then
      raise exception 'could not generate verification code';
    end if;
    candidate := 'STREAKLY-' || upper(encode(extensions.gen_random_bytes(4), 'hex'));
    exit when not exists (
      select 1 from public.creator_applications where verification_code = candidate
    );
  end loop;
  return candidate;
end;
$$;

revoke all on function public.generate_creator_verification_code() from public;
grant execute on function public.generate_creator_verification_code() to authenticated;

create or replace function public.submit_creator_application(
  p_display_name text,
  p_pitch text,
  p_social_link text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  app_id uuid;
  code text;
  prof public.profiles%rowtype;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  if p_display_name is null or length(trim(p_display_name)) < 2 then
    raise exception 'display name required';
  end if;
  if p_pitch is null or length(trim(p_pitch)) < 10 then
    raise exception 'pitch required';
  end if;
  if p_social_link is null or length(trim(p_social_link)) < 8 then
    raise exception 'social link required';
  end if;
  if p_social_link !~* '^https?://' then
    raise exception 'social link must be a valid URL';
  end if;

  select * into prof from public.profiles where id = uid;
  if prof.creator_status = 'approved' then
    raise exception 'already approved creator';
  end if;

  if exists (
    select 1 from public.creator_applications
    where user_id = uid
      and status in ('pending', 'pending_verification', 'awaiting_review')
  ) then
    raise exception 'open application already exists';
  end if;

  code := public.generate_creator_verification_code();

  insert into public.creator_applications (
    user_id,
    display_name,
    pitch,
    social_link,
    status,
    verification_code,
    verification_code_expires_at,
    verification_state
  ) values (
    uid,
    trim(p_display_name),
    trim(p_pitch),
    trim(p_social_link),
    'pending_verification',
    code,
    now() + interval '48 hours',
    'pending'
  )
  returning id into app_id;

  update public.profiles
  set creator_status = 'pending', updated_at = now()
  where id = uid;

  return app_id;
end;
$$;

grant execute on function public.submit_creator_application(text, text, text) to authenticated;

create or replace function public.expire_verification_if_needed(app_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.creator_applications
  set
    verification_state = 'expired',
    status = case when status = 'pending_verification' then 'rejected' else status end,
    admin_notes = coalesce(admin_notes, '') || ' Verification code expired.'
  where id = app_id
    and verification_state = 'pending'
    and verification_code_expires_at < now();
end;
$$;

create or replace function public.mark_verification_verified(
  app_id uuid,
  method public.verification_method
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  app public.creator_applications%rowtype;
begin
  select * into app from public.creator_applications where id = app_id for update;
  if app.id is null then
    raise exception 'application not found';
  end if;
  if app.user_id <> auth.uid() and not public.is_admin(auth.uid()) then
    raise exception 'not authorized';
  end if;

  perform public.expire_verification_if_needed(app_id);
  select * into app from public.creator_applications where id = app_id;

  if app.verification_state = 'expired' then
    raise exception 'verification code expired';
  end if;
  if app.verification_state = 'verified' then
    return;
  end if;

  update public.creator_applications
  set
    verification_state = 'verified',
    verification_method = method,
    verification_verified_at = now(),
    status = 'awaiting_review',
    verification_checked_at = now()
  where id = app_id;
end;
$$;

grant execute on function public.mark_verification_verified(uuid, public.verification_method) to authenticated;

create or replace function public.request_dm_verification(app_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if not exists (
    select 1 from public.creator_applications
    where id = app_id and user_id = auth.uid()
  ) then
    raise exception 'not authorized';
  end if;

  perform public.expire_verification_if_needed(app_id);

  update public.creator_applications
  set dm_verification_requested_at = now(),
      verification_checked_at = now()
  where id = app_id
    and verification_state = 'pending'
    and verification_code_expires_at >= now();
end;
$$;

grant execute on function public.request_dm_verification(uuid) to authenticated;

create or replace function public.admin_confirm_verification(app_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'not authorized';
  end if;
  perform public.mark_verification_verified(app_id, 'admin_manual');
end;
$$;

grant execute on function public.admin_confirm_verification(uuid) to authenticated;

create or replace function public.approve_creator_application(app_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  app public.creator_applications%rowtype;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'not authorized';
  end if;

  select * into app from public.creator_applications where id = app_id;
  if app.id is null then
    raise exception 'application not found';
  end if;
  if app.status <> 'awaiting_review' then
    raise exception 'application must be awaiting review';
  end if;
  if app.verification_state <> 'verified' then
    raise exception 'social verification required before approval';
  end if;

  update public.creator_applications
  set status = 'approved', reviewed_at = now(), reviewed_by = auth.uid()
  where id = app_id;

  update public.profiles
  set creator_status = 'approved', is_creator = true, updated_at = now()
  where id = app.user_id;
end;
$$;

create or replace function public.reject_creator_application(
  app_id uuid,
  p_notes text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  app public.creator_applications%rowtype;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'not authorized';
  end if;

  select * into app from public.creator_applications where id = app_id;
  if app.id is null then
    raise exception 'application not found';
  end if;

  update public.creator_applications
  set
    status = 'rejected',
    reviewed_at = now(),
    reviewed_by = auth.uid(),
    admin_notes = coalesce(p_notes, admin_notes)
  where id = app_id;

  update public.profiles
  set creator_status = 'rejected', updated_at = now()
  where id = app.user_id;
end;
$$;

grant execute on function public.reject_creator_application(uuid, text) to authenticated;

drop policy if exists "Users insert own application" on public.creator_applications;
drop policy if exists "Admins update applications" on public.creator_applications;

create policy "Admins update applications"
  on public.creator_applications for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

update public.creator_applications
set status = 'pending_verification'
where status = 'pending'
  and verification_code is null;
