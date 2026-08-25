-- ============================================================
-- One-time migration: adds the site_ticker table so the scrolling
-- notice bar at the top of the site (added earlier as fixed text in
-- index.html) can be turned on/off and edited from /cms.html instead.
--
-- Seeds it with the exact text currently live, so nothing changes on
-- the site until you actually edit it in the CMS's new Ticker tab.
--
-- Safe to re-run: table creation uses "if not exists" and the seed
-- row uses "on conflict (id) do nothing" — re-running this after
-- you've already edited the message in the CMS will NOT overwrite
-- your changes.
--
-- Run this once in Supabase (Dashboard -> SQL Editor -> New query ->
-- paste this whole file -> Run).
-- ============================================================

create table if not exists site_ticker (
  id           smallint primary key default 1,
  enabled      boolean not null default true,
  message_en   text not null default '',
  message_bm   text not null default '',
  message_ta   text not null default '',
  updated_at   timestamptz not null default now(),
  constraint site_ticker_singleton check (id = 1)
);
alter table site_ticker enable row level security;
drop trigger if exists site_ticker_set_updated_at on site_ticker;
create trigger site_ticker_set_updated_at before update on site_ticker
  for each row execute function set_updated_at();

insert into site_ticker (id, enabled, message_en)
values (
  1, true,
  '⚠️ WEBSITE UNDER CONSTRUCTION: Information displayed is for testing/reference only and has not yet been reviewed or approved by the Temple Management Committee. Please do not treat it as official or final.'
)
on conflict (id) do nothing;
