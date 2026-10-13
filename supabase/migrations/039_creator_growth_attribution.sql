-- Creator growth: application source + creator-to-creator referral attribution.

alter table public.creator_applications
  add column if not exists referred_by_user_id uuid references public.profiles (id) on delete set null,
  add column if not exists application_source text not null default 'unknown';

comment on column public.creator_applications.referred_by_user_id is
  'Approved creator who shared a /creators referral link, if attributable.';
comment on column public.creator_applications.application_source is
  'creator_landing | creator_referral | direct | unknown';

do $$ begin
  alter table public.creator_applications
    add constraint creator_applications_source_check
    check (
      application_source in (
        'creator_landing',
        'creator_referral',
        'direct',
        'unknown'
      )
    );
exception
  when duplicate_object then null;
end $$;

create index if not exists creator_applications_referred_by_idx
  on public.creator_applications (referred_by_user_id)
  where referred_by_user_id is not null;

create index if not exists creator_applications_source_idx
  on public.creator_applications (application_source);

drop function if exists public.submit_creator_application(text, text, text);

create or replace function public.submit_creator_application(
  p_display_name text,
  p_pitch text,
  p_social_link text,
  p_referred_by_user_id uuid default null,
  p_application_source text default 'unknown'
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
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  if src not in ('creator_landing', 'creator_referral', 'direct', 'unknown') then
    src := 'unknown';
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
    verification_state,
    referred_by_user_id,
    application_source
  ) values (
    uid,
    trim(p_display_name),
    trim(p_pitch),
    trim(p_social_link),
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
    updated_at = now()
  where id = uid;

  return app_id;
end;
$$;

grant execute on function public.submit_creator_application(text, text, text, uuid, text) to authenticated;
