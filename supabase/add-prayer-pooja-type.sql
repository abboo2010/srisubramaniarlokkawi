-- ============================================================
-- Adds Pooja Type to Monthly/Special prayers — the field that lets you
-- explicitly group recurring poojas (e.g. "Bairavar", "Shasthi",
-- "Pournami") so every month's occurrence lands on the same sub-tab on
-- the public site, and lets you pick/create these from a dedicated
-- "Pooja Type" field in admin-prayers.html's Add/Edit Pooja form instead
-- of it being guessed from the pooja's name.
--
-- This migration also BACKFILLS pooja_type for every Monthly/Special
-- pooja that doesn't have one set yet, by parsing it out of the
-- existing name (e.g. "Monthly Bairavar Pooja (April 2026)" becomes
-- "Bairavar") — so your existing schedule doesn't need to be retyped by
-- hand. Only touches rows where pooja_type is still null/blank, so an
-- already-backfilled value, or one you've since edited by hand in the
-- admin, is never touched again — safe to run this file more than once.
--
-- Run this once in Supabase (Dashboard -> SQL Editor -> New query ->
-- paste this whole file -> Run), then merge and redeploy the
-- accompanying files.
--
-- Safe to re-run.
-- ============================================================

alter table prayers add column if not exists pooja_type text;

update prayers
set pooja_type = nullif(
  btrim(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          regexp_replace(name, '\s*\([^)]*\)\s*$', ''),
          '\y(monthly|special)\y', ' ', 'gi'
        ),
        '\s+', ' ', 'g'
      ),
      '\s+(pooja|prayer|prayers)\s*$', '', 'i'
    )
  ),
  ''
)
where category in ('monthly', 'special')
  and (pooja_type is null or pooja_type = '');

-- Fallback: if parsing left nothing usable (the update above produced
-- NULL because there was nothing left after stripping), use the pooja's
-- own name rather than leaving pooja_type blank.
update prayers
set pooja_type = name
where category in ('monthly', 'special')
  and pooja_type is null;
