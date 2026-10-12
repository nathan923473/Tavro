-- Profile photos are uploads only. Decorative preset: values are no longer valid.
-- Some communities inherited a preset when the profile photo was saved and the
-- community had no avatar of its own.

update public.profiles
set
  avatar_url = null,
  updated_at = now()
where avatar_url like 'preset:%';

update public.creator_communities
set
  avatar_url = null,
  updated_at = now()
where avatar_url like 'preset:%';
