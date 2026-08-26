-- ============================================================
-- Adds Push Notifications support.
--
-- Stores one row per browser/device that taps "Enable Notifications"
-- on the site (the bell button in the top bar). No personal data is
-- stored — just the anonymous push endpoint the browser gives us,
-- which is what's needed to send that device a notification later.
--
-- Run this once in Supabase (Dashboard -> SQL Editor -> New query ->
-- paste this whole file -> Run). Safe to re-run.
-- ============================================================

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table push_subscriptions enable row level security;
-- No policies are added on purpose (same pattern as every other table in
-- this app) — the browser never talks to Supabase directly, only the
-- Netlify Functions do, using the service_role key which bypasses RLS.
