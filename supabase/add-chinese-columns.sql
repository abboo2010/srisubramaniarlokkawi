-- ============================================================
-- Chinese (Simplified, zh) — step B1: database columns + starter content
--
-- Run once in Supabase -> SQL Editor -> New query -> paste -> Run.
-- SAFE TO RE-RUN: columns use "if not exists", and every content
-- update only fills a Chinese field that is still EMPTY and whose
-- English text matches the original, so nothing you or the committee
-- typed is ever overwritten.
--
-- What this does
--   1. Adds a Chinese (_zh) column next to every _en/_bm/_ta column
--      the site shows, so the public site can read Chinese from the
--      database. (Fields left empty simply show English.)
--   2. Fills in Chinese for the existing deities, sevas, announcements,
--      pooja names, committee roles and About page.
--
-- Page headings, menu labels, home tiles and the hero labels already
-- have Chinese built into the site, so they need no data here.
-- ============================================================

-- ---------- 1. Add Chinese columns ----------
alter table if exists hero_banner add column if not exists eyebrow_zh text not null default '';
alter table if exists hero_banner add column if not exists title_line1_zh text not null default '';
alter table if exists hero_banner add column if not exists title_line2_zh text not null default '';
alter table if exists hero_banner add column if not exists established_label_zh text not null default '';
alter table if exists hero_banner add column if not exists devotees_label_zh text not null default '';
alter table if exists hero_banner add column if not exists annual_events_label_zh text not null default '';
alter table if exists hero_banner add column if not exists upcoming_events_label_zh text not null default '';
alter table if exists hero_banner add column if not exists pooja_timings_label_zh text not null default '';
alter table if exists nav_tiles add column if not exists title_zh text not null default '';
alter table if exists nav_tiles add column if not exists desc_zh text not null default '';
alter table if exists page_headings add column if not exists heading_zh text not null default '';
alter table if exists page_headings add column if not exists sub_zh text not null default '';
alter table if exists menu_labels add column if not exists label_zh text not null default '';
alter table if exists site_ticker add column if not exists message_zh text not null default '';
alter table if exists site_popup add column if not exists link_label_zh text not null default '';
alter table if exists site_popup add column if not exists title_zh text not null default '';
alter table if exists site_popup add column if not exists message_zh text not null default '';
alter table if exists whatsapp_widget add column if not exists heading_zh text not null default '';
alter table if exists whatsapp_widget add column if not exists description_zh text not null default '';
alter table if exists whatsapp_widget add column if not exists message_zh text not null default '';
alter table if exists whatsapp_widget add column if not exists button_label_zh text not null default '';
alter table if exists about_page add column if not exists vision_zh text not null default '';
alter table if exists about_page add column if not exists mission_zh text not null default '';
alter table if exists about_page add column if not exists history_zh text not null default '';
alter table if exists about_page add column if not exists activities_zh text not null default '';
alter table if exists deities add column if not exists name_zh text not null default '';
alter table if exists deities add column if not exists role_zh text not null default '';
alter table if exists deities add column if not exists description_zh text not null default '';
alter table if exists committee_members add column if not exists role_zh text not null default '';
alter table if exists committee_members add column if not exists subtitle_zh text not null default '';
alter table if exists pooja_timings add column if not exists name_zh text not null default '';
alter table if exists sevas add column if not exists name_zh text not null default '';
alter table if exists sevas add column if not exists price_zh text not null default '';
alter table if exists sevas add column if not exists desc_zh text not null default '';
alter table if exists sevas add column if not exists cta_zh text not null default '';
alter table if exists announcements add column if not exists title_zh text not null default '';
alter table if exists announcements add column if not exists desc_zh text not null default '';
alter table if exists gallery_categories add column if not exists name_zh text not null default '';
alter table if exists gallery_folders add column if not exists name_zh text not null default '';
alter table if exists gallery add column if not exists category_zh text not null default '';
alter table if exists gallery add column if not exists label_zh text not null default '';
alter table if exists contact_info add column if not exists address_zh text not null default '';
alter table if exists contact_info add column if not exists enquiries_heading_zh text not null default '';
alter table if exists contact_info add column if not exists whatsapp_caption_zh text not null default '';

-- ---------- 2. Starter Chinese content ----------

-- Deities (name keeps the Latin name that matches the signage, plus a Chinese gloss)

