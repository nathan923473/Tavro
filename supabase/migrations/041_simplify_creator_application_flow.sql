-- Simplify creator onboarding: apply → awaiting_review → admin approve.
-- Ownership verification is optional (admin can request when needed).
-- Approval still unlocks Creator Studio via profiles.creator_status = approved.

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

  -- Keep a code on file in case an admin later requests ownership verification
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
    'awaiting_review',
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

-- Approve without requiring prior ownership verification
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
  if app.status not in ('awaiting_review', 'pending_verification', 'pending') then
    raise exception 'application is not open for approval';
  end if;
  if app.status = 'approved' then
    raise exception 'application already approved';
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

-- Admin optionally asks applicant to prove Instagram ownership
create or replace function public.admin_request_ownership_verification(app_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  app public.creator_applications%rowtype;
  code text;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'not authorized';
  end if;

  select * into app from public.creator_applications where id = app_id for update;
  if app.id is null then
    raise exception 'application not found';
  end if;
  if app.status = 'approved' then
    raise exception 'application already approved';
  end if;
  if app.status = 'rejected' then
    raise exception 'application already rejected';
  end if;
  if app.verification_state = 'verified' then
    raise exception 'ownership already verified';
  end if;

  if app.verification_code is null
     or app.verification_code_expires_at is null
     or app.verification_code_expires_at < now() then
    code := public.generate_creator_verification_code();
  else
    code := app.verification_code;
  end if;

  update public.creator_applications
  set
    status = 'pending_verification',
    verification_state = 'pending',
    verification_code = code,
    verification_code_expires_at = now() + interval '48 hours',
    dm_verification_requested_at = null,
    admin_notes = coalesce(admin_notes, '') || ' Admin requested ownership verification.'
  where id = app_id;
end;
$$;

revoke all on function public.admin_request_ownership_verification(uuid) from public;
grant execute on function public.admin_request_ownership_verification(uuid) to authenticated;
