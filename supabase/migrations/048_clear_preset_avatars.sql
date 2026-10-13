-- Style presets removed; use initials default until user uploads a photo.
update public.profiles
set avatar_url = null, updated_at = now()
where avatar_url like 'preset:%';
