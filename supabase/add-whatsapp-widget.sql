-- ============================================================
-- One-time migration: adds the whatsapp_widget table so a floating
-- "Chat with Us" WhatsApp card can be shown in the corner of every
-- screen on the site, fully editable (an optional photo, a heading and
-- description in EN/BM/TA, a phone number, an optional pre-filled
-- greeting message, and an on/off switch) from /cms.html's new
-- "WhatsApp Widget" tab.
--
-- Seeded disabled, with the phone number pre-filled from the same
-- WhatsApp number already used for the Contact Us QR code
-- (contact_info.whatsapp_number) — so it's ready to switch on as soon
-- as a heading/description is written in the CMS. Nothing appears on
-- the site until it's turned on there.
--
-- Safe to re-run: table creation uses "if not exists" and the seed row
-- uses "on conflict (id) do nothing" — re-running this after the
-- widget has already been edited in the CMS will NOT overwrite those
-- changes.
--
-- Run this once in Supabase (Dashboard -> SQL Editor -> New query ->
-- paste this whole file -> Run).
-- ============================================================

create table if not exists whatsapp_widget (
  id                  smallint primary key default 1,
  enabled             boolean not null default false,
  image_url           text not null default '',
  heading_en          text not null default '',
  heading_bm          text not null default '',
  heading_ta          text not null default '',
  description_en      text not null default '',
  description_bm      text not null default '',
  description_ta      text not null default '',
  phone_number        text not null default '',
  message_en          text not null default '',
  message_bm          text not null default '',
  message_ta          text not null default '',
  button_label_en     text not null default '',
  button_label_bm     text not null default '',
  button_label_ta     text not null default '',
  updated_at          timestamptz not null default now(),
  constraint whatsapp_widget_singleton check (id = 1)
);
alter table whatsapp_widget enable row level security;
drop trigger if exists whatsapp_widget_set_updated_at on whatsapp_widget;
create trigger whatsapp_widget_set_updated_at before update on whatsapp_widget
  for each row execute function set_updated_at();

insert into whatsapp_widget (id, enabled, phone_number)
values (1, false, coalesce((select whatsapp_number from contact_info where id = 1), ''))
on conflict (id) do nothing;
