-- ============================================================
-- One-time migration: adds the committee_members table so the new
-- "Temple Committee" screen (a new nav item under About Temple) has
-- somewhere to read from, and seeds it with the real committee list
-- Ravi supplied (the org-chart image, 2026-08-29).
--
-- Safe to re-run: table creation uses "if not exists" and every seed
-- row is guarded with "where not exists (...)" keyed on (tier, name)
-- — deliberately NOT a unique constraint (see the comment in
-- cms-schema.sql: Gallery had a caption-uniqueness bug earlier in this
-- build from exactly that kind of constraint, and two committee
-- members could plausibly share a name). Re-running this after you've
-- already edited the committee in the CMS will not create duplicates
-- or touch your edits.
--
-- Malay/Tamil role and portfolio titles are Claude's own translation,
-- not reviewed by a Tamil/Malay speaker on the committee — same as
-- the ticker translations earlier in this build. Edit them any time
-- from /cms.html's new Committee tab.
--
-- Run this once in Supabase (Dashboard -> SQL Editor -> New query ->
-- paste this whole file -> Run).
-- ============================================================

create table if not exists committee_members (
  id            bigint generated always as identity primary key,
  tier          text not null default 'member' check (tier in ('president','vicePresident','officer','member','auditor','trustee')),
  name          text not null default '',
  role_en       text not null default '',
  role_bm       text not null default '',
  role_ta       text not null default '',
  subtitle_en   text not null default '',
  subtitle_bm   text not null default '',
  subtitle_ta   text not null default '',
  phone         text not null default '',
  sort_order    integer not null default 0,
  updated_at    timestamptz not null default now()
);
alter table committee_members enable row level security;
drop trigger if exists committee_members_set_updated_at on committee_members;
create trigger committee_members_set_updated_at before update on committee_members
  for each row execute function set_updated_at();

-- ---------- Leadership ----------
insert into committee_members (tier, name, role_en, role_bm, role_ta, subtitle_en, subtitle_bm, subtitle_ta, phone, sort_order)
select 'president', 'Capt. Shamala Devi Muniandy', 'President', 'Presiden', 'தலைவர்', '', '', '', '012-2487718', 0
where not exists (select 1 from committee_members where tier = 'president' and name = 'Capt. Shamala Devi Muniandy');

insert into committee_members (tier, name, role_en, role_bm, role_ta, subtitle_en, subtitle_bm, subtitle_ta, phone, sort_order)
select 'vicePresident', 'Mr. Balachandran Ramachandran', 'Vice President', 'Naib Presiden', 'துணைத் தலைவர்', '', '', '', '011-31559091', 0
where not exists (select 1 from committee_members where tier = 'vicePresident' and name = 'Mr. Balachandran Ramachandran');

-- ---------- Officers ----------
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

-- ---------- Committee Members ----------
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

-- ---------- Internal Auditors ----------
insert into committee_members (tier, name, sort_order)
select 'auditor', 'Mr. Batumalai Veruthasalam', 0
where not exists (select 1 from committee_members where tier = 'auditor' and name = 'Mr. Batumalai Veruthasalam');

insert into committee_members (tier, name, sort_order)
select 'auditor', 'Major B. Shuras Batumalai (Rtd)', 1
where not exists (select 1 from committee_members where tier = 'auditor' and name = 'Major B. Shuras Batumalai (Rtd)');

-- ---------- Trustees ----------
insert into committee_members (tier, name, sort_order)
select 'trustee', 'Mr. Gunasekaran Rajangam', 0
where not exists (select 1 from committee_members where tier = 'trustee' and name = 'Mr. Gunasekaran Rajangam');

insert into committee_members (tier, name, sort_order)
select 'trustee', 'Mr. Kalaichelvan Govindaraja', 1
where not exists (select 1 from committee_members where tier = 'trustee' and name = 'Mr. Kalaichelvan Govindaraja');
