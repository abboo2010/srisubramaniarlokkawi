-- ============================================================
-- One-time migration: adds the site_popup table so a welcome/notice
-- popup can be shown once per visit on the home page, fully editable
-- (title + message, EN/BM/TA, and an on/off switch) from /cms.html's
-- new "Home Popup" tab.
--
-- Seeded disabled with empty text, so nothing appears on the site
-- until you turn it on and write a message in the CMS.
--
-- Safe to re-run: table creation uses "if not exists" and the seed
-- row uses "on conflict (id) do nothing" — re-running this after
-- you've already edited the popup in the CMS will NOT overwrite your
-- changes.
--
-- Run this once in Supabase (Dashboard -> SQL Editor -> New query ->
-- paste this whole file -> Run).
-- ============================================================

create table if not exists site_popup (
  id           smallint primary key default 1,
  enabled      boolean not null default false,
  title_en     text not null default '',
  title_bm     text not null default '',
  title_ta     text not null default '',
  message_en   text not null default '',
  message_bm   text not null default '',
  message_ta   text not null default '',
  updated_at   timestamptz not null default now(),
  constraint site_popup_singleton check (id = 1)
);
alter table site_popup enable row level security;
drop trigger if exists site_popup_set_updated_at on site_popup;
create trigger site_popup_set_updated_at before update on site_popup
  for each row execute function set_updated_at();

insert into site_popup (id, enabled, title_en, title_bm, title_ta, message_en, message_bm, message_ta)
values (1, false, '', '', '', '', '', '')
on conflict (id) do nothing;
