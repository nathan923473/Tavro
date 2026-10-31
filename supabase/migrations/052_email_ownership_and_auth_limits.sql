-- Email ownership proof and auth rate limits.
-- Run after 051. Does not delete users, sessions, challenges, or progress.
-- Existing profiles stay; email_ownership_verified_at starts null for every row.
-- Null means the inbox has not been proven, even when auth.users.email_confirmed_at is set.
-- Only the service role (auth.uid() is null) may set the timestamp, and only after a real
-- confirmation, magic-link, or recovery code exchange in the app.

alter table public.profiles
  add column if not exists email_ownership_verified_at timestamptz;

comment on column public.profiles.email_ownership_verified_at is
  'Inbox ownership proven by a confirmation, magic-link, or recovery link. Not set by profile creation or admin.createUser.';

create or replace function public.reject_untrusted_email_ownership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.email_ownership_verified_at is not null then
      raise exception 'cannot change email verification';
    end if;
    return new;
  end if;

  if new.email_ownership_verified_at is distinct from old.email_ownership_verified_at then
    raise exception 'cannot change email verification';
  end if;
  return new;
end;
$$;

drop trigger if exists reject_untrusted_email_ownership_ins on public.profiles;
create trigger reject_untrusted_email_ownership_ins
  before insert on public.profiles
  for each row execute function public.reject_untrusted_email_ownership();

drop trigger if exists reject_untrusted_email_ownership_upd on public.profiles;
create trigger reject_untrusted_email_ownership_upd
  before update on public.profiles
  for each row execute function public.reject_untrusted_email_ownership();

-- Keep the creator-access guard, and reject email-ownership changes even for admins
-- and the invite/application/share grants. Service role (auth.uid() null) may set it.
create or replace function public.protect_profile_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  grant_kind text := current_setting('tavro.creator_access_grant', true);
begin
  if new.email_ownership_verified_at is distinct from old.email_ownership_verified_at
    and auth.uid() is not null
  then
    raise exception 'cannot change email verification';
  end if;

  if auth.uid() is null or public.is_admin(auth.uid()) then
    return new;
  end if;

  if grant_kind = 'invite-accept' then
    if new.is_admin is distinct from old.is_admin
      or new.email_ownership_verified_at is distinct from old.email_ownership_verified_at
    then
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
      or new.email_ownership_verified_at is distinct from old.email_ownership_verified_at
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
      or new.email_ownership_verified_at is distinct from old.email_ownership_verified_at
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
    or new.email_ownership_verified_at is distinct from old.email_ownership_verified_at
  then
    raise exception 'cannot change creator access';
  end if;
  return new;
end;
$$;

create table if not exists public.auth_rate_limits (
  bucket text not null,
  subject_hash text not null,
  window_start timestamptz not null,
  attempts integer not null default 0,
  primary key (bucket, subject_hash, window_start)
);

alter table public.auth_rate_limits enable row level security;
revoke all on table public.auth_rate_limits from public, anon, authenticated;

create or replace function public.consume_auth_rate_limit(
  p_bucket text,
  p_subject text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  subject_hash text;
  window_start timestamptz;
  next_attempts integer;
begin
  if p_bucket is null or length(trim(p_bucket)) = 0 or length(p_bucket) > 64 then
    raise exception 'invalid rate limit bucket';
  end if;
  if p_subject is null or length(trim(p_subject)) = 0 or length(p_subject) > 320 then
    raise exception 'invalid rate limit subject';
  end if;
  if p_limit is null or p_limit < 1 or p_limit > 1000 then
    raise exception 'invalid rate limit';
  end if;
  if p_window_seconds is null or p_window_seconds < 10 or p_window_seconds > 86400 then
    raise exception 'invalid rate limit window';
  end if;

  subject_hash := encode(
    extensions.digest(convert_to(p_bucket || ':' || lower(trim(p_subject)), 'utf8'), 'sha256'),
    'hex'
  );
  window_start := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  insert into public.auth_rate_limits as rl (bucket, subject_hash, window_start, attempts)
  values (p_bucket, subject_hash, window_start, 1)
  on conflict (bucket, subject_hash, window_start)
  do update set attempts = rl.attempts + 1
  returning attempts into next_attempts;

  delete from public.auth_rate_limits
  where window_start < now() - interval '2 days';

  return next_attempts <= p_limit;
end;
$$;

revoke all on function public.consume_auth_rate_limit(text, text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_auth_rate_limit(text, text, integer, integer)
  to service_role;

-- Invited creators still need a proven inbox before Creator Studio is granted.
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
  confirmed_at timestamptz;
  ownership timestamptz;
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

  select lower(email), email_confirmed_at
    into account_email, confirmed_at
  from auth.users
  where id = uid;

  if account_email is null or account_email <> inv.intended_email then
    raise exception 'Sign in with the email address this invitation was issued for.';
  end if;
  if confirmed_at is null then
    raise exception 'Confirm your email before accepting this invitation.';
  end if;

  select email_ownership_verified_at into ownership
  from public.profiles
  where id = uid;

  if ownership is null then
    raise exception 'Confirm your email before accepting this invitation.';
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
