-- ============================================================
-- One-time cleanup: remove duplicate rows created by cms-seed.sql
-- having been run more than once, and add safeguards so it can
-- never happen again.
--
-- What happened: cms-seed.sql's insert statements had no protection
-- against being re-run (unlike nav_tiles, which already used
-- "on conflict (tile_key) do nothing"). Every time cms-seed.sql was
-- run — including while troubleshooting the "check-membership 500
-- error" earlier — it added a full extra copy of every Deity, Pooja
-- Timing, Seva, Announcement, and Gallery item, with no warning.
-- That's why deleting a duplicate entry in /cms.html appeared to do
-- nothing: there were several identical-looking copies, and
-- removing one just left the others behind.
--
-- What this file does, for deities / pooja_timings / sevas /
-- announcements / gallery:
--   1. Deletes duplicate rows, keeping only the EARLIEST copy of
--      each (lowest id) — i.e. undoes the accidental re-seeding.
--   2. Adds a unique constraint so the same thing can never insert
--      a silent duplicate again — including a future accidental
--      re-run of cms-seed.sql, which now also has "on conflict do
--      nothing" added to match.
--
-- IMPORTANT — read before running: if you made any manual edits in
-- /cms.html to one of the duplicate copies of a pooja timing, deity,
-- seva, announcement, or gallery item (since duplicates looked
-- identical, there was no way to tell them apart), this cleanup
-- keeps the EARLIEST copy and discards the rest — so a change made
-- to a later copy would be lost. After running this, it's worth a
-- quick look through each tab in /cms.html to confirm everything
-- still reads the way you expect, and re-apply anything that isn't
-- quite right.
--
-- Run this once in Supabase (Dashboard → SQL Editor → New query →
-- paste this whole file → Run). Safe to re-run — the deletes are
-- no-ops once there's nothing left to deduplicate, and the
-- constraints are only added if missing.
-- ============================================================

-- ---------- 1. Remove duplicates (keep lowest id per natural key) ----------

delete from deities a using deities b
where a.id > b.id and a.name_en = b.name_en;

delete from pooja_timings a using pooja_timings b
where a.id > b.id and a.list_type = b.list_type and a.name_en = b.name_en;

delete from sevas a using sevas b
where a.id > b.id and a.name_en = b.name_en;

delete from announcements a using announcements b
where a.id > b.id and a.title_en = b.title_en;

-- Gallery is NOT deduplicated by caption here (see below — captions
-- are not a natural key for photos, unlike the other tables above).

-- ---------- 2. Add safeguards so this can't happen again ----------

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'deities_name_en_key') then
    alter table deities add constraint deities_name_en_key unique (name_en);
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'pooja_timings_list_name_key') then
    alter table pooja_timings add constraint pooja_timings_list_name_key unique (list_type, name_en);
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'sevas_name_en_key') then
    alter table sevas add constraint sevas_name_en_key unique (name_en);
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'announcements_title_en_key') then
    alter table announcements add constraint announcements_title_en_key unique (title_en);
  end if;
end $$;

-- NOTE: this file used to also add a unique constraint on
-- gallery.label_en here. That was wrong — real Gallery photos
-- legitimately share captions or have none at all, and that
-- constraint silently broke Bulk Upload (every blank-caption photo
-- after the first failed to save). It's been removed from this file
-- and, if it was ever applied to your database, is dropped by
-- supabase/fix-gallery-caption-uniqueness.sql. Re-running this file
-- will not re-add it.
