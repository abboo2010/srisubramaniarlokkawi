-- ============================================================
-- Sri Subramaniar Alayam — Annual Prayers & Registration
-- One-time backfill: give every EXISTING Ubayakarar/Annathanam
-- sponsor a real booking record (reference number + status)
--
-- Why this is needed: sponsors that were part of the original
-- schedule (loaded via seed.sql) or typed directly into the
-- admin Schedule tab never went through the site's registration
-- form, so they have no row in `bookings` — which is why the
-- Reference and Paid/Not Paid display was blank for them, even
-- though it worked correctly for anyone who registered through
-- the site itself (e.g. "5th Puratasi", which already had one).
--
-- What this does: for every pooja that currently has a sponsor
-- name set but no matching (non-cancelled) booking, this creates
-- one — with a real reference in the same "AP-<id>-<code>" format
-- the site itself generates, so the admin Bookings tab and the
-- public prayer detail popup both pick it up immediately.
--
-- Payment status: every backfilled Ubayakarar booking is created
-- as "Pending Payment" (shows as "Not Paid") on purpose — you know
-- which of these were actually already paid and which weren't, I
-- don't, so the safe default is "not yet confirmed." Go to
-- admin-prayers.html → Bookings tab afterward and click "Confirm"
-- on each one you've verified payment for; the rest stay "Not Paid"
-- until you do. Annathanam bookings are always "Reserved" — that
-- role never has a paid/unpaid state, by design (reserve-only,
-- paid to the caterer directly, never collected by the site).
--
-- Safe to run more than once: each half only inserts a booking for
-- a prayer+role that doesn't already have a non-cancelled one, so
-- re-running this after some entries already got booking records
-- (from real site registrations, or a previous run of this script)
-- will not create duplicates.
--
-- Run this once in your Supabase project's SQL Editor (Dashboard →
-- SQL Editor → New query → paste this whole file → Run).
-- ============================================================

-- ---------- Ubayakarar sponsors ----------
insert into bookings (booking_id, prayer_id, prayer_name, date, role, name, phone, participant_count, notes, status)
select
  'AP-' || upper(p.id) || '-' || upper(substr(md5(random()::text || clock_timestamp()::text || p.id || 'u'), 1, 4)),
  p.id, p.name, p.date, 'ubayakarar', p.ubayakarar_sponsor, '', 1,
  'Backfilled — sponsor was already on record before online registration; payment status set manually via admin.',
  'Pending Payment'
from prayers p
where p.ubayakarar_sponsor is not null
  and not exists (
    select 1 from bookings b
    where b.prayer_id = p.id and b.role = 'ubayakarar' and b.status <> 'Cancelled'
  );

-- ---------- Annathanam sponsors ----------
insert into bookings (booking_id, prayer_id, prayer_name, date, role, name, phone, participant_count, notes, status)
select
  'AP-' || upper(p.id) || '-' || upper(substr(md5(random()::text || clock_timestamp()::text || p.id || 'a'), 1, 4)),
  p.id, p.name, p.date, 'annathanam', p.annathanam_sponsor, '', 1,
  'Backfilled — sponsor was already on record before online registration.',
  'Reserved'
from prayers p
where p.annathanam_sponsor is not null
  and not exists (
    select 1 from bookings b
    where b.prayer_id = p.id and b.role = 'annathanam' and b.status <> 'Cancelled'
  );

-- ---------- Check the result ----------
-- Run this separately afterward to see everything this created:
-- select booking_id, prayer_id, prayer_name, role, name, status
-- from bookings
-- where notes like 'Backfilled%'
-- order by prayer_id, role;
