-- ============================================================
-- add-admin-users.sql — one-time migration
--
-- Individual committee-member admin logins, replacing the single
-- shared ADMIN_PASSWORD every admin page used before this feature.
-- See netlify/functions/_admin-auth.js for how these rows are used.
--
-- This does NOT need any data seeded — the table starts empty on
-- purpose. The very first login attempt at /cms.html or
-- /admin-prayers.html (with any username plus the existing
-- ADMIN_PASSWORD) automatically creates the first account as a
-- master with full access — see admin-login.js for that one-time
-- bootstrap step. Nothing to type into Supabase by hand.
--
-- Safe to re-run (every statement is idempotent / IF NOT EXISTS).
-- ============================================================

create table if not exists admin_users (
  id             bigint generated always as identity primary key,
  username       text not null,
  password_hash  text not null,
  is_master      boolean not null default false,
  access_cms     boolean not null default true,
  access_prayers boolean not null default true,
  active         boolean not null default true,
  created_at     timestamptz not null default now(),
  last_login_at  timestamptz
);

-- Usernames are always stored lowercased by the functions that write
-- them (admin-login.js's bootstrap, admin-users-crud.js's create), so
-- a plain unique index — not a case-insensitive one — is enough.
create unique index if not exists admin_users_username_key on admin_users (username);

alter table admin_users enable row level security;
