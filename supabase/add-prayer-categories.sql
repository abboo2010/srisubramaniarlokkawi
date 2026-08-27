-- ============================================================
-- Adds Prayer/Pooja categories, per the temple treasurer's request:
-- the existing schedule is "Annual Prayers/Poojas", and this adds two
-- more — "Monthly Prayers/Poojas" and "Special Prayers/Poojas".
--
-- Every pooja already in your schedule is set to 'annual' by this
-- migration's default — nothing currently on the site moves or
-- disappears. Use the new Category dropdown in admin-prayers.html's
-- Add/Edit Pooja form to move individual poojas to Monthly or
-- Special, or to set the category on new ones you add.
--
-- Run this once in Supabase (Dashboard -> SQL Editor -> New query ->
-- paste this whole file -> Run), then merge and redeploy the
-- accompanying files.
--
-- Safe to re-run.
-- ============================================================

alter table prayers add column if not exists category text not null default 'annual';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'prayers_category_check') then
    alter table prayers add constraint prayers_category_check check (category in ('annual', 'monthly', 'special'));
  end if;
end $$;

create index if not exists prayers_category_idx on prayers (category);
