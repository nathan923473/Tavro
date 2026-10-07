-- In-app notification inbox (server inserts via RPC).

create table if not exists public.app_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null,
  link_path text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists app_notifications_user_unread_idx
  on public.app_notifications (user_id, created_at desc)
  where read_at is null;

alter table public.app_notifications enable row level security;

create policy "Users read own notifications"
  on public.app_notifications for select
  using (user_id = auth.uid());

create policy "Users mark own notifications read"
  on public.app_notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create table if not exists public.notification_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  challenge_reminders boolean not null default true,
  creator_announcements boolean not null default true,
  new_challenges_from_followed boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;

create policy "Users manage own notification preferences"
  on public.notification_preferences for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create or replace function public.enqueue_app_notification(
  p_user_id uuid,
  p_kind text,
  p_title text,
  p_body text,
  p_link_path text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  nid uuid;
begin
  if auth.uid() is null and current_setting('role', true) is distinct from 'service_role' then
    raise exception 'not authorized';
  end if;
  insert into public.app_notifications (user_id, kind, title, body, link_path)
  values (p_user_id, p_kind, p_title, p_body, p_link_path)
  returning id into nid;
  return nid;
end;
$$;

grant execute on function public.enqueue_app_notification(uuid, text, text, text, text) to authenticated;