update deities set name_zh = $z$Sri Subramaniar（穆鲁干神）$z$, role_zh = $z$主神$z$, description_zh = $z$本庙主神——湿婆神与帕尔瓦蒂女神之子，被尊为战争与智慧之神，手持神圣的 Vel（神矛）。$z$
  where name_en = $z$Sri Subramaniar$z$ and name_zh = '';
update deities set name_zh = $z$Sri Vinayagar（象头神）$z$, role_zh = $z$守护神殿$z$, description_zh = $z$消除一切障碍之神，传统上在任何祈祷或新事业开始之前最先礼拜。$z$
  where name_en = $z$Sri Vinayagar$z$ and name_zh = '';
update deities set name_zh = $z$Sri Ambal（母神）$z$, role_zh = $z$母神殿$z$, description_zh = $z$神圣的母亲，湿力（Shakti）的化身，信众祈求她的庇护、恩典与滋养的力量。$z$
  where name_en = $z$Sri Ambal$z$ and name_zh = '';
update deities set name_zh = $z$Vasantha Mandapam（典礼殿）$z$, role_zh = $z$典礼大殿$z$, description_zh = $z$用于举行季节性庆典、游行及全年特别 Pooja 的典礼大殿。$z$
  where name_en = $z$Vasantha Mandapam$z$ and name_zh = '';
update deities set name_zh = $z$Sri Perumal（毗湿奴神）$z$, role_zh = $z$神殿$z$, description_zh = $z$毗湿奴神，宇宙的守护者，信众祈求平安、兴旺与正法（Dharma）的维系。$z$
  where name_en = $z$Sri Perumal$z$ and name_zh = '';
update deities set name_zh = $z$Sri Garudar（金翅鸟神）$z$, role_zh = $z$坐骑神殿$z$, description_zh = $z$毗湿奴神的神鹰与坐骑（Vahana），供奉于 Sri Perumal 对面，象征虔诚与敏捷。$z$
  where name_en = $z$Sri Garudar$z$ and name_zh = '';
update deities set name_zh = $z$Anjenayar（哈奴曼神）$z$, role_zh = $z$守护神$z$, description_zh = $z$哈奴曼神，罗摩神忠诚的追随者，信众祈求力量、勇气与坚定不移的虔诚。$z$
  where name_en = $z$Anjenayar$z$ and name_zh = '';
update deities set name_zh = $z$Sri Nagamma（蛇神）$z$, role_zh = $z$蛇神殿$z$, description_zh = $z$蛇神，信众祈求生育与庇护，并祈求化解蛇煞（Naga Dosham）。$z$
  where name_en = $z$Sri Nagamma$z$ and name_zh = '';
update deities set name_zh = $z$Sri Arasamara Pillayar（圣树下的象头神）$z$, role_zh = $z$圣树下神殿$z$, description_zh = $z$供奉于本庙圣菩提树（Arasa）下的象头神，信众祈求赐福与兴旺。$z$
  where name_en = $z$Sri Arasamara Pillayar$z$ and name_zh = '';
update deities set name_zh = $z$Sri Idumban（伊杜班神）$z$, role_zh = $z$守护神$z$, description_zh = $z$与 Kavadi 传统及对穆鲁干神的虔诚密切相关的守护神。$z$
  where name_en = $z$Sri Idumban$z$ and name_zh = '';
update deities set name_zh = $z$Sri Bairavar（拜拉瓦神）$z$, role_zh = $z$守护神$z$, description_zh = $z$湿婆神的威猛守护化身，被尊为本庙及其界域的守护者。$z$
  where name_en = $z$Sri Bairavar$z$ and name_zh = '';
update deities set name_zh = $z$Navagraham（九曜神）$z$, role_zh = $z$九大行星神$z$, description_zh = $z$掌管命运的九大天体神明，信众一同礼拜，以平衡各行星的影响。$z$
  where name_en = $z$Navagraham$z$ and name_zh = '';

-- Sevas & donations
update sevas set name_zh = $z$Archanai（个人祈福）$z$, desc_zh = $z$个人祈祷供奉，由祭司诵念您的姓名与星宿（Nakshatra）。$z$, cta_zh = $z$缴付 Archanai$z$
  where name_en = $z$Archanai$z$ and name_zh = '';
update sevas set name_zh = $z$赞助 Abhishekam（圣浴仪式）$z$, desc_zh = $z$为您选择的神明，在您选定的日期赞助神圣的沐浴仪式。$z$, cta_zh = $z$赞助 Abhishekam$z$
  where name_en = $z$Abhishekam Sponsorship$z$ and name_zh = '';
