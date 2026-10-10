-- Fix: members could not submit "Become a creator" because
-- protect_profile_privileged_columns blocked creator_status = 'pending'
-- even when called from security definer RPC submit_creator_application.
-- auth.uid() remains the member JWT inside SECURITY DEFINER, so the guard
-- must allow an explicit session flag set by trusted RPCs.

create or replace function public.protect_profile_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Trusted RPCs (submit/approve/reject) set this for the current transaction.
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
  return new;
end;
$$;

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

  perform set_config('app.allow_privileged_profile_update', 'true', true);

  update public.profiles
  set creator_status = 'pending', updated_at = now()
  where id = uid;

  return app_id;
end;
$$;

grant execute on function public.submit_creator_application(text, text, text) to authenticated;

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

  perform set_config('app.allow_privileged_profile_update', 'true', true);

  update public.profiles
  set creator_status = 'approved', is_creator = true, updated_at = now()
  where id = app.user_id;
end;
$$;

grant execute on function public.approve_creator_application(uuid) to authenticated;

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

  perform set_config('app.allow_privileged_profile_update', 'true', true);

  update public.profiles
  set creator_status = 'rejected', updated_at = now()
  where id = app.user_id;
end;
$$;

grant execute on function public.reject_creator_application(uuid, text) to authenticated;
