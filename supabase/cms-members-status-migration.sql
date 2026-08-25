-- ============================================================
-- Members — add Status column + index on Membership No.
--
-- Run this once in Supabase (Dashboard → SQL Editor → New query →
-- paste this whole file → Run). Safe to run whether or not you have
-- already run cms-schema.sql before today — every statement below
-- uses "if not exists" / "if not exists" guards, so running it twice
-- (or running it after a fresh cms-schema.sql that already includes
-- these columns) does nothing the second time.
--
-- What this does:
--   1. Adds a "status" column to members, one of:
--        'Active', 'Not Active', 'Pending for Annual renewal'
--      New/blank members default to 'Active'.
--   2. Adds an index on membership_no, since the public Membership
--      Status lookup now searches by Membership No. instead of NRIC
--      (NRIC is a sensitive government ID and is no longer used as
--      the public search key — see check-membership.js).
-- ============================================================

alter table members
  add column if not exists status text not null default 'Active';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'members_status_check'
  ) then
    alter table members
      add constraint members_status_check
      check (status in ('Active', 'Not Active', 'Pending for Annual renewal'));
  end if;
end $$;

create index if not exists members_membership_no_idx on members (membership_no);
