-- ============================================================
-- Malay (BM) wording fix — Malaysian Malay (step 2)
--
-- Run once in Supabase → SQL Editor → New query → paste → Run.
--
-- SAFE TO RE-RUN, and it never overwrites your own edits: every
-- statement only changes a row if the text is still EXACTLY the old
-- wording. If the committee already edited a line in /cms.html, that
-- row is skipped and keeps what they wrote.
-- ============================================================

-- ---------- Page sub-headings (page_headings.sub_bm) ----------
update page_headings set sub_bm = 'Pooja, perayaan dan acara khas yang akan datang.'
  where screen_key = 'calendar' and sub_bm = 'Pooja, perayaan dan acara khas akan datang.';

update page_headings set sub_bm = 'Jadual pooja harian dan waktu pada hari-hari istimewa.'
  where screen_key = 'timings' and sub_bm = 'Jadual harian pooja dan waktu hari khas.';

update page_headings set sub_bm = 'Detik-detik berharga daripada perayaan, pooja dan acara komuniti.'
  where screen_key = 'gallery' and sub_bm = 'Detik-detik daripada perayaan, pooja, dan acara komuniti.';

update page_headings set sub_bm = 'Perkembangan terkini daripada pihak kuil.'
  where screen_key = 'news' and sub_bm = 'Kemas kini terkini daripada kuil.';

update page_headings set sub_bm = 'Masukkan No. Keahlian anda untuk menyemak status keahlian anda di kuil.'
  where screen_key = 'membership' and sub_bm = 'Masukkan No. Keahlian anda untuk menyemak status keahlian kuil anda.';

update page_headings set sub_bm = 'Datanglah melawat, hubungi atau hantar mesej kepada kami.'
  where screen_key = 'contact' and sub_bm = 'Datang melawat, hubungi, atau tulis kepada kami.';

update page_headings
  set sub_bm = 'Penajaan hidangan Annathanam kuil untuk satu hari Jumaat berharga RM 250. Pilih mana-mana hari Jumaat yang masih terbuka di bawah — pembayaran melalui pemindahan bank atau QR DuitNow.'
  where screen_key = 'fridayAnnathanam'
    and sub_bm = 'RM 250 menaja hidangan Annathanam kuil untuk satu hari Jumaat. Pilih mana-mana hari Jumaat yang terbuka di bawah untuk menajanya — pembayaran melalui pindahan bank atau QR DuitNow.';

-- ---------- Top ticker notice (site_ticker.message_bm) ----------
update site_ticker
  set message_bm = replace(replace(replace(message_bm,
      'LAMAN WEB DALAM PEMBINAAN', 'LAMAN WEB MASIH DALAM PEMBINAAN'),
      'untuk tujuan ujian/rujukan sahaja', 'untuk ujian/rujukan sahaja'),
      'Sila jangan anggap ia sebagai rasmi atau muktamad.', 'Sila jangan menganggapnya sebagai maklumat rasmi atau muktamad.')
  where id = 1;

-- ---------- WhatsApp widget button ----------
update whatsapp_widget set button_label_bm = 'Berbual Dengan Kami'
  where button_label_bm = 'Chat Dengan Kami';

-- ---------- Deities: Sri Nagamma is a goddess (Dewi), not Dewa ----------
update deities set role_bm = 'Kuil Dewi Ular'
  where role_bm = 'Kuil Dewa Ular';

-- ---------- About page ----------
-- "MYR" -> "RM" (the form used in Malaysia); two small grammar/wording fixes.
update about_page
  set history_bm    = replace(history_bm, 'MYR 30,000.00', 'RM30,000.00'),
      mission_bm    = replace(mission_bm, 'serta mengekal dan mengembangkan', 'serta mengekalkan dan mengembangkan'),
      activities_bm = replace(activities_bm, 'Pemerhatian Skanda Sashti Viratham', 'Puasa Skanda Sashti (Viratham)')
  where id = 1;

-- ---------- Report what changed (should list the rows above) ----------
select 'page_headings' as table_name, screen_key as row_ref, sub_bm as new_text
  from page_headings
  where screen_key in ('calendar','timings','gallery','news','membership','contact','fridayAnnathanam')
union all select 'site_ticker', 'message', message_bm from site_ticker where id = 1
union all select 'deities', name_en, role_bm from deities where name_en ilike '%Nagamma%';
