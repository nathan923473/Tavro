-- Fix "Database error saving new user" on sign-up
-- Common cause: pgcrypto lives in the extensions schema on hosted Supabase.

create extension if not exists "pgcrypto" with schema extensions;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  ref_code text;
  display text;
begin
  ref_code := encode(extensions.gen_random_bytes(6), 'hex');
  display := coalesce(
    nullif(trim(new.raw_user_meta_data->>'display_name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Member'
  );

  insert into public.profiles (id, display_name, referral_code)
  values (new.id, display, ref_code)
  on conflict (id) do update
    set display_name = coalesce(public.profiles.display_name, excluded.display_name),
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

grant usage on schema extensions to postgres, anon, authenticated, service_role;
