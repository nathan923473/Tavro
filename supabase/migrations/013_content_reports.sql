-- User content reports (images + messages). Admin review only — no auto-moderation.

do $$ begin
  create type public.content_report_reason as enum (
    'nudity_sexual',
    'violence_gore',
    'harassment_hate',
    'spam_scam',
    'other'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.content_report_status as enum (
    'pending',
    'reviewed',
    'dismissed'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.reported_content_type as enum (
    'profile_avatar',
    'creator_avatar',
    'creator_banner',
    'challenge_cover',
    'challenge_gallery_photo',
    'creator_announcement_image',
    'challenge_message',
    'group_message'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reported_user_id uuid not null references public.profiles (id) on delete cascade,
  content_type public.reported_content_type not null,
  content_id text not null,
  reason public.content_report_reason not null,
  explanation text check (char_length(explanation) <= 500),
  status public.content_report_status not null default 'pending',
  admin_notes text,
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (reporter_id, content_type, content_id)
);

create index if not exists content_reports_status_created_idx
  on public.content_reports (status, created_at desc);

alter table public.content_reports enable row level security;

create policy "Users insert own content reports"
  on public.content_reports for insert
  with check (reporter_id = auth.uid());

create policy "Users read own content reports"
  on public.content_reports for select
  using (reporter_id = auth.uid() or public.is_admin(auth.uid()));

create policy "Admins update content reports"
  on public.content_reports for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));
