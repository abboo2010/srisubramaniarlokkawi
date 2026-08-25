-- ============================================================
-- Add a "Membership Status" home-screen tile, right after
-- "Friday Annathanam".
--
-- Run this once in Supabase (Dashboard → SQL Editor → New query →
-- paste this → Run). Safe to re-run — "on conflict (tile_key) do
-- nothing" means it won't create a duplicate if it's already there.
--
-- This only adds the tile itself. The site's code (icon artwork,
-- and the "membership" option in /cms.html's Home Tiles → Icon
-- dropdown) comes from the icon-tile.zip update — make sure that's
-- merged into GitHub and deployed before/around the same time as
-- running this, otherwise the tile will show up with no icon until
-- the new code is live.
--
-- Once added, you can freely edit its title/description/order or
-- disable it any time from /cms.html's Home Tiles tab — no SQL
-- needed after this one-time insert.
-- ============================================================

insert into nav_tiles (tile_key, icon, title_en, title_bm, title_ta, desc_en, desc_bm, desc_ta, destination, enabled, sort_order)
values (
  'membership', 'membership',
  'Membership Status', 'Status Keahlian', 'உறுப்பினர் நிலை',
  'Check Your Membership Status', 'Semak Status Keahlian Anda', 'உங்கள் உறுப்பினர் நிலையைச் சரிபார்க்கவும்',
  'membership', true, 7
)
on conflict (tile_key) do nothing;
