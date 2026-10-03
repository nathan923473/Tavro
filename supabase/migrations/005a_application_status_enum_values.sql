-- STEP 1 of 2 — Run this query ALONE in Supabase SQL Editor, then run 005b.
-- (Postgres cannot use new enum values in the same transaction they are added.)

alter type public.application_status add value if not exists 'pending_verification';
alter type public.application_status add value if not exists 'awaiting_review';
