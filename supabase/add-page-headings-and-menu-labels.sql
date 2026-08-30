-- ============================================================
-- Add "Page Headings" AND "Menu Labels" — makes every screen's
-- title + subtitle (e.g. "Temple Management Committee" / "Meet the
-- committee members serving...") AND every side-menu item's text
-- (e.g. "Temple Committee") editable from /cms.html instead of only
-- through a code change.
--
-- Creates two tables — page_headings (12 rows, one per screen with
-- a title/subtitle) and menu_labels (13 rows, one per side-menu
-- item, including Home) — each editable but not addable/deletable
-- from the CMS, since the set of screens/menu items is fixed by the
-- app itself. Seeds every row with the exact text the site already
-- shows, so running this changes nothing on the live site until you
-- actually edit something in the new "Page Headings" or "Menu
-- Labels" tabs.
--
-- Run this once in Supabase (Dashboard → SQL Editor → New query →
-- paste this → Run). Safe to re-run:
--   - "create table if not exists" won't error if already applied.
--   - Every insert uses "on conflict (screen_key) do nothing" — it
--     will never overwrite a heading/label you've already edited.
-- ============================================================

create table if not exists page_headings (
  id          bigint generated always as identity primary key,
  screen_key  text unique not null,
  heading_en  text not null default '',
  heading_bm  text not null default '',
  heading_ta  text not null default '',
  sub_en      text not null default '',
  sub_bm      text not null default '',
  sub_ta      text not null default '',
  updated_at  timestamptz not null default now()
);
alter table page_headings enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'page_headings_set_updated_at'
  ) then
    create trigger page_headings_set_updated_at before update on page_headings
      for each row execute function set_updated_at();
  end if;
end $$;

create table if not exists menu_labels (
  id          bigint generated always as identity primary key,
  screen_key  text unique not null,
  label_en    text not null default '',
  label_bm    text not null default '',
  label_ta    text not null default '',
  updated_at  timestamptz not null default now()
);
alter table menu_labels enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'menu_labels_set_updated_at'
  ) then
    create trigger menu_labels_set_updated_at before update on menu_labels
      for each row execute function set_updated_at();
  end if;
end $$;

