-- ============================================================
-- Add a "Gallery" home-screen tile, right after "Membership
-- Status" (and directly below "Pooja Timings" in the grid, since
-- the grid is 5 tiles per row).
--
-- Run this once in Supabase (Dashboard → SQL Editor → New query →
-- paste this → Run). Safe to re-run — "on conflict (tile_key) do
-- nothing" means it won't create a duplicate if it's already there.
--
-- This only adds the tile itself. The site's code (icon artwork,
-- and the "gallery" option in /cms.html's Home Tiles → Icon
-- dropdown) comes from the same zip as this file — make sure
-- that's merged into GitHub and deployed before/around the same
-- time as running this, otherwise the tile will show up with no
-- icon until the new code is live.
--
-- Once added, you can freely edit its title/description/order or
-- disable it any time from /cms.html's Home Tiles tab — no SQL
-- needed after this one-time insert.
-- ============================================================

insert into nav_tiles (tile_key, icon, title_en, title_bm, title_ta, desc_en, desc_bm, desc_ta, destination, enabled, sort_order)
values (
  'gallery', 'gallery',
  'Gallery', 'Galeri', 'படத்தொகுப்பு',
  'Photos from Temple Events & Festivals', 'Foto Acara & Perayaan Kuil', 'கோயில் நிகழ்வுகள் & திருவிழாக்களின் புகைப்படங்கள்',
  'gallery', true, 8
)
on conflict (tile_key) do nothing;
