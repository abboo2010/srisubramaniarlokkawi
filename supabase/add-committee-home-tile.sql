-- ============================================================
-- Add a "Temple Committee" home-screen tile, positioned right
-- after "About Temple" (as requested — beside/next to the About
-- Temple box, ahead of Deities/Calendar/etc).
--
-- Run this once in Supabase (Dashboard → SQL Editor → New query →
-- paste this → Run). Safe to re-run:
--   - the INSERT uses "on conflict (tile_key) do nothing", so it
--     won't create a duplicate tile if it's already there.
--   - the UPDATE below sets each tile's position to a fixed,
--     named target (not a relative shift), so running this more
--     than once always lands on the same order instead of
--     sliding tiles further each time. It only touches
--     sort_order — any title/description edits already made in
--     /cms.html's Home Tiles tab are left untouched.
--
-- This only adds the tile itself. The site's code (icon artwork,
-- the "committee" screen it links to, and the "committee" option
-- in /cms.html's Home Tiles → Icon dropdown) comes from a
-- separate zip — make sure that's merged into GitHub and
-- deployed around the same time as running this, otherwise the
-- tile will show up with no icon until the new code is live.
--
-- Once added, you can freely edit its title/description/order or
-- disable it any time from /cms.html's Home Tiles tab — no SQL
-- needed after this one-time insert.
-- ============================================================

insert into nav_tiles (tile_key, icon, title_en, title_bm, title_ta, desc_en, desc_bm, desc_ta, destination, enabled, sort_order)
values (
  'committee', 'committee',
  'Temple Committee', 'Jawatankuasa Kuil', 'கோயில் குழு',
  'Management Committee Members', 'Ahli Jawatankuasa Pengurusan', 'நிர்வாகக் குழு உறுப்பினர்கள்',
  'committee', true, 1
)
on conflict (tile_key) do nothing;

-- Move every other bundled tile down one slot so Temple Committee
-- sits right after About Temple, ahead of everything else. Any
-- tile Ravi has since added himself (or deleted) simply won't
-- match a WHEN clause below and is left exactly where it is.
update nav_tiles set sort_order = case tile_key
  when 'about'             then 0
  when 'committee'         then 1
  when 'deities'           then 2
  when 'calendar'          then 3
  when 'timings'           then 4
  when 'sevas'             then 5
  when 'prayers'           then 6
  when 'fridayAnnathanam'  then 7
  when 'membership'        then 8
  when 'gallery'           then 9
  else sort_order
end
where tile_key in (
  'about','committee','deities','calendar','timings',
  'sevas','prayers','fridayAnnathanam','membership','gallery'
);