insert into page_headings (screen_key, heading_en, heading_bm, heading_ta, sub_en, sub_bm, sub_ta) values ('about', 'About the Temple', 'Tentang Kuil', 'கோயில் பற்றி', 'History, vision, and daily life at Sri Subramaniar Alayam.', 'Sejarah, visi, dan kehidupan seharian di Sri Subramaniar Alayam.', 'ஸ்ரீ சுப்ரமணியர் ஆலயத்தின் வரலாறு, நோக்கம் மற்றும் அன்றாட வாழ்க்கை.') on conflict (screen_key) do nothing;
insert into page_headings (screen_key, heading_en, heading_bm, heading_ta, sub_en, sub_bm, sub_ta) values ('committee', 'Temple Management Committee', 'Jawatankuasa Pengurusan Kuil', 'கோயில் நிர்வாகக் குழு', 'Meet the committee members serving Sri Subramaniar Alayam.', 'Kenali ahli jawatankuasa yang berkhidmat di Sri Subramaniar Alayam.', 'ஸ்ரீ சுப்ரமணியர் ஆலயத்தில் பணியாற்றும் குழு உறுப்பினர்களை அறிந்து கொள்ளுங்கள்.') on conflict (screen_key) do nothing;
insert into page_headings (screen_key, heading_en, heading_bm, heading_ta, sub_en, sub_bm, sub_ta) values ('deities', 'Deities', 'Dewa-Dewi', 'தெய்வங்கள்', 'Sri Subramaniar and the shrines within our temple complex.', 'Sri Subramaniar dan dewa-dewi lain di dalam kompleks kuil kami.', 'எங்கள் கோயில் வளாகத்தில் உள்ள ஸ்ரீ சுப்ரமணியரும் பிற தெய்வங்களும்.') on conflict (screen_key) do nothing;
insert into page_headings (screen_key, heading_en, heading_bm, heading_ta, sub_en, sub_bm, sub_ta) values ('calendar', 'Event Calendar', 'Kalendar Acara', 'நிகழ்வு நாட்காட்டி', 'Upcoming poojas, festivals, and special events.', 'Pooja, perayaan dan acara khas akan datang.', 'வரவிருக்கும் பூஜைகள், திருவிழாக்கள் மற்றும் சிறப்பு நிகழ்வுகள்.') on conflict (screen_key) do nothing;
insert into page_headings (screen_key, heading_en, heading_bm, heading_ta, sub_en, sub_bm, sub_ta) values ('timings', 'Pooja Timings', 'Waktu Pooja', 'பூஜை நேரங்கள்', 'Daily schedule of poojas and special-day timings.', 'Jadual harian pooja dan waktu hari khas.', 'தினசரி பூஜை அட்டவணை மற்றும் சிறப்பு நாள் நேரங்கள்.') on conflict (screen_key) do nothing;
insert into page_headings (screen_key, heading_en, heading_bm, heading_ta, sub_en, sub_bm, sub_ta) values ('gallery', 'Gallery', 'Galeri', 'படத்தொகுப்பு', 'Moments from festivals, poojas, and community events.', 'Detik-detik daripada perayaan, pooja, dan acara komuniti.', 'திருவிழாக்கள், பூஜைகள் மற்றும் சமூக நிகழ்வுகளின் தருணங்கள்.') on conflict (screen_key) do nothing;
insert into page_headings (screen_key, heading_en, heading_bm, heading_ta, sub_en, sub_bm, sub_ta) values ('sevas', 'Sevas & Donations', 'Seva & Derma', 'சேவை & நன்கொடை', 'Support the temple through sevas, sponsorships, and donations.', 'Sokong kuil melalui seva, penajaan, dan derma.', 'சேவைகள், நிதியுதவி மற்றும் நன்கொடைகள் மூலம் கோயிலுக்கு ஆதரவளியுங்கள்.') on conflict (screen_key) do nothing;
insert into page_headings (screen_key, heading_en, heading_bm, heading_ta, sub_en, sub_bm, sub_ta) values ('news', 'News & Announcements', 'Berita & Pengumuman', 'செய்திகள் & அறிவிப்புகள்', 'The latest updates from the temple.', 'Kemas kini terkini daripada kuil.', 'கோயிலின் சமீபத்திய புதுப்பிப்புகள்.') on conflict (screen_key) do nothing;
insert into page_headings (screen_key, heading_en, heading_bm, heading_ta, sub_en, sub_bm, sub_ta) values ('membership', 'Membership Status', 'Status Keahlian', 'உறுப்பினர் நிலை', 'Enter your Membership No. to check your temple membership status.', 'Masukkan No. Keahlian anda untuk menyemak status keahlian kuil anda.', 'உங்கள் கோயில் உறுப்பினர் நிலையைச் சரிபார்க்க உங்கள் உறுப்பினர் எண்ணை உள்ளிடவும்.') on conflict (screen_key) do nothing;
insert into page_headings (screen_key, heading_en, heading_bm, heading_ta, sub_en, sub_bm, sub_ta) values ('contact', 'Contact Us', 'Hubungi Kami', 'தொடர்பு கொள்ள', 'Visit, call, or write to us.', 'Datang melawat, hubungi, atau tulis kepada kami.', 'வருகை தரவும், அழைக்கவும், அல்லது எழுதவும்.') on conflict (screen_key) do nothing;
insert into page_headings (screen_key, heading_en, heading_bm, heading_ta, sub_en, sub_bm, sub_ta) values ('prayers', 'Annual Prayers & Registration', 'Pooja Tahunan & Pendaftaran', 'ஆண்டு பூஜைகள் & பதிவு', 'Sponsor a pooja as Ubayakarar or Annathanam sponsor, or register as a participant.', 'Taja pooja sebagai Ubayakarar atau penaja Annathanam, atau daftar sebagai peserta.', 'உபயகாரராகவோ அன்னதான நிதியுதவியாளராகவோ பூஜையை நிதியுதவி செய்யுங்கள், அல்லது பங்கேற்பாளராக பதிவு செய்யுங்கள்.') on conflict (screen_key) do nothing;
insert into page_headings (screen_key, heading_en, heading_bm, heading_ta, sub_en, sub_bm, sub_ta) values ('fridayAnnathanam', 'Weekly Friday Pooja Annathanam', 'Annathanam Pooja Jumaat Mingguan', 'வாராந்திர வெள்ளி பூஜை அன்னதானம்', 'RM 250 sponsors the temple''s Annathanam meal for one Friday. Choose any open Friday below to sponsor it — payment is by bank transfer or DuitNow QR.', 'RM 250 menaja hidangan Annathanam kuil untuk satu hari Jumaat. Pilih mana-mana hari Jumaat yang terbuka di bawah untuk menajanya — pembayaran melalui pindahan bank atau QR DuitNow.', 'RM 250 கோயிலின் ஒரு வெள்ளிக்கிழமை அன்னதான உணவை நிதியுதவி செய்கிறது. கீழே திறந்துள்ள எந்த வெள்ளிக்கிழமையையும் தேர்ந்தெடுத்து நிதியுதவி செய்யுங்கள் — வங்கி பரிமாற்றம் அல்லது DuitNow QR மூலம் பணம் செலுத்தலாம்.') on conflict (screen_key) do nothing;

