-- ============================================================
-- Sri Subramaniar Alayam — Site CMS (Hero Banner, Home Tiles,
-- About, Deities, Pooja Timings, Sevas, Announcements, Gallery,
-- Membership, Contact Us)
--
-- Run this once in Supabase (Dashboard → SQL Editor → New query →
-- paste this whole file → Run), AFTER schema.sql (the Annual
-- Prayers one) has already been run — this file assumes the
-- set_updated_at() trigger function it defines already exists, but
-- re-declares it with "create or replace" too, so this file is also
-- safe to run completely on its own. Safe to re-run in general:
-- uses "if not exists" / "or replace" throughout.
--
-- Security model: identical to schema.sql — Row Level Security is
-- enabled on every table below with NO policies granted to the
-- anon/authenticated roles. The browser can never read or write
-- these tables directly; every read goes through cms-content.js /
-- check-membership.js and every write goes through cms-crud.js /
-- cms-members.js / cms-upload-image.js, all using the service_role
-- key server-side. Table Editor access in the Supabase dashboard is
-- unaffected by RLS — it always uses full admin rights.
-- ============================================================

create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ---------- hero_banner: one row (id is always 1) ----------
create table if not exists hero_banner (
  id                          smallint primary key default 1,
  eyebrow_en                  text not null default 'Welcome to',
  eyebrow_bm                  text not null default '',
  eyebrow_ta                  text not null default '',
  title_line1_en              text not null default 'Sri Subramaniar Alayam',
  title_line1_bm              text not null default '',
  title_line1_ta              text not null default '',
  title_line2_en              text not null default 'Lok Kawi',
  title_line2_bm              text not null default '',
  title_line2_ta              text not null default '',
  established_value           text not null default '1969',
  established_label_en        text not null default 'Established',
  established_label_bm        text not null default '',
  established_label_ta        text not null default '',
  devotees_value               text not null default '10K+',
  devotees_label_en           text not null default 'Devotees',
  devotees_label_bm           text not null default '',
  devotees_label_ta           text not null default '',
  annual_events_value         text not null default '50+',
  annual_events_label_en      text not null default 'Annual Events',
  annual_events_label_bm      text not null default '',
  annual_events_label_ta      text not null default '',
  upcoming_events_label_en    text not null default 'Upcoming Events',
  upcoming_events_label_bm    text not null default '',
  upcoming_events_label_ta    text not null default '',
  upcoming_events_link        text not null default 'calendar',
  pooja_timings_label_en      text not null default 'Pooja Timings',
  pooja_timings_label_bm      text not null default '',
  pooja_timings_label_ta      text not null default '',
  pooja_timings_link          text not null default 'timings',
  image_url                   text not null default 'assets/hero-banner.jpg',
  updated_at                  timestamptz not null default now(),
  constraint hero_banner_singleton check (id = 1)
);
alter table hero_banner enable row level security;
drop trigger if exists hero_banner_set_updated_at on hero_banner;
create trigger hero_banner_set_updated_at before update on hero_banner
  for each row execute function set_updated_at();

-- ---------- nav_tiles: the home-screen link boxes ----------
create table if not exists nav_tiles (
  id          bigint generated always as identity primary key,
  tile_key    text unique not null,
  icon        text not null default 'about',
  title_en    text not null default '',
  title_bm    text not null default '',
  title_ta    text not null default '',
  desc_en     text not null default '',
  desc_bm     text not null default '',
  desc_ta     text not null default '',
  destination text not null default 'about',
  enabled     boolean not null default true,
  sort_order  integer not null default 0,
  updated_at  timestamptz not null default now()
);
alter table nav_tiles enable row level security;
drop trigger if exists nav_tiles_set_updated_at on nav_tiles;
create trigger nav_tiles_set_updated_at before update on nav_tiles
  for each row execute function set_updated_at();

-- ---------- about_page: one row (id is always 1) ----------
-- history_* / activities_* are plain text in the CMS textarea: history
-- paragraphs separated by a blank line, activities one per line.
-- cms-content.js splits them back into arrays for the site.
create table if not exists about_page (
  id             smallint primary key default 1,
  vision_en      text not null default '',
  vision_bm      text not null default '',
  vision_ta      text not null default '',
  mission_en     text not null default '',
  mission_bm     text not null default '',
  mission_ta     text not null default '',
  history_en     text not null default '',
  history_bm     text not null default '',
  history_ta     text not null default '',
  activities_en  text not null default '',
  activities_bm  text not null default '',
  activities_ta  text not null default '',
  updated_at     timestamptz not null default now(),
  constraint about_page_singleton check (id = 1)
);
alter table about_page enable row level security;
drop trigger if exists about_page_set_updated_at on about_page;
create trigger about_page_set_updated_at before update on about_page
  for each row execute function set_updated_at();

