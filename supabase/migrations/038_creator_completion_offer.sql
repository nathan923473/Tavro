-- Optional coaching / program offer shown after a participant completes a challenge (external link only).

alter table public.creator_communities
  add column if not exists completion_offer_enabled boolean not null default false,
  add column if not exists completion_offer_link_id uuid references public.creator_links (id) on delete set null,
  add column if not exists completion_offer_headline text,
  add column if not exists completion_offer_message text;

comment on column public.creator_communities.completion_offer_enabled is
  'When true, participants who finish a challenge may see an optional creator offer (not required to complete).';
