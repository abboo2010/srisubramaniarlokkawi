-- ============================================================
-- cms-seed.sql — migrates the site's REAL current content (live
-- Google Sheet values as of 2026-08-25, plus bundled deities/
-- sevas/announcements/gallery/about text) into the new CMS
-- tables, so the CMS starts populated instead of empty.
--
-- Run this after cms-schema.sql, in the Supabase SQL Editor.
--
-- Safe to re-run: every list-table insert (nav_tiles, deities,
-- pooja_timings, sevas, announcements, gallery) uses "on conflict do
-- nothing" against a unique constraint on that table's natural key
-- (name_en, or list_type+name_en for pooja_timings, etc. — see
-- dedupe-content-tables.sql, which adds those constraints and is a
-- prerequisite for this file's "on conflict" clauses to work). The
-- singleton tables (hero_banner/about_page/contact_info) use upsert
-- and were always safe to re-run.
--
-- (Earlier versions of this file had no such protection — re-running
-- them silently duplicated every list-table row. If you're looking
-- at data that has duplicate deities/timings/sevas/announcements/
-- gallery items from before, run dedupe-content-tables.sql once to
-- clean that up.)
--
-- On a database that already has gallery photos from before the
-- Category > Folder hierarchy existed, run migrate-gallery-hierarchy.sql
-- instead of relying on this file — it carries your existing photos
-- over into matching Categories/Folders rather than starting fresh.
-- ============================================================

-- ---------- hero_banner ----------
insert into hero_banner (id, eyebrow_en, eyebrow_bm, eyebrow_ta,
  title_line1_en, title_line1_bm, title_line1_ta, title_line2_en, title_line2_bm, title_line2_ta,
  established_value, established_label_en, established_label_bm, established_label_ta,
  devotees_value, devotees_label_en, devotees_label_bm, devotees_label_ta,
  annual_events_value, annual_events_label_en, annual_events_label_bm, annual_events_label_ta,
  upcoming_events_label_en, upcoming_events_label_bm, upcoming_events_label_ta, upcoming_events_link,
  pooja_timings_label_en, pooja_timings_label_bm, pooja_timings_label_ta, pooja_timings_link,
  image_url)
values (1, 'Welcome to', 'Selamat Datang ke', 'வருக வருக வணக்கம்',
  'Sri Subramaniar Alayam', 'Sri Subramaniar Alayam', 'ஸ்ரீ சுப்ரமணியர் ஆலயம்',
  'Lok Kawi', 'Lok Kawi', 'லோக் காவி',
  '1969', 'Established', 'Ditubuhkan', 'நிறுவப்பட்ட ஆண்டு',
  '10K+', 'Devotees', 'Penganut', 'பக்தர்கள்',
  '5+', 'Annual Events', 'Acara Tahunan', 'ஆண்டு நிகழ்வுகள்',
  'Upcoming Events', 'Acara Akan Datang', 'எதிர்வரும் நிகழ்வுகள்', 'calendar',
  'Pooja Timings', 'Waktu Pooja', 'பூஜை நேரங்கள்', 'timings',
  'assets/hero-banner.jpg')
on conflict (id) do update set
  eyebrow_en=excluded.eyebrow_en, eyebrow_bm=excluded.eyebrow_bm, eyebrow_ta=excluded.eyebrow_ta,
  title_line1_en=excluded.title_line1_en, title_line1_bm=excluded.title_line1_bm, title_line1_ta=excluded.title_line1_ta,
  title_line2_en=excluded.title_line2_en, title_line2_bm=excluded.title_line2_bm, title_line2_ta=excluded.title_line2_ta,
  established_value=excluded.established_value, established_label_en=excluded.established_label_en,
  established_label_bm=excluded.established_label_bm, established_label_ta=excluded.established_label_ta,
  devotees_value=excluded.devotees_value, devotees_label_en=excluded.devotees_label_en,
  devotees_label_bm=excluded.devotees_label_bm, devotees_label_ta=excluded.devotees_label_ta,
  annual_events_value=excluded.annual_events_value, annual_events_label_en=excluded.annual_events_label_en,
  annual_events_label_bm=excluded.annual_events_label_bm, annual_events_label_ta=excluded.annual_events_label_ta,
  upcoming_events_label_en=excluded.upcoming_events_label_en, upcoming_events_label_bm=excluded.upcoming_events_label_bm,
  upcoming_events_label_ta=excluded.upcoming_events_label_ta, upcoming_events_link=excluded.upcoming_events_link,
  pooja_timings_label_en=excluded.pooja_timings_label_en, pooja_timings_label_bm=excluded.pooja_timings_label_bm,
  pooja_timings_label_ta=excluded.pooja_timings_label_ta, pooja_timings_link=excluded.pooja_timings_link;

-- ---------- nav_tiles ----------
insert into nav_tiles (tile_key, icon, title_en, title_bm, title_ta, desc_en, desc_bm, desc_ta, destination, enabled, sort_order) values ('about', 'about', 'About Temple', 'Tentang Kuil', 'கோயில் பற்றி', 'History, Vision & Temple Activities', 'Sejarah, Visi & Aktiviti Kuil', 'வரலாறு, நோக்கம் & கோயில் நடவடிக்கைகள்', 'about', true, 0) on conflict (tile_key) do nothing;
insert into nav_tiles (tile_key, icon, title_en, title_bm, title_ta, desc_en, desc_bm, desc_ta, destination, enabled, sort_order) values ('deities', 'deities', 'Deities', 'Dewa-Dewi', 'தெய்வங்கள்', 'Sri Subramaniar & Other Deities', 'Sri Subramaniar & Dewa-Dewi Lain', 'ஸ்ரீ சுப்ரமணியர் & பிற தெய்வங்கள்', 'deities', true, 1) on conflict (tile_key) do nothing;
insert into nav_tiles (tile_key, icon, title_en, title_bm, title_ta, desc_en, desc_bm, desc_ta, destination, enabled, sort_order) values ('calendar', 'calendar', 'Event Calendar', 'Kalendar Acara', 'நிகழ்வு நாட்காட்டி', 'Poojas, Festivals & Special Events', 'Pooja, Perayaan & Acara Khas', 'பூஜைகள், திருவிழாக்கள் & சிறப்பு நிகழ்வுகள்', 'calendar', true, 2) on conflict (tile_key) do nothing;
insert into nav_tiles (tile_key, icon, title_en, title_bm, title_ta, desc_en, desc_bm, desc_ta, destination, enabled, sort_order) values ('timings', 'timings', 'Pooja Timings', 'Waktu Pooja', 'பூஜை நேரங்கள்', 'Daily Pooja & Darshan Timings', 'Waktu Pooja Harian & Darshan', 'தினசரி பூஜை & தரிசன நேரங்கள்', 'timings', true, 3) on conflict (tile_key) do nothing;
insert into nav_tiles (tile_key, icon, title_en, title_bm, title_ta, desc_en, desc_bm, desc_ta, destination, enabled, sort_order) values ('sevas', 'sevas', 'Sevas & Donations', 'Seva & Derma', 'சேவை & நன்கொடை', 'Support Temple & Sevas', 'Sokong Kuil & Seva', 'கோயிலுக்கும் சேவைகளுக்கும் ஆதரவு', 'sevas', true, 4) on conflict (tile_key) do nothing;
insert into nav_tiles (tile_key, icon, title_en, title_bm, title_ta, desc_en, desc_bm, desc_ta, destination, enabled, sort_order) values ('prayers', 'prayers', 'Prayers & Registration', 'Pooja Tahunan & Pendaftaran', 'ஆண்டு பூஜைகள் & பதிவு', 'Sponsor or Join a Pooja', 'Taja atau Sertai Pooja', 'பூஜையை நிதியுதவி செய்ய அல்லது பங்கேற்க', 'prayers', true, 5) on conflict (tile_key) do nothing;
insert into nav_tiles (tile_key, icon, title_en, title_bm, title_ta, desc_en, desc_bm, desc_ta, destination, enabled, sort_order) values ('fridayAnnathanam', 'fridayAnnathanam', 'Friday Annathanam', 'Annathanam Jumaat', 'வெள்ளி அன்னதானம்', 'Sponsor a Weekly Friday Meal', 'Taja Hidangan Jumaat Mingguan', 'வாராந்திர வெள்ளி உணவை நிதியுதவி செய்ய', 'fridayAnnathanam', true, 6) on conflict (tile_key) do nothing;

-- ---------- about_page ----------
insert into about_page (id, vision_en, vision_bm, vision_ta, mission_en, mission_bm, mission_ta,
  history_en, history_bm, history_ta, activities_en, activities_bm, activities_ta)
values (1, 'To remain the spiritual home of the Hindu community in Sabah — a temple where the devotion first kindled by the Hindu soldiers of Lok Kawi in 1970 continues to grow, and where every generation that follows finds a place to worship Lord Murugan, celebrate their traditions, and belong.', 'Untuk terus menjadi rumah kerohanian masyarakat Hindu di Sabah — sebuah kuil di mana semangat pengabdian yang mula dinyalakan oleh Askar Hindu Lok Kawi pada tahun 1970 terus berkembang, dan setiap generasi seterusnya menemui tempat untuk menyembah Dewa Murugan, meraikan tradisi mereka, dan berasa memiliki.', 'சபாவில் உள்ள இந்து சமூகத்தின் ஆன்மீக இல்லமாக தொடர்ந்து விளங்குவது — 1970ஆம் ஆண்டு லோக் காவி இந்து வீரர்களால் முதன்முதலில் தூண்டப்பட்ட பக்தி தொடர்ந்து வளரும் ஒரு கோயில், அடுத்து வரும் ஒவ்வொரு தலைமுறையினரும் முருகப்பெருமானை வழிபடவும், தங்கள் பாரம்பரியங்களைக் கொண்டாடவும், சொந்தமாக உணரவும் ஒரு இடத்தைக் காணும் கோயில்.',
  'To conduct daily poojas and abhishekams with sincerity and discipline; to keep Hindu festivals, Tamil language, and culture alive for younger devotees; to welcome all who seek blessings, community, or a meal at our Annadhanam table; and to sustain and grow this temple through the same spirit of gotong-royong that built it.', 'Menjalankan pooja dan abhishekam harian dengan penuh keikhlasan dan disiplin; mengekalkan perayaan Hindu, bahasa Tamil, dan budaya untuk generasi penganut yang lebih muda; menyambut semua yang mencari keberkatan, komuniti, atau hidangan di meja Annadhanam kami; serta mengekal dan mengembangkan kuil ini melalui semangat gotong-royong yang sama yang membinanya.', 'தினசரி பூஜைகளையும் அபிஷேகங்களையும் நேர்மையுடனும் ஒழுக்கத்துடனும் நடத்துவது; இந்து திருவிழாக்களையும் தமிழ் மொழியையும் பண்பாட்டையும் இளம் பக்தர்களுக்காக உயிர்ப்புடன் வைத்திருப்பது; ஆசி, சமூகம் அல்லது எங்கள் அன்னதான மேசையில் உணவு தேடி வரும் அனைவரையும் வரவேற்பது; மற்றும் இக்கோயிலைக் கட்டியெழுப்பிய அதே கூட்டுழைப்பு உணர்வுடன் அதை நிலைநிறுத்தி வளர்ப்பது.',
  'Although Hindus worked and lived in Sabah since the 18th century (then British North Borneo) they had no common place of worship established at that time. It was then in 1969 a committee was established to seek funds and built a place for worshipping. The process was slow due to lack of funds and other difficult circumstances which then prevailed. At that time the Armed Forces were moved into Lok Kawi and a piece of land was earmarked for a temple to serve the Hindu Soldiers. With the effort of the Hindu Soldiers, a temple was constructed mainly on gotong-royong (housekeeping) basis in 1970. The temple building was a semi-permanent structure with zinc sheet roofing.

Prayers were conducted on a regular basis at the temple. Thaipoosam and other festivals are celebrated on a grand scale at the time. However, during the early eighties, floods became a major problem. At first, it was only a nuisance but as the surrounding areas were developed for industries and housing purposes, the frequency and duration of flooding have increased.

This had not only caused damages but had interrupted prayers as well. The Hindu Community in Kota Kinabalu collected funds from devotees and spent MYR 30,000.00 to raise the floor level by 1" – 6" and carried out the other urgent repairs. This interim measure was satisfactory for about five years only and the need to do something more permanent was apparent.

It was then decided that the temple be reconstructed at a higher level and with a traditional "Gopuram". A fundraising drive was launched and at the same time, an appeal was made to the State and Federal Government.

On the 29th of April 1990, the temple "Balastanam" ceremony was carried out. The old temple was demolished and the earthworks commenced on the 3rd of July 1990. The consecration ceremony of the temple was carried out on the 21st of June 1992. Financial support from the Hindu Community, the general public, and the State Government was overwhelming. The reconstruction works had taken approximately 2 Years and 2 Months to complete.

Second Maha Kumbhabhishekham was carried out on the 17th of January 2005.', 'Walaupun masyarakat Hindu telah bekerja dan menetap di Sabah sejak abad ke-18 (ketika itu dikenali sebagai Borneo Utara British), mereka tidak mempunyai tempat ibadat bersama pada masa itu. Pada tahun 1969, satu jawatankuasa ditubuhkan untuk mengumpul dana dan membina tempat beribadat. Proses ini berjalan perlahan disebabkan kekurangan dana dan pelbagai kesukaran lain ketika itu. Pada masa yang sama, Angkatan Tentera dipindahkan ke Lok Kawi dan sebidang tanah diperuntukkan untuk membina kuil bagi Askar Hindu. Dengan usaha Askar Hindu, sebuah kuil dibina secara gotong-royong pada tahun 1970. Bangunan kuil itu berbentuk struktur separuh kekal dengan bumbung zink.

Doa dijalankan secara berkala di kuil ini. Thaipoosam dan perayaan lain disambut secara besar-besaran ketika itu. Namun, pada awal lapan puluhan, banjir menjadi masalah utama. Pada mulanya ia hanya gangguan kecil, tetapi apabila kawasan sekeliling dimajukan untuk tujuan perindustrian dan perumahan, kekerapan dan tempoh banjir semakin meningkat.

Ini bukan sahaja menyebabkan kerosakan tetapi turut mengganggu upacara doa. Masyarakat Hindu di Kota Kinabalu mengumpul dana daripada penganut dan membelanjakan MYR 30,000.00 untuk menaikkan aras lantai sebanyak 1 – 6 inci serta menjalankan pembaikan segera yang lain. Langkah sementara ini hanya memuaskan untuk tempoh kira-kira lima tahun sahaja, dan keperluan untuk penyelesaian yang lebih kekal menjadi jelas.

Maka diputuskan agar kuil dibina semula pada aras yang lebih tinggi dengan "Gopuram" tradisional. Satu kempen kutipan dana dilancarkan, dan pada masa yang sama, rayuan turut dibuat kepada Kerajaan Negeri dan Persekutuan.

Pada 29 April 1990, upacara "Balastanam" kuil telah dijalankan. Kuil lama dirobohkan dan kerja tanah bermula pada 3 Julai 1990. Upacara pentahbisan kuil dijalankan pada 21 Jun 1992. Sokongan kewangan daripada masyarakat Hindu, orang ramai, dan Kerajaan Negeri amat menggalakkan. Kerja pembinaan semula mengambil masa lebih kurang 2 tahun 2 bulan untuk disiapkan.

Maha Kumbhabhishekham kedua telah diadakan pada 17 Januari 2005.', '18ஆம் நூற்றாண்டு முதலே (அப்போது பிரிட்டிஷ் வட போர்னியோ என அழைக்கப்பட்ட) சபாவில் இந்துக்கள் வாழ்ந்து பணியாற்றி வந்தாலும், அவர்களுக்கென பொதுவான வழிபாட்டுத் தலம் எதுவும் அப்போது இருக்கவில்லை. 1969ஆம் ஆண்டு நிதி திரட்டி வழிபாட்டுத் தலம் ஒன்றை அமைக்க ஒரு குழு உருவாக்கப்பட்டது. நிதிப் பற்றாக்குறை மற்றும் பிற கடினமான சூழ்நிலைகளால் இப்பணி மெதுவாக நடைபெற்றது. அந்த நேரத்தில் ஆயுதப் படைகள் லோக் காவிக்கு இடமாற்றம் செய்யப்பட்டதால், இந்து வீரர்களுக்காக ஒரு கோயில் அமைக்க ஒரு நிலம் ஒதுக்கப்பட்டது. இந்து வீரர்களின் முயற்சியால், 1970ஆம் ஆண்டு பெரும்பாலும் கூட்டுழைப்பு (gotong-royong) அடிப்படையில் ஒரு கோயில் கட்டப்பட்டது. கோயில் கட்டிடம் துத்தநாக தகடு கூரையுடன் அரை-நிரந்தர கட்டமைப்பாக இருந்தது.

கோயிலில் தொடர்ந்து பிரார்த்தனைகள் நடத்தப்பட்டன. தைப்பூசம் மற்றும் பிற திருவிழாக்கள் அப்போது பிரமாண்டமாக கொண்டாடப்பட்டன. எனினும், எண்பதுகளின் தொடக்கத்தில், வெள்ளம் ஒரு பெரிய பிரச்சினையாக மாறியது. முதலில் இது ஒரு தொல்லையாக மட்டுமே இருந்தது, ஆனால் சுற்றியுள்ள பகுதிகள் தொழில் மற்றும் வீட்டுவசதி நோக்கங்களுக்காக மேம்படுத்தப்பட்டதால், வெள்ளத்தின் அதிர்வெண்ணும் காலஅளவும் அதிகரித்தன.

இது சேதங்களை மட்டுமல்ல, பிரார்த்தனைகளையும் இடையூறு செய்தது. கோட்டா கினபாலு இந்து சமூகத்தினர் பக்தர்களிடமிருந்து நிதி திரட்டி, தரை மட்டத்தை 1 – 6 அங்குலம் உயர்த்தவும் மற்ற அவசர பழுதுபார்ப்புகளை மேற்கொள்ளவும் MYR 30,000.00 செலவிட்டனர். இந்த தற்காலிக நடவடிக்கை சுமார் ஐந்து ஆண்டுகள் மட்டுமே திருப்திகரமாக இருந்தது, மேலும் நிரந்தரமான ஒரு தீர்வு தேவை என்பது தெளிவானது.

அதன் பிறகு, கோயிலை உயர்ந்த மட்டத்தில் பாரம்பரிய "கோபுரத்துடன்" மறுகட்டமைக்க முடிவு செய்யப்பட்டது. நிதி திரட்டும் பணி தொடங்கப்பட்டதுடன், மாநில மற்றும் மத்திய அரசுக்கும் முறையீடு செய்யப்பட்டது.

1990ஆம் ஆண்டு ஏப்ரல் 29ஆம் தேதி கோயிலின் "பாலஸ்தானம்" சடங்கு நடத்தப்பட்டது. பழைய கோயில் இடிக்கப்பட்டு, 1990 ஜூலை 3ஆம் தேதி மண் வேலைகள் தொடங்கின. கோயிலின் குடமுழுக்கு விழா 1992 ஜூன் 21ஆம் தேதி நடத்தப்பட்டது. இந்து சமூகம், பொது மக்கள் மற்றும் மாநில அரசிடமிருந்து பெறப்பட்ட நிதி ஆதரவு மகத்தானதாக இருந்தது. மறுகட்டமைப்புப் பணிகள் நிறைவடைய சுமார் 2 ஆண்டுகள் 2 மாதங்கள் ஆயின.

இரண்டாவது மகா கும்பாபிஷேகம் 2005ஆம் ஆண்டு ஜனவரி 17ஆம் தேதி நடத்தப்பட்டது.',
  'Daily poojas and abhishekams
Annual Thaipusam procession
Skanda Sashti Viratham observances
Free Annadhanam (community meals) on select days
Tamil language and cultural classes for children
Youth and elders'' devotional groups', 'Pooja dan abhishekam harian
Perarakan Thaipusam tahunan
Pemerhatian Skanda Sashti Viratham
Annadhanam (hidangan komuniti) percuma pada hari tertentu
Kelas bahasa Tamil dan kebudayaan untuk kanak-kanak
Kumpulan kebaktian belia dan warga emas', 'தினசரி பூஜைகளும் அபிஷேகங்களும்
ஆண்டுதோறும் தைப்பூசம் ஊர்வலம்
கந்த சஷ்டி விரதம் அனுஷ்டிப்பு
தேர்ந்தெடுக்கப்பட்ட நாட்களில் இலவச அன்னதானம்
குழந்தைகளுக்கான தமிழ் மொழி மற்றும் பண்பாட்டு வகுப்புகள்
இளையோர் மற்றும் மூத்தோர் பக்தி குழுக்கள்')
on conflict (id) do update set
  vision_en=excluded.vision_en, vision_bm=excluded.vision_bm, vision_ta=excluded.vision_ta,
  mission_en=excluded.mission_en, mission_bm=excluded.mission_bm, mission_ta=excluded.mission_ta,
  history_en=excluded.history_en, history_bm=excluded.history_bm, history_ta=excluded.history_ta,
  activities_en=excluded.activities_en, activities_bm=excluded.activities_bm, activities_ta=excluded.activities_ta;

-- ---------- deities (live sheet content; duplicate Navagraham row collapsed) ----------
insert into deities (name_en, name_bm, name_ta, role_en, role_bm, role_ta, description_en, description_bm, description_ta, image_url, color, sort_order) values ('Sri Subramaniar', 'Sri Subramaniar', 'ஸ்ரீ சுப்ரமணியர்', 'Presiding Deity', 'Dewa Utama', 'முதன்மைத் தெய்வம்', 'The temple''s presiding deity — son of Lord Shiva and Goddess Parvati, worshipped as the God of war and wisdom, and bearer of the sacred Vel (spear).', 'Dewa utama kuil ini — putera kepada Dewa Siva dan Dewi Parvati, disembah sebagai Dewa Perang dan Kebijaksanaan, serta pemegang Vel (lembing suci).', 'கோயிலின் முதன்மைத் தெய்வம் — சிவபெருமான் மற்றும் பார்வதி தேவியின் புதல்வர், போர் மற்றும் ஞானத்தின் கடவுளாக வழிபடப்படுபவர், புனித வேலைத் தாங்குபவர்.', 'https://lh3.googleusercontent.com/d/1hhDTPsZ8eigQaf9M6bjDbqn0OfnYzhXG=w800', '#B5651D', 0) on conflict (name_en) do nothing;
insert into deities (name_en, name_bm, name_ta, role_en, role_bm, role_ta, description_en, description_bm, description_ta, image_url, color, sort_order) values ('Sri Vinayagar', 'Sri Vinayagar', 'ஸ்ரீ விநாயகர்', 'Guardian Shrine', 'Kuil Penjaga', 'காவல் தெய்வம்', 'The remover of obstacles, traditionally worshipped first before any prayer or new undertaking begins.', 'Penghapus segala rintangan, sentiasa disembah terlebih dahulu sebelum sebarang doa atau usaha baharu dimulakan.', 'இடையூறுகளை நீக்குபவர், எந்தவொரு பிரார்த்தனையையும் புதிய காரியத்தையும் தொடங்கும் முன் முதலில் வழிபடப்படுபவர்.', 'https://lh3.googleusercontent.com/d/17Xeh_Zxqg9laag6Agq1bztnrEyxhg457=w800', '#C0392B', 1) on conflict (name_en) do nothing;
insert into deities (name_en, name_bm, name_ta, role_en, role_bm, role_ta, description_en, description_bm, description_ta, image_url, color, sort_order) values ('Sri Ambal', 'Sri Ambal', 'ஸ்ரீ அம்பாள்', 'Mother Goddess Shrine', 'Kuil Dewi Ibu', 'அன்னை தெய்வ ஆலயம்', 'The Divine Mother, embodiment of Shakti, worshipped for her protection, grace, and nurturing strength.', 'Dewi Ibu, perwujudan Shakti, disembah kerana perlindungan, keberkatan, dan kekuatan pengasuhannya.', 'அன்னை தெய்வம், சக்தியின் வடிவம், பாதுகாப்பும் அருளும் அளிப்பவளாக வழிபடப்படுபவள்.', 'https://lh3.googleusercontent.com/d/1hhDTPsZ8eigQaf9M6bjDbqn0OfnYzhXG=w800', '#8E4A9E', 2) on conflict (name_en) do nothing;
insert into deities (name_en, name_bm, name_ta, role_en, role_bm, role_ta, description_en, description_bm, description_ta, image_url, color, sort_order) values ('Vasantha Mandapam', 'Vasantha Mandapam', 'வசந்த மண்டபம்', 'Ceremonial Hall', 'Dewan Istiadat', 'சடங்கு மண்டபம்', 'A ceremonial hall used for seasonal festivals, processions, and special poojas throughout the year.', 'Dewan istiadat yang digunakan untuk perayaan bermusim dan pooja khas sepanjang tahun.', 'ஆண்டு முழுவதும் நடைபெறும் பருவகால திருவிழாக்கள் மற்றும் சிறப்பு பூஜைகளுக்குப் பயன்படுத்தப்படும் சடங்கு மண்டபம்.', 'https://lh3.googleusercontent.com/d/1IWtt3rXzPATs3jWTEI8WqiUhFEhrj1dY=w800', '#B1852F', 3) on conflict (name_en) do nothing;
insert into deities (name_en, name_bm, name_ta, role_en, role_bm, role_ta, description_en, description_bm, description_ta, image_url, color, sort_order) values ('Sri Perumal', 'Sri Perumal', 'ஸ்ரீ பெருமாள்', 'Shrine', 'Kuil', 'ஆலயம்', 'Lord Vishnu, the Preserver, worshipped for protection, prosperity, and the sustaining of dharma.', 'Dewa Vishnu, Sang Pemelihara, disembah untuk perlindungan, kemakmuran dan pemeliharaan dharma.', 'காப்பாற்றுபவரான திருமால், பாதுகாப்பு, செழிப்பு மற்றும் தர்மத்தை நிலைநிறுத்துபவராக வழிபடப்படுபவர்.', 'https://lh3.googleusercontent.com/d/1hH0BFvAPyiqzQg9zdOAG8CbPHkrKLoyG=w800', '#3E7C8C', 4) on conflict (name_en) do nothing;
insert into deities (name_en, name_bm, name_ta, role_en, role_bm, role_ta, description_en, description_bm, description_ta, image_url, color, sort_order) values ('Sri Garudar', 'Sri Garudar', 'ஸ்ரீ கருடர்', 'Vahana Shrine', 'Kuil Kenderaan Suci', 'வாகன ஆலயம்', 'The divine eagle and vahana (mount) of Lord Vishnu, enshrined facing Sri Perumal as a symbol of devotion and swiftness.', 'Burung helang suci dan kenderaan (vahana) Dewa Vishnu, ditempatkan menghadap Sri Perumal sebagai lambang pengabdian dan kepantasan.', 'திருமாலின் வாகனமான திவ்விய கருடன், ஸ்ரீ பெருமாளை நோக்கி அமைக்கப்பட்டு பக்தி மற்றும் விரைவின் சின்னமாக விளங்குபவர்.', 'https://lh3.googleusercontent.com/d/1hcdojvEatMOMEcsO5-pFq5IT7XW0hTwk=w800', '#6B7A2E', 5) on conflict (name_en) do nothing;
insert into deities (name_en, name_bm, name_ta, role_en, role_bm, role_ta, description_en, description_bm, description_ta, image_url, color, sort_order) values ('Anjenayar', 'Anjenayar', 'ஆஞ்சநேயர்', 'Guardian Deity', 'Dewa Penjaga', 'காவல் தெய்வம்', 'Lord Hanuman, the devoted disciple of Lord Rama, worshipped for strength, courage, and unwavering devotion.', 'Dewa Hanuman, pengikut setia Dewa Rama, disembah kerana kekuatan, keberanian dan pengabdian yang tidak berbelah bahagi.', 'ஸ்ரீராமரின் பக்த அனுமார், வலிமை, தைரியம் மற்றும் அசைக்க முடியாத பக்திக்காக வழிபடப்படுபவர்.', 'https://lh3.googleusercontent.com/d/16v4nhWJoZDOUcatczDoTYEYLMbkWCg6U=w800', '#C1531F', 6) on conflict (name_en) do nothing;
insert into deities (name_en, name_bm, name_ta, role_en, role_bm, role_ta, description_en, description_bm, description_ta, image_url, color, sort_order) values ('Sri Nagamma', 'Sri Nagamma', 'ஸ்ரீ நாகம்மா', 'Serpent Deity Shrine', 'Kuil Dewa Ular', 'நாக தெய்வ ஆலயம்', 'The serpent deity, worshipped for fertility and protection, and to seek relief from Naga dosham.', 'Dewi ular, disembah untuk kesuburan dan perlindungan, serta bagi meredakan Naga Dosham.', 'நாக தெய்வம், கருவளம் மற்றும் பாதுகாப்பிற்காகவும், நாக தோஷ நிவர்த்திக்காகவும் வழிபடப்படுபவர்.', 'https://lh3.googleusercontent.com/d/17f8Nn_Ms_TfJXzN-0obdk3ycv7M-KjLj=w800', '#2E6F4E', 7) on conflict (name_en) do nothing;
insert into deities (name_en, name_bm, name_ta, role_en, role_bm, role_ta, description_en, description_bm, description_ta, image_url, color, sort_order) values ('Sri Arasamara Pillayar', 'Sri Arasamara Pillayar', 'ஸ்ரீ ஆரச மரப் பிள்ளையார்', 'Shrine under the Sacred Tree', 'Kuil di Bawah Pokok Suci', 'புனித மரத்தடி ஆலயம்', 'Lord Ganesha enshrined beneath the temple''s sacred arasa (peepal) tree, worshipped for blessings and prosperity.', 'Dewa Ganesha yang bersemayam di bawah pokok arasa suci kuil, disembah untuk keberkatan dan kemakmuran.', 'கோயிலின் புனித அரச மரத்தடியில் அமைந்துள்ள விநாயகர், அருளும் செழிப்பும் அளிப்பவராக வழிபடப்படுபவர்.', 'https://lh3.googleusercontent.com/d/11gx2lUxC40KoEYJIBuY51yDizrQ0Sobg=w800', '#7A1B22', 8) on conflict (name_en) do nothing;
insert into deities (name_en, name_bm, name_ta, role_en, role_bm, role_ta, description_en, description_bm, description_ta, image_url, color, sort_order) values ('Sri Idumban', 'Sri Idumban', 'ஸ்ரீ இடும்பன்', 'Guardian Deity', 'Dewa Penjaga', 'காவல் தெய்வம்', 'A guardian deity closely linked to the Kavadi tradition and devotion to Lord Murugan.', 'Dewa penjaga yang berkait rapat dengan tradisi Kavadi dan pengabdian kepada Dewa Murugan.', 'காவடி பாரம்பரியத்துடனும் முருகன் பக்தியுடனும் நெருங்கிய தொடர்புடைய காவல் தெய்வம்.', 'https://lh3.googleusercontent.com/d/12O-4a-FNjIzivNASETE3Wd_7S0bvKEsp=w800', '#8F6B2E', 9) on conflict (name_en) do nothing;
insert into deities (name_en, name_bm, name_ta, role_en, role_bm, role_ta, description_en, description_bm, description_ta, image_url, color, sort_order) values ('Sri Bairavar', 'Sri Bairavar', 'ஸ்ரீ பைரவர்', 'Guardian Deity', 'Dewa Penjaga', 'காவல் தெய்வம்', 'A fierce guardian form of Lord Shiva, worshipped as protector of the temple and its boundaries.', 'Wujud garang Dewa Siva, disembah sebagai penjaga kuil dan sempadannya.', 'சிவபெருமானின் உக்கிர வடிவம், கோயிலையும் அதன் எல்லைகளையும் காக்கும் காவல் தெய்வமாக வழிபடப்படுபவர்.', 'https://lh3.googleusercontent.com/d/1Uy8dRxgf5UJJS8vuqi4F4Geafg_ekaDF=w800', '#3B3B3B', 10) on conflict (name_en) do nothing;
insert into deities (name_en, name_bm, name_ta, role_en, role_bm, role_ta, description_en, description_bm, description_ta, image_url, color, sort_order) values ('Navagraham', 'Navagraham', 'நவகிரகம்', 'Nine Planetary Deities', 'Sembilan Dewa Planet', 'நவகிரக தெய்வங்கள்', 'The nine celestial deities governing destiny, worshipped together to balance their planetary influences.', 'Sembilan dewa cakerawala yang menentukan takdir, disembah bersama untuk mengimbangi pengaruh planet masing-masing.', 'விதியை நிர்ணயிக்கும் நவகிரக தெய்வங்கள், அவற்றின் கிரக பாதிப்புகளை சமன்செய்ய ஒன்றாக வழிபடப்படுகின்றன.', 'https://lh3.googleusercontent.com/d/1BaEizVgGNr0AktWyM-4Cjr48HBxPWs-T=w800', '#2E6F4E', 11) on conflict (name_en) do nothing;

-- ---------- committee_members (Temple Management Committee, from Ravi's org-chart image) ----------
-- No unique constraint on name (see cms-schema.sql's comment), so each
-- row is guarded with "where not exists" instead of "on conflict".
insert into committee_members (tier, name, role_en, role_bm, role_ta, subtitle_en, subtitle_bm, subtitle_ta, phone, sort_order)
select 'president', 'Capt. Shamala Devi Muniandy', 'President', 'Presiden', 'தலைவர்', '', '', '', '012-2487718', 0
where not exists (select 1 from committee_members where tier = 'president' and name = 'Capt. Shamala Devi Muniandy');
insert into committee_members (tier, name, role_en, role_bm, role_ta, subtitle_en, subtitle_bm, subtitle_ta, phone, sort_order)
select 'vicePresident', 'Mr. Balachandran Ramachandran', 'Vice President', 'Naib Presiden', 'துணைத் தலைவர்', '', '', '', '011-31559091', 0
where not exists (select 1 from committee_members where tier = 'vicePresident' and name = 'Mr. Balachandran Ramachandran');
insert into committee_members (tier, name, role_en, role_bm, role_ta, subtitle_en, subtitle_bm, subtitle_ta, phone, sort_order)
select 'officer', 'Mr. Muniswaran Kalimuthu', 'Secretary', 'Setiausaha', 'செயலாளர்', '', '', '', '012-5852978', 0
where not exists (select 1 from committee_members where tier = 'officer' and name = 'Mr. Muniswaran Kalimuthu');
insert into committee_members (tier, name, role_en, role_bm, role_ta, subtitle_en, subtitle_bm, subtitle_ta, phone, sort_order)
select 'officer', 'Mr. Ravivarman Abboo', 'Asst. Secretary', 'Penolong Setiausaha', 'உதவி செயலாளர்', 'IT & Technology', 'IT & Teknologi', 'தகவல் தொழில்நுட்பம்', '010-9482080', 1
where not exists (select 1 from committee_members where tier = 'officer' and name = 'Mr. Ravivarman Abboo');
insert into committee_members (tier, name, role_en, role_bm, role_ta, subtitle_en, subtitle_bm, subtitle_ta, phone, sort_order)
select 'officer', 'Mdm. Kamaleswari Kaliaperumal', 'Treasurer', 'Bendahari', 'பொருளாளர்', '', '', '', '016-3519068', 2
where not exists (select 1 from committee_members where tier = 'officer' and name = 'Mdm. Kamaleswari Kaliaperumal');
insert into committee_members (tier, name, role_en, role_bm, role_ta, subtitle_en, subtitle_bm, subtitle_ta, phone, sort_order)
select 'officer', 'Mdm. Parimalah Krishnan', 'Asst. Treasurer', 'Penolong Bendahari', 'உதவி பொருளாளர்', '', '', '', '016-8054722', 3
where not exists (select 1 from committee_members where tier = 'officer' and name = 'Mdm. Parimalah Krishnan');
insert into committee_members (tier, name, role_en, role_bm, role_ta, subtitle_en, subtitle_bm, subtitle_ta, phone, sort_order)
select 'member', 'Mdm. Jeya Devi Gunaratnam', 'Committee Member', 'Ahli Jawatankuasa', 'குழு உறுப்பினர்', 'Supritendant & Rituals', 'Penyelia & Upacara', 'மேற்பார்வையாளர் & சடங்குகள்', '012-2094421', 0
where not exists (select 1 from committee_members where tier = 'member' and name = 'Mdm. Jeya Devi Gunaratnam');
insert into committee_members (tier, name, role_en, role_bm, role_ta, subtitle_en, subtitle_bm, subtitle_ta, phone, sort_order)
select 'member', 'Mr. Mohan M. Raju', 'Committee Member', 'Ahli Jawatankuasa', 'குழு உறுப்பினர்', 'Maintenance', 'Penyelenggaraan', 'பராமரிப்பு', '016-8390184', 1
where not exists (select 1 from committee_members where tier = 'member' and name = 'Mr. Mohan M. Raju');
insert into committee_members (tier, name, role_en, role_bm, role_ta, subtitle_en, subtitle_bm, subtitle_ta, phone, sort_order)
select 'member', 'Mr. Pavithran Kunhappnair', 'Committee Member', 'Ahli Jawatankuasa', 'குழு உறுப்பினர்', 'Inventory', 'Inventori', 'சரக்கு', '013-8949509', 2
where not exists (select 1 from committee_members where tier = 'member' and name = 'Mr. Pavithran Kunhappnair');
insert into committee_members (tier, name, role_en, role_bm, role_ta, subtitle_en, subtitle_bm, subtitle_ta, phone, sort_order)
select 'member', 'Mr. Navinkumar Sivakumar', 'Committee Member', 'Ahli Jawatankuasa', 'குழு உறுப்பினர்', '', '', '', '019-2457724', 3
where not exists (select 1 from committee_members where tier = 'member' and name = 'Mr. Navinkumar Sivakumar');
insert into committee_members (tier, name, role_en, role_bm, role_ta, subtitle_en, subtitle_bm, subtitle_ta, phone, sort_order)
select 'member', 'Mr. Sivaguru Subramaniam', 'Committee Member', 'Ahli Jawatankuasa', 'குழு உறுப்பினர்', '', '', '', '011-17841871', 4
where not exists (select 1 from committee_members where tier = 'member' and name = 'Mr. Sivaguru Subramaniam');
insert into committee_members (tier, name, sort_order)
select 'auditor', 'Mr. Batumalai Veruthasalam', 0
where not exists (select 1 from committee_members where tier = 'auditor' and name = 'Mr. Batumalai Veruthasalam');
insert into committee_members (tier, name, sort_order)
select 'auditor', 'Major B. Shuras Batumalai (Rtd)', 1
where not exists (select 1 from committee_members where tier = 'auditor' and name = 'Major B. Shuras Batumalai (Rtd)');
insert into committee_members (tier, name, sort_order)
select 'trustee', 'Mr. Gunasekaran Rajangam', 0
where not exists (select 1 from committee_members where tier = 'trustee' and name = 'Mr. Gunasekaran Rajangam');
insert into committee_members (tier, name, sort_order)
select 'trustee', 'Mr. Kalaichelvan Govindaraja', 1
where not exists (select 1 from committee_members where tier = 'trustee' and name = 'Mr. Kalaichelvan Govindaraja');

-- ---------- pooja_timings (live sheet content, EN/BM/TA merged per row) ----------
insert into pooja_timings (list_type, name_en, name_bm, name_ta, time_label, sort_order) values ('today', 'Nadai Thirappu', 'Pembukaan Pintu Kuil', 'நடைத் திறப்பு', '5:30 AM', 0) on conflict (list_type, name_en) do nothing;
insert into pooja_timings (list_type, name_en, name_bm, name_ta, time_label, sort_order) values ('today', 'Ushakala Pooja', 'Pooja Subuh', 'உஷக்கால பூஜை', '6:00 AM', 1) on conflict (list_type, name_en) do nothing;
insert into pooja_timings (list_type, name_en, name_bm, name_ta, time_label, sort_order) values ('today', 'Kalasanthi Pooja', 'Pooja Pagi', 'காலசந்தி பூஜை', '8:30 AM', 2) on conflict (list_type, name_en) do nothing;
insert into pooja_timings (list_type, name_en, name_bm, name_ta, time_label, sort_order) values ('today', 'Uchikala Pooja', 'Pooja Tengah Hari', 'உச்சிகால பூஜை', '12:00 PM', 3) on conflict (list_type, name_en) do nothing;
insert into pooja_timings (list_type, name_en, name_bm, name_ta, time_label, sort_order) values ('today', 'Sayaraksha Pooja', 'Pooja Petang', 'சாயரட்சை பூஜை', '6:00 PM', 4) on conflict (list_type, name_en) do nothing;
insert into pooja_timings (list_type, name_en, name_bm, name_ta, time_label, sort_order) values ('today', 'Arthajama Pooja', 'Pooja Malam', 'அர்த்தஜாம பூஜை', '8:30 PM', 5) on conflict (list_type, name_en) do nothing;
insert into pooja_timings (list_type, name_en, name_bm, name_ta, time_label, sort_order) values ('daily', 'Nadai Thirappu', 'Pembukaan Pintu Kuil', 'நடைத் திறப்பு', '5:30 AM', 0) on conflict (list_type, name_en) do nothing;
insert into pooja_timings (list_type, name_en, name_bm, name_ta, time_label, sort_order) values ('daily', 'Ushakala Pooja', 'Pooja Subuh', 'உஷக்கால பூஜை', '6:00 AM', 1) on conflict (list_type, name_en) do nothing;
insert into pooja_timings (list_type, name_en, name_bm, name_ta, time_label, sort_order) values ('daily', 'Kalasanthi Pooja', 'Pooja Pagi', 'காலசந்தி பூஜை', '8:30 AM', 2) on conflict (list_type, name_en) do nothing;
insert into pooja_timings (list_type, name_en, name_bm, name_ta, time_label, sort_order) values ('daily', 'Uchikala Pooja', 'Pooja Tengah Hari', 'உச்சிகால பூஜை', '12:00 PM', 3) on conflict (list_type, name_en) do nothing;
insert into pooja_timings (list_type, name_en, name_bm, name_ta, time_label, sort_order) values ('daily', 'Sayaraksha Pooja', 'Pooja Petang', 'சாயரட்சை பூஜை', '6:00 PM', 4) on conflict (list_type, name_en) do nothing;
insert into pooja_timings (list_type, name_en, name_bm, name_ta, time_label, sort_order) values ('daily', 'Arthajama Pooja', 'Pooja Malam', 'அர்த்தஜாம பூஜை', '8:30 PM', 5) on conflict (list_type, name_en) do nothing;
insert into pooja_timings (list_type, name_en, name_bm, name_ta, time_label, sort_order) values ('friday', 'Nadai Thirappu', 'Pembukaan Pintu Kuil', 'நடைத் திறப்பு', '5:00 AM', 0) on conflict (list_type, name_en) do nothing;
insert into pooja_timings (list_type, name_en, name_bm, name_ta, time_label, sort_order) values ('friday', 'Special Abhishekam', 'Abhishekam Khas', 'சிறப்பு அபிஷேகம்', '7:00 AM', 1) on conflict (list_type, name_en) do nothing;
insert into pooja_timings (list_type, name_en, name_bm, name_ta, time_label, sort_order) values ('friday', 'Kalasanthi Pooja', 'Pooja Pagi', 'காலசந்தி பூஜை', '8:30 AM', 2) on conflict (list_type, name_en) do nothing;
insert into pooja_timings (list_type, name_en, name_bm, name_ta, time_label, sort_order) values ('friday', 'Uchikala Pooja', 'Pooja Tengah Hari', 'உச்சிகால பூஜை', '12:00 PM', 3) on conflict (list_type, name_en) do nothing;
insert into pooja_timings (list_type, name_en, name_bm, name_ta, time_label, sort_order) values ('friday', 'Sayaraksha Pooja', 'Pooja Petang', 'சாயரட்சை பூஜை', '6:00 PM', 4) on conflict (list_type, name_en) do nothing;
insert into pooja_timings (list_type, name_en, name_bm, name_ta, time_label, sort_order) values ('friday', 'Deepa Aradhanai', 'Deepa Aradhanai', 'தீப ஆராதனை', '7:30 PM', 5) on conflict (list_type, name_en) do nothing;
insert into pooja_timings (list_type, name_en, name_bm, name_ta, time_label, sort_order) values ('friday', 'Arthajama Pooja', 'Pooja Malam', 'அர்த்தஜாம பூஜை', '9:00 PM', 6) on conflict (list_type, name_en) do nothing;
insert into pooja_timings (list_type, name_en, name_bm, name_ta, time_label, sort_order) values ('fullMoon', 'Nadai Thirappu', 'Pembukaan Pintu Kuil', 'நடைத் திறப்பு', '5:00 AM', 0) on conflict (list_type, name_en) do nothing;
insert into pooja_timings (list_type, name_en, name_bm, name_ta, time_label, sort_order) values ('fullMoon', 'Special Abhishekam', 'Abhishekam Khas', 'சிறப்பு அபிஷேகம்', '6:30 AM', 1) on conflict (list_type, name_en) do nothing;
insert into pooja_timings (list_type, name_en, name_bm, name_ta, time_label, sort_order) values ('fullMoon', 'Kalasanthi Pooja', 'Pooja Pagi', 'காலசந்தி பூஜை', '8:30 AM', 2) on conflict (list_type, name_en) do nothing;
insert into pooja_timings (list_type, name_en, name_bm, name_ta, time_label, sort_order) values ('fullMoon', 'Annadhanam', 'Annadhanam', 'அன்னதானம்', '12:30 PM', 3) on conflict (list_type, name_en) do nothing;
insert into pooja_timings (list_type, name_en, name_bm, name_ta, time_label, sort_order) values ('fullMoon', 'Sayaraksha Pooja', 'Pooja Petang', 'சாயரட்சை பூஜை', '6:00 PM', 4) on conflict (list_type, name_en) do nothing;
insert into pooja_timings (list_type, name_en, name_bm, name_ta, time_label, sort_order) values ('fullMoon', 'Arthajama Pooja', 'Pooja Malam', 'அர்த்தஜாம பூஜை', '9:00 PM', 5) on conflict (list_type, name_en) do nothing;

-- ---------- sevas (live sheet content; repeated 'General Donation' rows collapsed) ----------
insert into sevas (name_en, name_bm, name_ta, price_en, price_bm, price_ta, desc_en, desc_bm, desc_ta, cta_en, cta_bm, cta_ta, sort_order) values ('Archanai', 'Archanai', 'அர்ச்சனை', 'RM 10', 'RM 10', 'RM 10', 'Individual prayer offering with your name and star (nakshatra) invoked.', 'Persembahan doa individu dengan nama dan bintang (nakshatra) anda disebut.', 'உங்கள் பெயரும் நட்சத்திரமும் கூறி செய்யப்படும் தனிப்பட்ட பிரார்த்தனை காணிக்கை.', 'Pay Archanai', 'Bayar Archanai', 'அர்ச்சனை செலுத்த', 0) on conflict (name_en) do nothing;
insert into sevas (name_en, name_bm, name_ta, price_en, price_bm, price_ta, desc_en, desc_bm, desc_ta, cta_en, cta_bm, cta_ta, sort_order) values ('Abhishekam Sponsorship', 'Penajaan Abhishekam', 'அபிஷேக நிதியுதவி', 'RM 100', 'RM 100', 'RM 100', 'Sponsor the sacred bathing ritual for a chosen deity on a date of your choice.', 'Taja upacara pemandian suci untuk dewa pilihan anda pada tarikh pilihan anda.', 'நீங்கள் தேர்ந்தெடுக்கும் நாளில் ஒரு தெய்வத்திற்கு புனித அபிஷேகத்தை நிதியுதவி செய்யுங்கள்.', 'Sponsor Abhishekam', 'Taja Abhishekam', 'அபிஷேகத்திற்கு நிதியுதவி செய்ய', 1) on conflict (name_en) do nothing;
insert into sevas (name_en, name_bm, name_ta, price_en, price_bm, price_ta, desc_en, desc_bm, desc_ta, cta_en, cta_bm, cta_ta, sort_order) values ('Annadhanam Sponsorship', 'Penajaan Annadhanam', 'அன்னதான நிதியுதவி', 'RM 500', 'RM 500', 'RM 500', 'Sponsor a full day''s community meal for visiting devotees.', 'Taja hidangan makanan komuniti sepanjang hari untuk penganut yang datang melawat.', 'வருகை தரும் பக்தர்களுக்கு ஒரு நாள் முழு உணவை நிதியுதவி செய்யுங்கள்.', 'Sponsor Annadhanam', 'Taja Annadhanam', 'அன்னதானத்திற்கு நிதியுதவி செய்ய', 2) on conflict (name_en) do nothing;
insert into sevas (name_en, name_bm, name_ta, price_en, price_bm, price_ta, desc_en, desc_bm, desc_ta, cta_en, cta_bm, cta_ta, sort_order) values ('General Donation', 'Derma Am', 'பொது நன்கொடை', 'Any Amount', 'Sebarang Jumlah', 'எந்த தொகையும்', 'Support ongoing temple maintenance, utilities, and welfare programs.', 'Sokong penyelenggaraan kuil, utiliti, dan program kebajikan yang berterusan.', 'கோயில் பராமரிப்பு, பயன்பாடுகள் மற்றும் நலத்திட்டங்களுக்கு தொடர்ந்து ஆதரவு அளியுங்கள்.', 'Donate Now', 'Derma Sekarang', 'இப்போது நன்கொடை அளிக்க', 3) on conflict (name_en) do nothing;

-- ---------- announcements (live sheet content) ----------
insert into announcements (title_en, title_bm, title_ta, desc_en, desc_bm, desc_ta, published, sort_order) values ('Aadi Month Special Poojas', 'Pooja Khas Bulan Aadi', 'ஆடி மாத சிறப்பு பூஜைகள்', 'Every Friday in Aadi month. All devotees are welcome to attend the special abhishekam.', 'Setiap hari Jumaat pada bulan Aadi. Semua penganut dialu-alukan hadir.', 'ஆடி மாதத்தின் ஒவ்வொரு வெள்ளிக்கிழமையும். அனைத்து பக்தர்களும் வருக.', true, 0) on conflict (title_en) do nothing;
insert into announcements (title_en, title_bm, title_ta, desc_en, desc_bm, desc_ta, published, sort_order) values ('Annadhanam Sponsorship', 'Penajaan Annadhanam', 'அன்னதான நிதியுதவி', 'Sponsor a community meal for your family''s special occasions — birthdays, anniversaries, or in memory of loved ones.', 'Taja hidangan komuniti untuk majlis istimewa keluarga anda — hari lahir, ulang tahun, atau mengenang orang tersayang.', 'உங்கள் குடும்பத்தின் சிறப்பு நிகழ்வுகளுக்காக ஒரு சமூக உணவை நிதியுதவி செய்யுங்கள் — பிறந்தநாள், திருமண நாள் அல்லது நேசர்களின் நினைவாக.', true, 1) on conflict (title_en) do nothing;
insert into announcements (title_en, title_bm, title_ta, desc_en, desc_bm, desc_ta, published, sort_order) values ('Support Our Temple', 'Sokong Kuil Kami', 'எங்கள் கோயிலுக்கு ஆதரவு அளியுங்கள்', 'Your contribution helps with temple maintenance, utilities, and community welfare programs.', 'Sumbangan anda membantu penyelenggaraan kuil, utiliti, dan program kebajikan komuniti.', 'உங்கள் பங்களிப்பு கோயில் பராமரிப்பு, பயன்பாடுகள் மற்றும் சமூக நல திட்டங்களுக்கு உதவுகிறது.', true, 2) on conflict (title_en) do nothing;
insert into announcements (title_en, title_bm, title_ta, desc_en, desc_bm, desc_ta, published, sort_order) values ('Car Park Notice', 'Notis Tempat Letak Kereta', 'கார் பார்க்கிங் அறிவிப்பு', 'Overflow parking is available at the community hall on festival days.', 'Tempat letak kereta tambahan disediakan di dewan komuniti pada hari perayaan.', 'திருவிழா நாட்களில் கூடுதல் வாகன நிறுத்துமிடம் சமூக மண்டபத்தில் கிடைக்கும்.', true, 3) on conflict (title_en) do nothing;

-- ---------- gallery_categories / gallery_folders (bundled placeholders,
-- one "General" folder per category — rename/split these in the CMS's
-- Gallery Categories / Gallery Folders tabs once you're organizing
-- real photos) ----------
insert into gallery_categories (name_en, name_bm, name_ta, sort_order) values ('Festivals', 'Perayaan', 'திருவிழாக்கள்', 0) on conflict (name_en) do nothing;
insert into gallery_categories (name_en, name_bm, name_ta, sort_order) values ('Deities', 'Dewa-Dewi', 'தெய்வங்கள்', 1) on conflict (name_en) do nothing;
insert into gallery_categories (name_en, name_bm, name_ta, sort_order) values ('Temple', 'Kuil', 'கோயில்', 2) on conflict (name_en) do nothing;
insert into gallery_categories (name_en, name_bm, name_ta, sort_order) values ('Community', 'Komuniti', 'சமூகம்', 3) on conflict (name_en) do nothing;

insert into gallery_folders (category_id, name_en, name_bm, name_ta, sort_order)
  select id, 'General', 'Umum', 'பொது', 0 from gallery_categories where name_en = 'Festivals'
  on conflict (category_id, name_en) do nothing;
insert into gallery_folders (category_id, name_en, name_bm, name_ta, sort_order)
  select id, 'General', 'Umum', 'பொது', 0 from gallery_categories where name_en = 'Deities'
  on conflict (category_id, name_en) do nothing;
insert into gallery_folders (category_id, name_en, name_bm, name_ta, sort_order)
  select id, 'General', 'Umum', 'பொது', 0 from gallery_categories where name_en = 'Temple'
  on conflict (category_id, name_en) do nothing;
insert into gallery_folders (category_id, name_en, name_bm, name_ta, sort_order)
  select id, 'General', 'Umum', 'பொது', 0 from gallery_categories where name_en = 'Community'
  on conflict (category_id, name_en) do nothing;

-- ---------- gallery (bundled captions; no photos uploaded yet — add via the CMS Gallery Photos tab) ----------
-- Re-run protection here is a "not exists" guard on (folder_id,
-- label_en) rather than "on conflict" — gallery.label_en has no
-- unique constraint (captions aren't a natural key for photos; see
-- cms-schema.sql), so on conflict isn't available, but this still
-- keeps re-running this file safe.
insert into gallery (folder_id, image_url, label_en, label_bm, label_ta, sort_order)
  select f.id, '', 'Thaipusam Procession', 'Perarakan Thaipusam', 'தைப்பூசம் ஊர்வலம்', 0
  from gallery_folders f join gallery_categories c on c.id = f.category_id
  where c.name_en = 'Festivals' and f.name_en = 'General'
    and not exists (select 1 from gallery g where g.folder_id = f.id and g.label_en = 'Thaipusam Procession');
insert into gallery (folder_id, image_url, label_en, label_bm, label_ta, sort_order)
  select f.id, '', 'Navarathri Golu', 'Navarathri Golu', 'நவராத்திரி கொலு', 1
  from gallery_folders f join gallery_categories c on c.id = f.category_id
  where c.name_en = 'Festivals' and f.name_en = 'General'
    and not exists (select 1 from gallery g where g.folder_id = f.id and g.label_en = 'Navarathri Golu');
insert into gallery (folder_id, image_url, label_en, label_bm, label_ta, sort_order)
  select f.id, '', 'Murugan Alankaram', 'Alankaram Murugan', 'முருகன் அலங்காரம்', 2
  from gallery_folders f join gallery_categories c on c.id = f.category_id
  where c.name_en = 'Deities' and f.name_en = 'General'
    and not exists (select 1 from gallery g where g.folder_id = f.id and g.label_en = 'Murugan Alankaram');
insert into gallery (folder_id, image_url, label_en, label_bm, label_ta, sort_order)
  select f.id, '', 'Ganesha Shrine', 'Kuil Ganesha', 'விநாயகர் ஆலயம்', 3
  from gallery_folders f join gallery_categories c on c.id = f.category_id
  where c.name_en = 'Deities' and f.name_en = 'General'
    and not exists (select 1 from gallery g where g.folder_id = f.id and g.label_en = 'Ganesha Shrine');
insert into gallery (folder_id, image_url, label_en, label_bm, label_ta, sort_order)
  select f.id, '', 'Main Gopuram', 'Gopuram Utama', 'முதன்மை கோபுரம்', 4
  from gallery_folders f join gallery_categories c on c.id = f.category_id
  where c.name_en = 'Temple' and f.name_en = 'General'
    and not exists (select 1 from gallery g where g.folder_id = f.id and g.label_en = 'Main Gopuram');
insert into gallery (folder_id, image_url, label_en, label_bm, label_ta, sort_order)
  select f.id, '', 'Inner Sanctum', 'Bilik Suci Dalam', 'உள் கருவறை', 5
  from gallery_folders f join gallery_categories c on c.id = f.category_id
  where c.name_en = 'Temple' and f.name_en = 'General'
    and not exists (select 1 from gallery g where g.folder_id = f.id and g.label_en = 'Inner Sanctum');
insert into gallery (folder_id, image_url, label_en, label_bm, label_ta, sort_order)
  select f.id, '', 'Annadhanam Hall', 'Dewan Annadhanam', 'அன்னதான மண்டபம்', 6
  from gallery_folders f join gallery_categories c on c.id = f.category_id
  where c.name_en = 'Community' and f.name_en = 'General'
    and not exists (select 1 from gallery g where g.folder_id = f.id and g.label_en = 'Annadhanam Hall');
insert into gallery (folder_id, image_url, label_en, label_bm, label_ta, sort_order)
  select f.id, '', 'Cultural Class', 'Kelas Kebudayaan', 'பண்பாட்டு வகுப்பு', 7
  from gallery_folders f join gallery_categories c on c.id = f.category_id
  where c.name_en = 'Community' and f.name_en = 'General'
    and not exists (select 1 from gallery g where g.folder_id = f.id and g.label_en = 'Cultural Class');

-- ---------- contact_info (live sheet content) ----------
insert into contact_info (id, org_name, registration_no, phone, email, whatsapp_number, social,
  address_en, address_bm, address_ta, enquiries_heading_en, enquiries_heading_bm, enquiries_heading_ta,
  whatsapp_caption_en, whatsapp_caption_bm, whatsapp_caption_ta,
  donation_account_name, donation_bank, donation_account_number)
values (1,
  'PERTUBUHAN PENGURUSAN KUIL SRI SUBRAMANIAR KEM LOK KAWI',
  'PPM-015-12-14122022',
  '088-123 4567',
  'info@srisubramaniarlokkawi.org',
  '60109482080',
  'Facebook, Instagram, YouTube, WhatsApp',
  'Lot 100, Jalan Lama Penampang – Kinarut, 88200 Kota Kinabalu, Sabah',
  'Lot 100, Jalan Lama Penampang – Kinarut, 88200 Kota Kinabalu, Sabah',
  'லாட் 100, ஜாலான் லாமா பெனாம்பாங் - கினாருட், 88200 கோத்தா கினபாலு, சபா',
  'For Any Enquiries', 'Untuk Sebarang Pertanyaan', 'மேல் விவரங்களுக்கு',
  'Scan to chat with us on WhatsApp', 'Imbas untuk berbual dengan kami di WhatsApp', 'WhatsApp இல் எங்களுடன் தொடர்புகொள்ள விரைவுத் தகவல் குறியீட்டை ஸ்கேன் செய்யவும்',
  'PERTUBUHAN PENGURUSAN KUIL SRI SUBRAMANIAR KEM LOK KAWI', 'PUBLIC BANK', '3233458636')
on conflict (id) do update set
  org_name=excluded.org_name, registration_no=excluded.registration_no, phone=excluded.phone, email=excluded.email,
  whatsapp_number=excluded.whatsapp_number, social=excluded.social,
  address_en=excluded.address_en, address_bm=excluded.address_bm, address_ta=excluded.address_ta,
  enquiries_heading_en=excluded.enquiries_heading_en, enquiries_heading_bm=excluded.enquiries_heading_bm, enquiries_heading_ta=excluded.enquiries_heading_ta,
  whatsapp_caption_en=excluded.whatsapp_caption_en, whatsapp_caption_bm=excluded.whatsapp_caption_bm, whatsapp_caption_ta=excluded.whatsapp_caption_ta,
  donation_account_name=excluded.donation_account_name, donation_bank=excluded.donation_bank, donation_account_number=excluded.donation_account_number;

