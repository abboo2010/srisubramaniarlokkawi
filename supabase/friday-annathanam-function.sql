-- ============================================================
-- Sri Subramaniar Alayam — Weekly Friday Pooja Annathanam
--
-- A dedicated table for the temple's weekly Friday Annathanam
-- sponsorship (RM 250/week), separate from the annual prayers/
-- bookings tables on purpose:
--   - it's a fixed weekly recurrence (one row per Friday of the
--     year), not a manually curated calendar of special poojas
--   - the temple DOES collect this RM 250 directly and tracks the
--     date it was paid — unlike the annual poojas' Annathanam role,
--     which was deliberately simplified this year to never track
--     payment (that sponsor pays the caterer directly instead)
--   - the committee asked for this to live in its own tab, entirely
--     separate from the Bookings/Events tabs, so a full year of
--     weekly rows never clutters either of those
-- One row per Friday: sponsor_name null = open, set = sponsored.
-- paid_date null = not paid yet, set = the date payment came in.
-- skip_reason set (e.g. "Thaipusam") = no Annathanam that week at
-- all — not offered publicly, not orderable, sponsor fields stay
-- empty. There is deliberately no separate "bookings" history here:
-- each Friday is a single slot, same as the source spreadsheet this
-- was imported from — if a sponsor cancels, the committee just
-- clears/replaces the name via the admin tab.
--
-- Run this once in your Supabase project's SQL Editor (Dashboard →
-- SQL Editor → New query → paste this whole file → Run). Safe to
-- re-run — "if not exists" / "or replace" / "on conflict do
-- nothing" throughout, so re-running never duplicates the seeded
-- 2026 data or clobbers anything the committee has since edited.
-- ============================================================

create table if not exists friday_annathanam (
  date          date primary key,
  fee           numeric not null default 250,
  sponsor_name  text,
  sponsor_phone text,
  paid_date     date,
  skip_reason   text,
  notes         text not null default '',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table friday_annathanam enable row level security;
-- No anon/authenticated policies, same trust model as prayers/bookings —
-- every read and write goes through a Netlify Function using the
-- service_role key.

drop trigger if exists friday_annathanam_set_updated_at on friday_annathanam;
create trigger friday_annathanam_set_updated_at before update on friday_annathanam
  for each row execute function set_updated_at();
-- set_updated_at() is defined in schema.sql / RUN-THIS-ONE-FILE.sql —
-- run one of those first if this errors with "function does not exist".

-- ---------- public: self-register as this Friday's Annathanam sponsor ----------
-- Mirrors register_prayer()'s race-safe locking (schema.sql): locks the
-- row, re-checks it's still open, and only then claims it — so two
-- devotees submitting for the same Friday within moments of each other
-- cannot both "win" it.
create or replace function register_friday_annathanam(
  p_date  date,
  p_name  text,
  p_phone text
) returns table(fa_date date, fee numeric)
language plpgsql
security definer
as $$
declare
  v_row     friday_annathanam%rowtype;
  v_updated integer;
begin
  select * into v_row from friday_annathanam where date = p_date for update;
  if not found then
    raise exception 'DATE_NOT_FOUND';
  end if;
  if v_row.date < current_date then
    raise exception 'DATE_OVER';
  end if;
  if v_row.skip_reason is not null then
    raise exception 'DATE_SKIPPED';
  end if;
  if v_row.sponsor_name is not null then
    raise exception 'DATE_TAKEN';
  end if;

  update friday_annathanam
    set sponsor_name = p_name, sponsor_phone = coalesce(p_phone, '')
    where date = p_date and sponsor_name is null;
  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    raise exception 'DATE_TAKEN';
  end if;

  return query select v_row.date, v_row.fee;
end;
$$;

-- ---------- admin: full CRUD for one Friday ----------
-- Upsert by design (insert-or-update by date) — same "admin is the
-- source of truth" reasoning as admin_add_booking(): no open/date
-- checks, and it doubles as how the committee adds a Friday that
-- doesn't exist yet (e.g. generating next year's weeks one at a time,
-- or backfilling a week the initial import missed). p_fee of null
-- keeps whatever fee an existing row already has, defaulting to 250
-- only for a brand-new row.
create or replace function admin_set_friday_annathanam(
  p_date          date,
  p_fee           numeric,
  p_sponsor_name  text,
  p_sponsor_phone text,
  p_paid_date     date,
  p_skip_reason   text,
  p_notes         text
) returns void
language plpgsql
security definer
as $$
begin
  insert into friday_annathanam (date, fee, sponsor_name, sponsor_phone, paid_date, skip_reason, notes)
  values (
    p_date, coalesce(p_fee, 250), nullif(p_sponsor_name, ''), nullif(p_sponsor_phone, ''),
    p_paid_date, nullif(p_skip_reason, ''), coalesce(p_notes, '')
  )
  on conflict (date) do update set
    fee           = coalesce(p_fee, friday_annathanam.fee),
    sponsor_name  = nullif(p_sponsor_name, ''),
    sponsor_phone = nullif(p_sponsor_phone, ''),
    paid_date     = p_paid_date,
    skip_reason   = nullif(p_skip_reason, ''),
    notes         = coalesce(p_notes, '');
