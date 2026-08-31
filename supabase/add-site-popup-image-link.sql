-- ============================================================
-- One-time migration: adds an optional photo and an optional
-- "link to a page on the site" to the Home Popup, editable from
-- /cms.html's Home Popup tab alongside the existing title/message.
--
-- Only needed if you already ran the earlier version of
-- supabase/add-site-popup.sql (the one without image/link support).
-- If you're setting up the Home Popup table for the first time,
-- just run the current supabase/add-site-popup.sql instead — it
-- already includes these columns, so this file isn't needed.
--
-- Safe to re-run: every statement uses "if not exists" and never
-- touches a row's existing values (a blank default only applies the
-- first time a column is created).
--
-- Run this once in Supabase (Dashboard -> SQL Editor -> New query ->
-- paste this whole file -> Run).
-- ============================================================

alter table site_popup add column if not exists image_url     text not null default '';
alter table site_popup add column if not exists link_target   text not null default '';
alter table site_popup add column if not exists link_label_en text not null default '';
alter table site_popup add column if not exists link_label_bm text not null default '';
alter table site_popup add column if not exists link_label_ta text not null default '';
