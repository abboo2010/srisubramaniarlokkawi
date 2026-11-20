-- ============================================================
-- Add "News & Announcements" and "Contact Us" home-screen tiles,
-- placed at the end (after Gallery). Run once in Supabase
-- (Dashboard -> SQL Editor -> New query -> paste -> Run).
-- Safe to re-run: inserts use "on conflict (tile_key) do nothing" and
-- the UPDATE sets fixed positions, touching only sort_order (any title /
-- description edits made in /cms.html's Home Tiles tab are left alone).
-- ============================================================

insert into nav_tiles (tile_key, icon, title_en, title_bm, title_ta, desc_en, desc_bm, desc_ta, destination, enabled, sort_order)
values
 ('news', 'news',
  'News & Announcements', 'Berita & Pengumuman', 'செய்திகள் & அறிவிப்புகள்',
  'Latest Updates from the Temple', 'Kemas Kini Terkini dari Kuil', 'கோயிலின் சமீபத்திய தகவல்கள்',
  'news', true, 10),
 ('contact', 'contact',
  'Contact Us', 'Hubungi Kami', 'தொடர்பு கொள்ள',
  'Address, Phone & WhatsApp', 'Alamat, Telefon & WhatsApp', 'முகவரி, தொலைபேசி & WhatsApp',
  'contact', true, 11)
on conflict (tile_key) do nothing;

update nav_tiles set sort_order = case tile_key
  when 'about' then 0 when 'committee' then 1 when 'deities' then 2
  when 'calendar' then 3 when 'timings' then 4 when 'sevas' then 5
  when 'prayers' then 6 when 'fridayAnnathanam' then 7 when 'membership' then 8
  when 'gallery' then 9 when 'news' then 10 when 'contact' then 11
  else sort_order
end
where tile_key in ('about','committee','deities','calendar','timings','sevas',
  'prayers','fridayAnnathanam','membership','gallery','news','contact');
