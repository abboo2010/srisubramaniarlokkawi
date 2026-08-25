-- ============================================================
-- Fixes the bug behind "bulk upload only shows 1 photo": the gallery
-- table had a unique constraint on label_en (the caption). Bulk
-- Upload deliberately saves photos with a blank caption (you add
-- captions afterwards if you want them), so the FIRST blank-caption
-- photo in a batch saved fine — every photo after it in the same
-- batch silently failed to save, because Postgres rejected it as a
-- duplicate blank caption. The same thing could happen with the
-- regular one-at-a-time "+ Add Photo" form too, any time two photos
-- were left with the same (or blank) caption.
--
-- That constraint was a mistake for a photo table — unlike Deities,
-- Sevas, or Announcements (where a duplicate name really does mean
-- an accidental double-save), Gallery photos are not identified by
-- their caption. Many real photos legitimately have no caption, or
-- share one.
--
-- This drops it. It's the only thing this file does — no data is
-- touched, no photos are deleted.
--
-- Safe to re-run.
--
-- Run this once in Supabase (Dashboard -> SQL Editor -> New query ->
-- paste this whole file -> Run), then merge and redeploy the
-- accompanying cms.html.
-- ============================================================

alter table gallery drop constraint if exists gallery_label_en_key;
drop index if exists gallery_label_en_key;
