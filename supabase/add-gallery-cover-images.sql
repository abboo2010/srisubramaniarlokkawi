-- ============================================================
-- One-time migration: adds a cover_url column to gallery_categories
-- and gallery_folders, so each Category and Folder can have its own
-- cover photo set directly in the CMS (instead of only ever showing
-- the first photo inside it, or the colored placeholder when it's
-- still empty — which is what every Category/Folder tile shows today
-- since no photos have been uploaded yet).
--
-- Safe to re-run: uses "add column if not exists". Run this whether
-- or not you've already run migrate-gallery-hierarchy.sql — if the
-- gallery_categories/gallery_folders tables don't exist yet, run
-- migrate-gallery-hierarchy.sql first (or cms-schema.sql on a fresh
-- install, which already includes this column).
--
-- Run this once in Supabase (Dashboard -> SQL Editor -> New query ->
-- paste this whole file -> Run).
-- ============================================================

alter table gallery_categories add column if not exists cover_url text not null default '';
alter table gallery_folders add column if not exists cover_url text not null default '';