update sevas set name_zh = $z$赞助 Annadhanam（免费供餐）$z$, desc_zh = $z$为前来参拜的信众赞助一整天的社区餐食。$z$, cta_zh = $z$赞助 Annadhanam$z$
  where name_en = $z$Annadhanam Sponsorship$z$ and name_zh = '';
update sevas set name_zh = $z$一般捐款$z$, price_zh = $z$任何金额$z$, desc_zh = $z$支持本庙日常维修、水电开销及福利计划。$z$, cta_zh = $z$立即捐款$z$
  where name_en = $z$General Donation$z$ and name_zh = '';

-- Announcements
update announcements set title_zh = $z$Aadi 月特别 Pooja$z$, desc_zh = $z$Aadi 月每个星期五举行。欢迎所有信徒前来参加特别的 Abhishekam。$z$
  where title_en = $z$Aadi Month Special Poojas$z$ and title_zh = '';
update announcements set title_zh = $z$Annadhanam 赞助$z$, desc_zh = $z$为您家人的特别日子赞助一餐社区餐食——生日、周年纪念，或缅怀亲人。$z$
  where title_en = $z$Annadhanam Sponsorship$z$ and title_zh = '';
update announcements set title_zh = $z$支持我们的庙宇$z$, desc_zh = $z$您的捐献有助于庙宇维修、水电开销及社区福利计划。$z$
  where title_en = $z$Support Our Temple$z$ and title_zh = '';
update announcements set title_zh = $z$停车场通知$z$, desc_zh = $z$庆典日当天，社区礼堂提供额外停车位。$z$
  where title_en = $z$Car Park Notice$z$ and title_zh = '';

-- Pooja names (shown in the daily/Friday/full-moon timetables)
update pooja_timings set name_zh = $z$开庙门$z$ where name_en = $z$Nadai Thirappu$z$ and name_zh = '';
update pooja_timings set name_zh = $z$清晨 Pooja$z$ where name_en = $z$Ushakala Pooja$z$ and name_zh = '';
update pooja_timings set name_zh = $z$早晨 Pooja$z$ where name_en = $z$Kalasanthi Pooja$z$ and name_zh = '';
update pooja_timings set name_zh = $z$正午 Pooja$z$ where name_en = $z$Uchikala Pooja$z$ and name_zh = '';
update pooja_timings set name_zh = $z$傍晚 Pooja$z$ where name_en = $z$Sayaraksha Pooja$z$ and name_zh = '';
update pooja_timings set name_zh = $z$夜间 Pooja$z$ where name_en = $z$Arthajama Pooja$z$ and name_zh = '';
update pooja_timings set name_zh = $z$特别 Abhishekam$z$ where name_en = $z$Special Abhishekam$z$ and name_zh = '';
update pooja_timings set name_zh = $z$Deepa Aradhanai（油灯敬拜）$z$ where name_en = $z$Deepa Aradhanai$z$ and name_zh = '';
update pooja_timings set name_zh = $z$Annadhanam（供餐）$z$ where name_en = $z$Annadhanam$z$ and name_zh = '';

-- Committee roles and portfolios (names stay as written)
update committee_members set role_zh = $z$会长$z$ where role_en = $z$President$z$ and role_zh = '';
update committee_members set role_zh = $z$副会长$z$ where role_en = $z$Vice President$z$ and role_zh = '';
update committee_members set role_zh = $z$秘书$z$ where role_en = $z$Secretary$z$ and role_zh = '';
update committee_members set role_zh = $z$副秘书$z$ where role_en = $z$Asst. Secretary$z$ and role_zh = '';
update committee_members set role_zh = $z$财政$z$ where role_en = $z$Treasurer$z$ and role_zh = '';
update committee_members set role_zh = $z$副财政$z$ where role_en = $z$Asst. Treasurer$z$ and role_zh = '';
update committee_members set role_zh = $z$理事$z$ where role_en = $z$Committee Member$z$ and role_zh = '';
update committee_members set role_zh = $z$内部审计员$z$ where role_en = $z$Internal Auditor$z$ and role_zh = '';
update committee_members set role_zh = $z$受托人$z$ where role_en = $z$Trustee$z$ and role_zh = '';
update committee_members set subtitle_zh = $z$资讯科技$z$ where subtitle_en = $z$IT & Technology$z$ and subtitle_zh = '';
update committee_members set subtitle_zh = $z$监督与仪式$z$ where subtitle_en = $z$Supritendant & Rituals$z$ and subtitle_zh = '';
update committee_members set subtitle_zh = $z$监督与仪式$z$ where subtitle_en = $z$Superintendent & Rituals$z$ and subtitle_zh = '';
update committee_members set subtitle_zh = $z$维修保养$z$ where subtitle_en = $z$Maintenance$z$ and subtitle_zh = '';
update committee_members set subtitle_zh = $z$物资管理$z$ where subtitle_en = $z$Inventory$z$ and subtitle_zh = '';

