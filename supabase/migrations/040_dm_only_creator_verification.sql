-- DM-only creator ownership verification (Tavro).
-- Applicants request DM review; only admins can mark ownership verified.
-- Does not grant creator privileges (approve_creator_application remains separate).

-- New codes use Tavro prefix (existing STREAKLY-* codes remain valid until expiry)
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
    candidate := 'TAVRO-' || upper(encode(extensions.gen_random_bytes(4), 'hex'));
    exit when not exists (
      select 1 from public.creator_applications where verification_code = candidate
    );
  end loop;
  return candidate;
end;
$$;

revoke all on function public.generate_creator_verification_code() from public;
grant execute on function public.generate_creator_verification_code() to authenticated;

-- Only admins may mark ownership verified (removes applicant self-verify via bio RPC)
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
  if not public.is_admin(auth.uid()) then
    raise exception 'not authorized';
  end if;

  -- Bio auto-verify is retired; only DM/admin manual paths remain
  if method = 'bio' then
    raise exception 'bio verification is no longer supported';
  end if;

  select * into app from public.creator_applications where id = app_id for update;
  if app.id is null then
    raise exception 'application not found';
  end if;

  perform public.expire_verification_if_needed(app_id);
  select * into app from public.creator_applications where id = app_id;

  if app.verification_state = 'expired' then
    raise exception 'verification code expired';
  end if;
  if app.verification_state = 'verified' then
    return;
  end if;
  if app.verification_code is null then
    raise exception 'verification code missing';
  end if;
  if app.verification_code_expires_at is not null
     and app.verification_code_expires_at < now() then
    raise exception 'verification code expired';
  end if;

  update public.creator_applications
  set
    verification_state = 'verified',
    verification_method = method,
    verification_verified_at = now(),
    status = 'awaiting_review',
    verification_checked_at = now()
  where id = app_id
    and verification_state = 'pending';
end;
$$;

revoke all on function public.mark_verification_verified(uuid, public.verification_method) from public;
grant execute on function public.mark_verification_verified(uuid, public.verification_method) to authenticated;

-- Applicant: "I've sent the DM" — awaiting manual check, NOT verified
create or replace function public.request_dm_verification(app_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  app public.creator_applications%rowtype;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select * into app
  from public.creator_applications
  where id = app_id and user_id = auth.uid()
  for update;

  if app.id is null then
    raise exception 'not authorized';
  end if;

  perform public.expire_verification_if_needed(app_id);
  select * into app from public.creator_applications where id = app_id;

  if app.verification_state = 'expired' then
    raise exception 'verification code expired';
  end if;
  if app.verification_state = 'verified' then
    raise exception 'already verified';
  end if;
  if app.verification_code is null then
    raise exception 'verification code missing';
  end if;
  if app.verification_code_expires_at is null
     or app.verification_code_expires_at < now() then
    raise exception 'verification code expired';
  end if;

  update public.creator_applications
  set
    dm_verification_requested_at = now(),
    verification_checked_at = now(),
    verification_method = 'dm'
  where id = app_id
    and verification_state = 'pending'
    and verification_code_expires_at >= now();

  if not found then
    raise exception 'could not record DM verification request';
  end if;
end;
$$;

revoke all on function public.request_dm_verification(uuid) from public;
grant execute on function public.request_dm_verification(uuid) to authenticated;

-- Admin confirms ownership after matching Instagram DM sender + code
create or replace function public.admin_confirm_verification(app_id uuid)
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

  select * into app from public.creator_applications where id = app_id for update;
  if app.id is null then
    raise exception 'application not found';
  end if;

  perform public.expire_verification_if_needed(app_id);
  select * into app from public.creator_applications where id = app_id;

  if app.verification_state = 'expired' then
    raise exception 'verification code expired';
  end if;
  if app.verification_state = 'verified' then
    return;
  end if;
  if app.verification_code is null then
    raise exception 'verification code missing';
  end if;
  if app.verification_code_expires_at is not null
     and app.verification_code_expires_at < now() then
    raise exception 'verification code expired';
  end if;

  perform public.mark_verification_verified(app_id, 'admin_manual');
end;
$$;

revoke all on function public.admin_confirm_verification(uuid) from public;
grant execute on function public.admin_confirm_verification(uuid) to authenticated;