end;
$$;

-- ---------- admin: remove a Friday row entirely ----------
-- For a mistakenly-added date, not for normal "clear the sponsor" use —
-- that's just admin_set_friday_annathanam() with a blank sponsor name,
-- which keeps the week itself on the schedule as open again.
create or replace function admin_delete_friday_annathanam(p_date date)
returns void
language plpgsql
security definer
as $$
begin
  delete from friday_annathanam where date = p_date;
end;
$$;

-- ---------- seed: the 2026 schedule, imported from the committee's
-- existing spreadsheet (Weekly_Friday_Pooja_2026.xlsx) ----------
-- All 52 Fridays of 2026, with whatever sponsor/paid-date data was
-- already filled in there. The two Thaipusam Fridays are marked
-- skipped rather than left blank, since "no Annathanam this week" is
-- different from "not sponsored yet". "on conflict do nothing" makes
-- this safe to re-run without overwriting anything the committee has
-- since edited through the admin tab.
insert into friday_annathanam (date, fee, sponsor_name, sponsor_phone, paid_date, skip_reason, notes) values
  ('2026-01-02', 250, 'Mr. Subramaniam & Family', null, '2026-01-17', null, ''),
  ('2026-01-09', 250, 'Mr. & Mrs. Keshen Malanvli', null, '2026-01-04', null, ''),
  ('2026-01-16', 250, 'Mr. & Mrs. Manimaran Maheswary', null, '2026-01-06', null, ''),
  ('2026-01-23', 250, null, null, null, 'Thaipusam', ''),
  ('2026-01-30', 250, null, null, null, 'Thaipusam', ''),
  ('2026-02-06', 250, 'Mr. Uvasangkaran Muthusamy Family', null, '2026-01-05', null, ''),
  ('2026-02-13', 250, 'Dr. Nirumala & Family', null, '2026-01-08', null, ''),
  ('2026-02-20', 250, 'Mr. & Mrs. PremVani Family', null, '2026-02-08', null, ''),
  ('2026-02-27', 250, 'Mr. Prabakaran & Family', null, '2026-01-10', null, ''),
  ('2026-03-06', 250, 'Mr. & Mrs. Ravi Malathi Family', null, null, null, ''),
  ('2026-03-13', 250, 'Mr. Rajakumar & Family', null, '2026-01-08', null, ''),
  ('2026-03-20', 250, 'Dr. Mohanaprasanth & Family', null, '2026-03-16', null, ''),
  ('2026-03-27', 250, 'Dr. Raj & Family', null, '2025-12-28', null, ''),
  ('2026-04-03', 250, 'Dr. Ray & Family', null, '2026-04-24', null, ''),
  ('2026-04-10', 250, 'Dr. Sathiyasilan & Dr. Gejalachumy Family', null, '2026-02-14', null, ''),
  ('2026-04-17', 250, 'Madam Rekha & Family', null, '2025-12-28', null, ''),
  ('2026-04-24', 250, 'Prof. Dr. Pathmanathan, Cikgu Maha & Neelakkshi', null, '2026-02-04', null, ''),
  ('2026-05-01', 250, 'Mr. Nantha Kumar & Family', null, null, null, ''),
  ('2026-05-08', 250, 'Mdm. Genivieve & Family', null, null, null, ''),
  ('2026-05-15', 250, 'Mr. Nanthan Terra Tech Borneo', null, '2026-05-13', null, 'ravi'),
  ('2026-05-22', 250, 'Mr. Ravivarman Abboo & Mdm. Elsa Honey', null, '2026-05-21', null, ''),
  ('2026-05-29', 250, 'Mr. Prabakaran & Family', null, '2026-01-10', null, ''),
  ('2026-06-05', 250, 'Dr. Ray & Family', null, '2026-04-24', null, ''),
  ('2026-06-12', 250, 'Mr. Nanthan Terra Tech Borneo', null, null, null, ''),
  ('2026-06-19', 250, 'Prof. Dr. Pathmanathan, Cikgu Maha & Neelakkshi', null, '2026-02-04', null, ''),
  ('2026-06-26', 250, 'Mr. & Mrs. Manimaran Maheswary', null, '2026-01-06', null, ''),
  ('2026-07-03', 250, 'Dr. Vennila & Family', null, '2026-01-06', null, ''),
  ('2026-07-10', 250, 'Ms. Veronica & Family', null, '2026-07-02', null, ''),
  ('2026-07-17', 250, 'Madam Vaani & Family', null, null, null, ''),
  ('2026-07-24', 250, 'Prof. Dr. Pathmanathan, Cikgu Maha & Neelakkshi', null, '2026-02-04', null, ''),
  ('2026-07-31', 250, 'Dr. Bavani & Family', null, null, null, ''),
  ('2026-08-07', 250, 'Ms. See & Family', null, null, null, ''),
  ('2026-08-14', 250, 'Dr. Ray & Family', null, null, null, ''),
  ('2026-08-21', 250, 'Mr. Nanthan Terra Tech Borneo', null, null, null, ''),
  ('2026-08-28', 250, 'Ms. Keerthikaa Suthahar', null, '2026-01-21', null, ''),
  ('2026-09-04', 250, 'Mr. & Mrs. Manimaran Maheswary', null, '2026-01-06', null, ''),
  ('2026-09-11', 250, 'Mr. Ravivarman Abboo & Mdm. Elsa Honey', null, null, null, ''),
  ('2026-09-18', 250, 'Prof. Dr. Pathmanathan, Cikgu Maha & Neelakkshi', null, '2026-02-04', null, ''),
  ('2026-09-25', 250, 'Mr. Ravivarman Abboo & Mdm. Elsa Honey', null, null, null, ''),
  ('2026-10-02', 250, 'Dr. Ray & Family', null, null, null, ''),
  ('2026-10-09', 250, 'Medisinar Klinik & Surgery Damai', null, null, null, ''),
  ('2026-10-16', 250, 'Mr. & Mrs. Rimash Family', null, '2026-08-10', null, ''),
  ('2026-10-23', 250, 'Mr. & Mrs. Liknaswaran Shubhaashini Family', null, '2026-02-04', null, ''),
  ('2026-10-30', 250, 'Medisinar Klinik & Surgery Damai', null, null, null, ''),
  ('2026-11-06', 250, 'Mr. & Mrs. Ravi Malathi Family', null, null, null, ''),
  ('2026-11-13', 250, 'Madam Vaani & Family', null, null, null, ''),
  ('2026-11-20', 250, 'Ms. Previna Rajendran & Family', null, null, null, ''),
  ('2026-11-27', 250, 'Mr. Nanthan Terra Tech Borneo', null, null, null, ''),
  ('2026-12-04', 250, 'Mr. & Mrs. Ruban Hema Family', null, null, null, ''),
  ('2026-12-11', 250, 'Mr. & Mrs. Krishnan Family', null, '2026-01-21', null, ''),
  ('2026-12-18', 250, 'Mr. Mrs. Manimaran Maheswary', null, '2026-01-06', null, ''),
  ('2026-12-25', 250, 'Mr. Subramaniam & Family', null, null, null, '')
on conflict (date) do nothing;