-- About page (matched by the opening words of the original English)
update about_page set vision_zh = $z$继续作为沙巴印度教社群的精神家园——一座让 1970 年由洛卡威印度教军人点燃的虔诚之火不断壮大的庙宇，让世世代代都能在此礼拜穆鲁干神、庆祝自己的传统，并找到归属感。$z$ where id = 1 and vision_zh = '' and vision_en like 'To remain the spiritual home%';
update about_page set mission_zh = $z$怀着诚意与纪律举行每日 Pooja 与 Abhishekam；为年轻一代信徒传承印度教节庆、淡米尔语与文化；欢迎所有前来祈福、寻求社群温暖或享用 Annadhanam 餐食的人；并凭着当年建造本庙的同一份互助（gotong-royong）精神，维持并发展这座庙宇。$z$ where id = 1 and mission_zh = '' and mission_en like 'To conduct daily poojas%';
update about_page set activities_zh = $z$每日 Pooja 与 Abhishekam
一年一度的大宝森节（Thaipusam）游行
Skanda Sashti Viratham 斋戒
特定日子提供免费 Annadhanam（社区餐食）
为儿童开办淡米尔语与文化班
青年与长者虔诚小组$z$ where id = 1 and activities_zh = '' and activities_en like 'Daily poojas and abhishekams%';
update about_page set history_zh = $z$虽然印度教徒自 18 世纪（当时的英属北婆罗洲）起便在沙巴工作和生活，但当时他们并没有共同的礼拜场所。直到 1969 年，才成立了一个委员会筹募资金，兴建礼拜场所。由于资金短缺及当时的种种困难，进展十分缓慢。同一时期，武装部队迁入洛卡威，并拨出一块土地为印度教军人兴建庙宇。在印度教军人的努力下，1970 年以互助（gotong-royong）方式建成了一座庙宇。该庙为半永久结构，屋顶铺设锌片。

庙内定期举行祈祷。当时大宝森节（Thaipoosam）及其他节庆都隆重庆祝。然而，到了八十年代初，水灾成为一大难题。起初只是小麻烦，但随着周边地区发展为工业区和住宅区，水灾的次数与持续时间不断增加。

水灾不仅造成损毁，也中断了祈祷活动。亚庇的印度教社群向信徒筹款，花费 RM30,000.00 将地面抬高 1 至 6 英寸，并进行了其他紧急修缮。这项临时措施只维持了约五年，显然需要更长久的解决办法。

于是决定在较高的地基上重建庙宇，并兴建传统的“Gopuram”（庙塔）。随即展开筹款活动，同时也向州政府和联邦政府提出申请。

1990 年 4 月 29 日，举行了庙宇“Balastanam”仪式。旧庙被拆除，土方工程于 1990 年 7 月 3 日展开。庙宇开光（圣化）典礼于 1992 年 6 月 21 日举行。印度教社群、公众和州政府给予的财务支持非常踊跃。重建工程历时约 2 年 2 个月完成。

第二次 Maha Kumbhabhishekham 于 2005 年 1 月 17 日举行。$z$ where id = 1 and history_zh = '' and history_en like 'Although Hindus worked and lived in Sabah%';

-- ---------- 3. Check: how many rows now have Chinese ----------
select 'deities' as table_name, count(*) filter (where name_zh <> '') as with_chinese, count(*) as total from deities
union all select 'sevas', count(*) filter (where name_zh <> ''), count(*) from sevas
union all select 'announcements', count(*) filter (where title_zh <> ''), count(*) from announcements
union all select 'pooja_timings', count(*) filter (where name_zh <> ''), count(*) from pooja_timings
union all select 'committee_members (role)', count(*) filter (where role_zh <> ''), count(*) from committee_members
union all select 'about_page', count(*) filter (where vision_zh <> '' and mission_zh <> '' and history_zh <> '' and activities_zh <> ''), count(*) from about_page;