-- ---------- deities ----------
create table if not exists deities (
  id            bigint generated always as identity primary key,
  name_en       text not null default '',
  name_bm       text not null default '',
  name_ta       text not null default '',
  role_en       text not null default '',
  role_bm       text not null default '',
  role_ta       text not null default '',
  description_en text not null default '',
  description_bm text not null default '',
  description_ta text not null default '',
  image_url     text not null default '',
  color         text not null default '#711821',
  sort_order    integer not null default 0,
  updated_at    timestamptz not null default now()
);
create unique index if not exists deities_name_en_key on deities (name_en);
alter table deities enable row level security;
drop trigger if exists deities_set_updated_at on deities;
create trigger deities_set_updated_at before update on deities
  for each row execute function set_updated_at();

-- ---------- pooja_timings ----------
-- Replaces the old two-sheet PoojaTimings + PoojaNames setup: each row
-- now carries its own EN/BM/TA name directly instead of looking the
-- translation up by matching the English name against a second tab.
create table if not exists pooja_timings (
  id          bigint generated always as identity primary key,
  list_type   text not null check (list_type in ('today','daily','friday','fullMoon')),
  name_en     text not null default '',
  name_bm     text not null default '',
  name_ta     text not null default '',
  time_label  text not null default '',
  sort_order  integer not null default 0,
  updated_at  timestamptz not null default now()
);
create index if not exists pooja_timings_list_idx on pooja_timings (list_type, sort_order);
create unique index if not exists pooja_timings_list_name_key on pooja_timings (list_type, name_en);
alter table pooja_timings enable row level security;
drop trigger if exists pooja_timings_set_updated_at on pooja_timings;
create trigger pooja_timings_set_updated_at before update on pooja_timings
  for each row execute function set_updated_at();

-- ---------- sevas ----------
create table if not exists sevas (
  id          bigint generated always as identity primary key,
  name_en     text not null default '',
  name_bm     text not null default '',
  name_ta     text not null default '',
  price_en    text not null default '',
  price_bm    text not null default '',
  price_ta    text not null default '',
  desc_en     text not null default '',
  desc_bm     text not null default '',
  desc_ta     text not null default '',
  cta_en      text not null default '',
  cta_bm      text not null default '',
  cta_ta      text not null default '',
  sort_order  integer not null default 0,
  updated_at  timestamptz not null default now()
);
create unique index if not exists sevas_name_en_key on sevas (name_en);
alter table sevas enable row level security;
drop trigger if exists sevas_set_updated_at on sevas;
create trigger sevas_set_updated_at before update on sevas
  for each row execute function set_updated_at();

-- ---------- announcements ----------
create table if not exists announcements (
  id          bigint generated always as identity primary key,
  title_en    text not null default '',
  title_bm    text not null default '',
  title_ta    text not null default '',
  desc_en     text not null default '',
  desc_bm     text not null default '',
  desc_ta     text not null default '',
  published   boolean not null default true,
  sort_order  integer not null default 0,
  updated_at  timestamptz not null default now()
);
create unique index if not exists announcements_title_en_key on announcements (title_en);
alter table announcements enable row level security;
drop trigger if exists announcements_set_updated_at on announcements;
create trigger announcements_set_updated_at before update on announcements
  for each row execute function set_updated_at();

-- ---------- gallery_categories: top level of the Gallery browsing
-- hierarchy (e.g. "Festivals", "Deities", "Temple", "Community") ----------
create table if not exists gallery_categories (
  id          bigint generated always as identity primary key,
  name_en     text not null default '',
  name_bm     text not null default '',
  name_ta     text not null default '',
  cover_url   text not null default '',
  sort_order  integer not null default 0,
  updated_at  timestamptz not null default now()
);
create unique index if not exists gallery_categories_name_en_key on gallery_categories (name_en);
alter table gallery_categories enable row level security;
drop trigger if exists gallery_categories_set_updated_at on gallery_categories;
create trigger gallery_categories_set_updated_at before update on gallery_categories
  for each row execute function set_updated_at();