insert into menu_labels (screen_key, label_en, label_bm, label_ta) values ('home', 'Home', 'Utama', 'முகப்பு') on conflict (screen_key) do nothing;
insert into menu_labels (screen_key, label_en, label_bm, label_ta) values ('about', 'About Temple', 'Tentang Kuil', 'கோயில் பற்றி') on conflict (screen_key) do nothing;
insert into menu_labels (screen_key, label_en, label_bm, label_ta) values ('committee', 'Temple Committee', 'Jawatankuasa Kuil', 'கோயில் குழு') on conflict (screen_key) do nothing;
insert into menu_labels (screen_key, label_en, label_bm, label_ta) values ('deities', 'Deities', 'Dewa-Dewi', 'தெய்வங்கள்') on conflict (screen_key) do nothing;
insert into menu_labels (screen_key, label_en, label_bm, label_ta) values ('calendar', 'Event Calendar', 'Kalendar Acara', 'நிகழ்வு நாட்காட்டி') on conflict (screen_key) do nothing;
insert into menu_labels (screen_key, label_en, label_bm, label_ta) values ('timings', 'Pooja Timings', 'Waktu Pooja', 'பூஜை நேரங்கள்') on conflict (screen_key) do nothing;
insert into menu_labels (screen_key, label_en, label_bm, label_ta) values ('gallery', 'Gallery', 'Galeri', 'படத்தொகுப்பு') on conflict (screen_key) do nothing;
insert into menu_labels (screen_key, label_en, label_bm, label_ta) values ('sevas', 'Sevas & Donations', 'Seva & Derma', 'சேவை & நன்கொடை') on conflict (screen_key) do nothing;
insert into menu_labels (screen_key, label_en, label_bm, label_ta) values ('prayers', 'Prayers & Registration', 'Pooja Tahunan & Pendaftaran', 'ஆண்டு பூஜைகள் & பதிவு') on conflict (screen_key) do nothing;
insert into menu_labels (screen_key, label_en, label_bm, label_ta) values ('fridayAnnathanam', 'Friday Annathanam', 'Annathanam Jumaat', 'வெள்ளி அன்னதானம்') on conflict (screen_key) do nothing;
insert into menu_labels (screen_key, label_en, label_bm, label_ta) values ('news', 'News & Announcements', 'Berita & Pengumuman', 'செய்திகள் & அறிவிப்புகள்') on conflict (screen_key) do nothing;
insert into menu_labels (screen_key, label_en, label_bm, label_ta) values ('membership', 'Membership Status', 'Status Keahlian', 'உறுப்பினர் நிலை') on conflict (screen_key) do nothing;
insert into menu_labels (screen_key, label_en, label_bm, label_ta) values ('contact', 'Contact Us', 'Hubungi Kami', 'தொடர்பு கொள்ள') on conflict (screen_key) do nothing;
