-- Personal creator invitations, organic reapply, and onboarding funnel fields.
-- Run after 050. Does not delete creator accounts, applications, or permissions.
-- Invitation tokens are stored only as SHA-256 hashes. Acceptance is single-use,
-- email-bound, and expires. Creator Studio is granted only inside these functions.

alter table public.creator_applications
  add column if not exists coaching_focus text;

alter table public.profiles
  add column if not exists creator_invited_by uuid references public.profiles (id) on delete set null,
  add column if not exists creator_approved_by uuid references public.profiles (id) on delete set null,
  add column if not exists creator_access_pathway text,
  add column if not exists creator_reapply_permitted_at timestamptz,
  add column if not exists first_challenge_shared_at timestamptz;

do $$ begin
  alter table public.profiles
    add constraint profiles_creator_access_pathway_check
    check (creator_access_pathway is null or creator_access_pathway in ('invite', 'organic'));
exception
  when duplicate_object then null;
end $$;

create table if not exists public.creator_invitations (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  created_by uuid not null references public.profiles (id) on delete restrict,
  intended_email text not null,
  note text,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  accepted_by uuid references public.profiles (id) on delete set null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint creator_invitations_email_check
    check (intended_email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')
);

create index if not exists creator_invitations_email_open_idx
  on public.creator_invitations (intended_email)
  where accepted_at is null and revoked_at is null;

alter table public.creator_invitations enable row level security;
revoke all on table public.creator_invitations from public, anon, authenticated;

-- Transaction-local grant used only by the functions below.
-- PostgREST cannot set this and update a profile in the same transaction.
create or replace function public.protect_profile_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  grant_kind text := current_setting('tavro.creator_access_grant', true);
begin
  if auth.uid() is null or public.is_admin(auth.uid()) then
    return new;
  end if;

  if grant_kind = 'invite-accept' then
    if new.is_admin is distinct from old.is_admin then
      raise exception 'cannot change is_admin';
    end if;
    return new;
  end if;

  if grant_kind = 'application-submit' then
    if new.is_admin is distinct from old.is_admin
      or new.is_creator is distinct from old.is_creator
      or new.creator_invited_by is distinct from old.creator_invited_by
      or new.creator_approved_by is distinct from old.creator_approved_by
      or new.creator_access_pathway is distinct from old.creator_access_pathway
      or new.first_challenge_shared_at is distinct from old.first_challenge_shared_at
    then
      raise exception 'cannot change creator access';
    end if;
    return new;
  end if;

  if grant_kind = 'share-record' then
    if new.creator_status is distinct from old.creator_status
      or new.is_admin is distinct from old.is_admin
      or new.is_creator is distinct from old.is_creator
      or new.creator_invited_by is distinct from old.creator_invited_by
      or new.creator_approved_by is distinct from old.creator_approved_by
      or new.creator_access_pathway is distinct from old.creator_access_pathway
      or new.creator_reapply_permitted_at is distinct from old.creator_reapply_permitted_at
    then
      raise exception 'cannot change creator access';
    end if;
    return new;
  end if;

  if new.creator_status is distinct from old.creator_status
    or new.is_admin is distinct from old.is_admin
    or new.is_creator is distinct from old.is_creator
    or new.creator_invited_by is distinct from old.creator_invited_by
    or new.creator_approved_by is distinct from old.creator_approved_by
    or new.creator_access_pathway is distinct from old.creator_access_pathway
    or new.creator_reapply_permitted_at is distinct from old.creator_reapply_permitted_at
    or new.first_challenge_shared_at is distinct from old.first_challenge_shared_at
  then
    raise exception 'cannot change creator access';
  end if;
  return new;
end;
$$;

create or replace function public.creator_invitation_token_hash(p_token text)
returns text
language sql
immutable
as $$
  select encode(extensions.digest(convert_to(p_token, 'utf8'), 'sha256'), 'hex');
$$;

revoke all on function public.creator_invitation_token_hash(text) from public, anon, authenticated;

create or replace function public.create_creator_invitation(
  p_intended_email text,
  p_expires_at timestamptz,
  p_note text default null
)
returns table (invitation_id uuid, token text, expires_at timestamptz)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  admin_id uuid := auth.uid();
  email text := lower(trim(coalesce(p_intended_email, '')));
  raw_token text;
  new_id uuid;
begin
  if not public.is_admin(admin_id) then
    raise exception 'Only an admin can invite a creator.';
  end if;
  if email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'Enter the creator email address this invite is for.';
  end if;
  if p_expires_at is null or p_expires_at <= now() then
    raise exception 'Choose an expiry date in the future.';
  end if;
  if p_expires_at > now() + interval '90 days' then
    raise exception 'Invitations can last at most 90 days.';
  end if;
  if exists (
    select 1 from public.creator_invitations
    where intended_email = email
      and accepted_at is null
      and revoked_at is null
      and expires_at > now()
  ) then
    raise exception 'An open invitation already exists for that email.';
  end if;

  raw_token := encode(extensions.gen_random_bytes(32), 'hex');
  insert into public.creator_invitations (
    token_hash, created_by, intended_email, note, expires_at
  ) values (
    public.creator_invitation_token_hash(raw_token),
    admin_id,
    email,
    nullif(trim(coalesce(p_note, '')), ''),
    p_expires_at
  )
  returning id into new_id;

  invitation_id := new_id;
  token := raw_token;
  expires_at := p_expires_at;
  return next;
end;
$$;

revoke all on function public.create_creator_invitation(text, timestamptz, text) from public, anon;
grant execute on function public.create_creator_invitation(text, timestamptz, text) to authenticated;

create or replace function public.preview_creator_invitation(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  inv public.creator_invitations%rowtype;
begin
  if p_token is null or p_token !~ '^[0-9a-f]{64}$' then
    return jsonb_build_object('state', 'invalid');
  end if;

  select * into inv
  from public.creator_invitations
  where token_hash = public.creator_invitation_token_hash(p_token);

  if inv.id is null then
    return jsonb_build_object('state', 'invalid');
  end if;
  if inv.revoked_at is not null then
    return jsonb_build_object('state', 'revoked');
  end if;
  if inv.accepted_at is not null then
    return jsonb_build_object('state', 'used');
  end if;
  if inv.expires_at <= now() then
    return jsonb_build_object('state', 'expired', 'expiresAt', inv.expires_at);
  end if;
  return jsonb_build_object('state', 'ready', 'expiresAt', inv.expires_at);
end;
$$;

revoke all on function public.preview_creator_invitation(text) from public;
grant execute on function public.preview_creator_invitation(text) to anon, authenticated;

create or replace function public.accept_creator_invitation(p_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  inv public.creator_invitations%rowtype;
  account_email text;
begin
  if uid is null then
    raise exception 'Log in to accept this invitation.';
  end if;
  if p_token is null or p_token !~ '^[0-9a-f]{64}$' then
    raise exception 'This invitation link is not valid.';
  end if;

  select * into inv
  from public.creator_invitations
  where token_hash = public.creator_invitation_token_hash(p_token)
  for update;

  if inv.id is null then
    raise exception 'This invitation link is not valid.';
  end if;
  if inv.revoked_at is not null then
    raise exception 'This invitation was revoked.';
  end if;
  if inv.accepted_at is not null then
    raise exception 'This invitation has already been used.';
  end if;
  if inv.expires_at <= now() then
    raise exception 'This invitation has expired.';
  end if;

  select lower(email) into account_email from auth.users where id = uid;
  if account_email is null or account_email <> inv.intended_email then
    raise exception 'Sign in with the email address this invitation was issued for.';
  end if;

  update public.creator_invitations
  set accepted_at = now(), accepted_by = uid
  where id = inv.id;

  perform set_config('tavro.creator_access_grant', 'invite-accept', true);

  update public.profiles
  set
    creator_status = 'approved',
    is_creator = true,
    creator_invited_by = inv.created_by,
    creator_approved_by = inv.created_by,
    creator_access_pathway = 'invite',
    updated_at = now()
  where id = uid;

  update public.creator_applications
  set
    status = 'approved',
    reviewed_at = now(),
    reviewed_by = inv.created_by,
    admin_notes = concat_ws(
      ' ',
      admin_notes,
      'Approved via personal creator invitation.'
    )
  where user_id = uid
    and status in ('pending', 'pending_verification', 'awaiting_review');
end;
$$;

revoke all on function public.accept_creator_invitation(text) from public, anon;
grant execute on function public.accept_creator_invitation(text) to authenticated;

create or replace function public.revoke_creator_invitation(p_invitation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Only an admin can revoke a creator invitation.';
  end if;
  update public.creator_invitations
  set revoked_at = now()
  where id = p_invitation_id
    and accepted_at is null
    and revoked_at is null;
  if not found then
    raise exception 'That invitation can no longer be revoked.';
  end if;
end;
$$;

revoke all on function public.revoke_creator_invitation(uuid) from public, anon;
grant execute on function public.revoke_creator_invitation(uuid) to authenticated;

create or replace function public.list_creator_invitations()
returns table (
  id uuid,
  intended_email text,
  note text,
  expires_at timestamptz,
  accepted_at timestamptz,
  accepted_by uuid,
  revoked_at timestamptz,
  created_at timestamptz,
  created_by uuid
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Only an admin can view creator invitations.';
  end if;
  return query
  select
    i.id, i.intended_email, i.note, i.expires_at, i.accepted_at,
    i.accepted_by, i.revoked_at, i.created_at, i.created_by
  from public.creator_invitations i
  order by i.created_at desc
  limit 100;
end;
$$;

revoke all on function public.list_creator_invitations() from public, anon;
grant execute on function public.list_creator_invitations() to authenticated;

create or replace function public.refresh_creator_verification_code(app_id uuid)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  uid uuid := auth.uid();
  app public.creator_applications%rowtype;
  code text;
begin
  if uid is null then
    raise exception 'Log in to refresh your verification code.';
  end if;

  select * into app
  from public.creator_applications
  where id = app_id and user_id = uid
  for update;

  if app.id is null then
    raise exception 'Application not found.';
  end if;
  if app.status = 'approved' or app.status = 'awaiting_review' or app.verification_state = 'verified' then
    raise exception 'This application is already past the verification step.';
  end if;
  if app.status = 'rejected' and app.reviewed_by is not null then
    raise exception 'An admin has to allow you to apply again.';
  end if;
  if app.verification_code_expires_at is not null
    and app.verification_code_expires_at > now()
    and app.verification_state is distinct from 'expired'
  then
    raise exception 'Your verification code is still active.';
  end if;

  code := public.generate_creator_verification_code();
  update public.creator_applications
  set
    verification_code = code,
    verification_code_expires_at = now() + interval '48 hours',
    verification_state = 'pending',
    verification_method = null,
    verification_verified_at = null,
    status = 'pending_verification'
  where id = app.id;

  return code;
end;
$$;

revoke all on function public.refresh_creator_verification_code(uuid) from public, anon;
grant execute on function public.refresh_creator_verification_code(uuid) to authenticated;

create or replace function public.permit_creator_reapply(app_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  app public.creator_applications%rowtype;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Only an admin can allow another application.';
  end if;
  select * into app from public.creator_applications where id = app_id;
  if app.id is null then
    raise exception 'Application not found.';
  end if;
  if app.status <> 'rejected' or app.reviewed_by is null then
    raise exception 'Only an admin rejection can be opened for reapply.';
  end if;
  update public.profiles
  set creator_reapply_permitted_at = now(), updated_at = now()
  where id = app.user_id;
end;
$$;

revoke all on function public.permit_creator_reapply(uuid) from public, anon;
grant execute on function public.permit_creator_reapply(uuid) to authenticated;

drop function if exists public.submit_creator_application(text, text, text, uuid, text);

create or replace function public.submit_creator_application(
  p_display_name text,
  p_pitch text,
  p_social_link text,
  p_referred_by_user_id uuid default null,
  p_application_source text default 'unknown',
  p_coaching_focus text default null
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
  referrer public.profiles%rowtype;
  src text := coalesce(nullif(trim(p_application_source), ''), 'unknown');
  focus text := trim(coalesce(p_coaching_focus, ''));
begin
  if uid is null then
    raise exception 'You must be logged in.';
  end if;

  if src not in ('creator_landing', 'creator_referral', 'direct', 'unknown') then
    src := 'unknown';
  end if;

  if p_display_name is null or length(trim(p_display_name)) < 2 then
    raise exception 'Enter a creator name.';
  end if;
  if focus is null or length(focus) < 2 then
    raise exception 'Enter your coaching focus.';
  end if;
  if p_pitch is null or length(trim(p_pitch)) < 10 then
    raise exception 'Tell us a little more about why you want to host challenges.';
  end if;
  if p_social_link is null or p_social_link !~* '^https?://' then
    raise exception 'Enter a public social profile link.';
  end if;

  select * into prof from public.profiles where id = uid;
  if prof.creator_status = 'approved' then
    raise exception 'You already have Creator Studio access.';
  end if;
  if prof.creator_status = 'rejected' and prof.creator_reapply_permitted_at is null then
    raise exception 'An admin has to allow you to apply again.';
  end if;

  if p_referred_by_user_id is not null then
    select * into referrer from public.profiles where id = p_referred_by_user_id;
    if referrer.id is null or referrer.creator_status <> 'approved' then
      p_referred_by_user_id := null;
      if src = 'creator_referral' then
        src := 'creator_landing';
      end if;
    else
      src := 'creator_referral';
    end if;
  elsif src = 'creator_referral' then
    src := 'unknown';
  end if;

  if exists (
    select 1 from public.creator_applications
    where user_id = uid
      and status in ('pending', 'pending_verification', 'awaiting_review')
  ) then
    raise exception 'You already have an application in progress.';
  end if;

  code := public.generate_creator_verification_code();

  perform set_config('tavro.creator_access_grant', 'application-submit', true);

  insert into public.creator_applications (
    user_id,
    display_name,
    pitch,
    social_link,
    coaching_focus,
    status,
    verification_code,
    verification_code_expires_at,
    verification_state,
    referred_by_user_id,
    application_source
  ) values (
    uid,
    trim(p_display_name),
    trim(p_pitch),
    trim(p_social_link),
    focus,
    'pending_verification',
    code,
    now() + interval '48 hours',
    'pending',
    p_referred_by_user_id,
    src
  )
  returning id into app_id;

  update public.profiles
  set
    display_name = coalesce(nullif(trim(p_display_name), ''), display_name),
    creator_status = 'pending',
    creator_reapply_permitted_at = null,
    updated_at = now()
  where id = uid;

  return app_id;
end;
$$;

grant execute on function public.submit_creator_application(text, text, text, uuid, text, text) to authenticated;

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
  set
    creator_status = 'approved',
    is_creator = true,
    creator_approved_by = auth.uid(),
    creator_access_pathway = coalesce(creator_access_pathway, 'organic'),
    updated_at = now()
  where id = app.user_id;
end;
$$;

create or replace function public.record_creator_challenge_share(p_challenge_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Log in to share your challenge.';
  end if;
  if not exists (
    select 1 from public.challenges
    where id = p_challenge_id
      and created_by = uid
      and publish_status in ('published', 'scheduled')
  ) then
    raise exception 'Publish a challenge before sharing it.';
  end if;

  perform set_config('tavro.creator_access_grant', 'share-record', true);
  update public.profiles
  set first_challenge_shared_at = coalesce(first_challenge_shared_at, now()),
      updated_at = now()
  where id = uid;
end;
$$;

revoke all on function public.record_creator_challenge_share(uuid) from public, anon;
grant execute on function public.record_creator_challenge_share(uuid) to authenticated;

create or replace function public.creator_onboarding_funnel_stats()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Only an admin can view creator onboarding stats.';
  end if;

  return jsonb_build_object(
    'invitationsCreated', (select count(*) from public.creator_invitations),
    'invitationsAccepted', (select count(*) from public.creator_invitations where accepted_at is not null),
    'applications', (select count(*) from public.creator_applications),
    'approvals', (select count(*) from public.profiles where creator_status = 'approved'),
    'firstChallengeCreated', (select count(distinct created_by) from public.challenges),
    'firstChallengePublished', (
      select count(distinct created_by) from public.challenges
      where publish_status = 'published'
    ),
    'challengeShared', (
      select count(*) from public.profiles where first_challenge_shared_at is not null
    ),
    'firstParticipantJoined', (
      select count(distinct c.created_by)
      from public.challenges c
      join public.challenge_participants p on p.challenge_id = c.id
      where p.user_id <> c.created_by
    )
  );
end;
$$;

revoke all on function public.creator_onboarding_funnel_stats() from public, anon;
grant execute on function public.creator_onboarding_funnel_stats() to authenticated;