-- ---------- gallery_folders: second level, each folder belongs to one
-- category (e.g. "Thaipusam 2026" under "Festivals") ----------
create table if not exists gallery_folders (
  id           bigint generated always as identity primary key,
  category_id  bigint not null references gallery_categories(id) on delete cascade,
  name_en      text not null default '',
  name_bm      text not null default '',
  name_ta      text not null default '',
  cover_url    text not null default '',
  sort_order   integer not null default 0,
  updated_at   timestamptz not null default now()
);
create index if not exists gallery_folders_category_idx on gallery_folders (category_id, sort_order);
create unique index if not exists gallery_folders_category_name_key on gallery_folders (category_id, name_en);
alter table gallery_folders enable row level security;
drop trigger if exists gallery_folders_set_updated_at on gallery_folders;
create trigger gallery_folders_set_updated_at before update on gallery_folders
  for each row execute function set_updated_at();

-- ---------- gallery: the photos themselves, each belonging to one
-- folder. category_en/bm/ta are kept only as legacy columns from
-- before the Category > Folder hierarchy existed — the CMS no longer
-- reads or writes them, but they're left in place rather than dropped
-- so nothing is destroyed if an older install still has data there.
-- thumbnail_url is a smaller resized copy (generated in the browser
-- alongside the full-size photo on upload) used for grid/browsing
-- views, to keep Supabase egress low; image_url is the full-size
-- photo shown in the lightbox. ----------
create table if not exists gallery (
  id            bigint generated always as identity primary key,
  folder_id     bigint references gallery_folders(id) on delete cascade,
  image_url     text not null default '',
  thumbnail_url text not null default '',
  category_en   text not null default '',
  category_bm   text not null default '',
  category_ta   text not null default '',
  label_en      text not null default '',
  label_bm      text not null default '',
  label_ta      text not null default '',
  sort_order    integer not null default 0,
  updated_at    timestamptz not null default now()
);
create unique index if not exists gallery_label_en_key on gallery (label_en);
create index if not exists gallery_folder_idx on gallery (folder_id, sort_order);
alter table gallery enable row level security;
drop trigger if exists gallery_set_updated_at on gallery;
create trigger gallery_set_updated_at before update on gallery
  for each row execute function set_updated_at();

-- ---------- members: replaces the private "Members" Google Sheet ----------
create table if not exists members (
  id               bigint generated always as identity primary key,
  name             text not null,
  nric             text not null unique,
  membership_no    text not null default '',
  membership_type  text not null default 'Ordinary' check (membership_type in ('Life','Ordinary')),
  status           text not null default 'Active' check (status in ('Active','Not Active','Pending for Annual renewal')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists members_nric_idx on members (nric);
create index if not exists members_membership_no_idx on members (membership_no);
alter table members enable row level security;
drop trigger if exists members_set_updated_at on members;
create trigger members_set_updated_at before update on members
  for each row execute function set_updated_at();

-- ---------- contact_info: one row (id is always 1) ----------
create table if not exists contact_info (
  id                       smallint primary key default 1,
  org_name                 text not null default '',
  registration_no          text not null default '',
  phone                    text not null default '',
  email                    text not null default '',
  whatsapp_number          text not null default '',
  social                   text not null default '', -- comma-separated, e.g. "Facebook, Instagram, YouTube, WhatsApp"
  address_en               text not null default '',
  address_bm               text not null default '',
  address_ta               text not null default '',
  enquiries_heading_en     text not null default 'For Any Enquiries',
  enquiries_heading_bm     text not null default '',
  enquiries_heading_ta     text not null default '',
  whatsapp_caption_en      text not null default '',
  whatsapp_caption_bm      text not null default '',
  whatsapp_caption_ta      text not null default '',
  donation_account_name    text not null default '',
  donation_bank            text not null default '',
  donation_account_number  text not null default '',
  updated_at               timestamptz not null default now(),
  constraint contact_info_singleton check (id = 1)
);
alter table contact_info enable row level security;
drop trigger if exists contact_info_set_updated_at on contact_info;
create trigger contact_info_set_updated_at before update on contact_info
  for each row execute function set_updated_at();

-- ---------- Storage bucket for hero/gallery/deity photos uploaded via the CMS ----------
-- "public" buckets serve objects over a public URL regardless of RLS, so
-- no storage.objects policy is needed for reads. Writes only ever happen
-- through cms-upload-image.js using the service_role key, which bypasses
-- RLS entirely, so no write policy is needed either.
insert into storage.buckets (id, name, public)
values ('temple-media', 'temple-media', true)
on conflict (id) do nothing;
