-- ============================================================
-- Sri Subramaniar Alayam — Annual Prayers & Registration
-- ONE-SHOT SETUP / REPAIR SCRIPT
--
-- WHY THIS FILE EXISTS: every earlier SQL fix was sent as a
-- separate file (schema.sql, then admin-add-booking-function.sql,
-- then admin-add-bulk-participants-function.sql, then
-- admin-edit-delete-booking-functions.sql). If even ONE of those
-- was missed, the matching admin action fails silently from the
-- committee's point of view — the Edit/Delete/Add buttons are
-- visible and clickable in the dashboard (because the WEBSITE code
-- is deployed), but the actual database function they call doesn't
-- exist yet, so nothing is saved. This file is the fix for that:
-- it's the complete, current set of tables and functions, all in
-- one paste. There is nothing left to run after this one.
--
-- HOW TO RUN IT:
--   1. Open your Supabase project → SQL Editor → New query
--   2. Paste this ENTIRE file
--   3. Click Run
--   4. Scroll to the bottom of the results — the last query lists
--      every admin_* function now installed. You should see:
--      admin_add_booking, admin_add_bulk_participants,
--      admin_delete_booking, admin_edit_booking,
--      admin_set_booking_status. If any name is missing from that
--      list, something above it failed — scroll up to find the red
--      error and send it over.
--
-- SAFE TO RE-RUN: every statement uses "if not exists" or "or
-- replace", so running this again later (after a future update)
-- never duplicates tables or loses data — it only redefines
-- functions and adds anything genuinely missing.
-- ============================================================


-- ============================================================
-- PART 1 — Tables, indexes, triggers, and the public/registration
-- functions (register_prayer, admin_set_booking_status).
-- Originally supabase/schema.sql.
-- ============================================================

-- ---------- prayers: the schedule + current sponsor state ----------
create table if not exists prayers (
  id                   text primary key,
  ref                  integer,
  date                 date not null,
  name                 text not null,
  ubayam_fee           numeric,
  ubayakarar_sponsor   text,
  ubayakarar_open      boolean not null default true,
  annathanam_sponsor   text,
  annathanam_open      boolean not null default true,
  participants_enabled boolean not null default false,
  participant_fee      numeric,
  notes                text not null default '',
  status_override      text check (status_override in ('completed', 'upcoming')),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index if not exists prayers_date_idx on prayers (date);

alter table prayers enable row level security;

-- ---------- bookings: every registration submitted through the site ----------
create table if not exists bookings (
  id                 bigint generated always as identity primary key,
  booking_id         text unique not null,
  prayer_id          text not null references prayers (id),
  prayer_name        text not null,
  date               date not null,
  role               text not null check (role in ('ubayakarar', 'annathanam', 'participant')),
  name               text not null,
  phone              text not null,
  participant_count  integer not null default 1,
  notes              text not null default '',
  -- 'Confirmed' means the booking/slot itself is confirmed, with no
  -- statement about money (this is the only status Annathanam ever
  -- needs, since it never collects a fee). 'Paid/Confirmed' is the
  -- distinct status for "payment has actually been received" — what
  -- Ubayakarar and Participant bookings move to once a bank-in slip,
  -- QR transfer, or cash payment comes in.
  status             text not null default 'Pending Payment'
                       check (status in ('Pending Payment', 'Reserved', 'Confirmed', 'Paid/Confirmed', 'Cancelled')),
  -- How a payment actually reached the temple (bank-in slip, QR transfer,
  -- or cash) — recorded by the committee for their own records, not
  -- selected by the devotee on the public site. Only meaningful for
  -- Ubayakarar/Participant bookings, since Annathanam never collects a
  -- fee; left null until the committee notes it in admin-prayers.html.
  payment_method     text check (payment_method is null or payment_method in ('Bank Transfer', 'QR Transfer', 'Cash')),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists bookings_prayer_idx on bookings (prayer_id);
create index if not exists bookings_status_idx on bookings (status);

-- Idempotent add for an already-existing bookings table (this whole file
-- is safe to re-run; ADD COLUMN IF NOT EXISTS is a no-op once the column
-- above already exists from a fresh install).
alter table bookings add column if not exists payment_method text;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'bookings_payment_method_check') then
    alter table bookings add constraint bookings_payment_method_check
      check (payment_method is null or payment_method in ('Bank Transfer', 'QR Transfer', 'Cash'));
  end if;
end $$;

-- Idempotent widen of the status check for an already-existing table —
-- drop-and-recreate is the standard way to change a CHECK constraint's
-- definition in Postgres; bookings_status_check is the name Postgres
-- itself assigns to the inline check above (table_column_check), so this
-- is a no-op the second time you run it, not a repeated drop of nothing.
alter table bookings drop constraint if exists bookings_status_check;
alter table bookings add constraint bookings_status_check
  check (status in ('Pending Payment', 'Reserved', 'Confirmed', 'Paid/Confirmed', 'Cancelled'));

-- One-time backfill: under the old single "Confirmed" status, a
-- Ubayakarar or Participant booking marked Confirmed always meant
-- "payment received" (that's what the "Mark Paid" button set it to).
-- Now that Paid/Confirmed exists as its own status, move those existing
-- bookings onto it so their true meaning is preserved. Annathanam is
-- deliberately left alone — it never collects a fee, so a Confirmed
-- Annathanam booking never meant "paid" and shouldn't become
-- Paid/Confirmed. Safe to re-run: nothing still matches after the
-- first pass.
update bookings set status = 'Paid/Confirmed'
  where status = 'Confirmed' and role in ('ubayakarar', 'participant');

alter table bookings enable row level security;

-- ---------- caterers: informational Annathanam caterer directory ----------
create table if not exists caterers (
  id          bigint generated always as identity primary key,
  name        text not null,
  contact     text not null default '',
  phone       text not null default '',
  sort_order  integer not null default 0
);
alter table caterers enable row level security;

-- ---------- keep updated_at current on every UPDATE ----------
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists prayers_set_updated_at on prayers;
create trigger prayers_set_updated_at before update on prayers
  for each row execute function set_updated_at();

drop trigger if exists bookings_set_updated_at on bookings;
create trigger bookings_set_updated_at before update on bookings
  for each row execute function set_updated_at();

-- ============================================================
-- register_prayer() — the one write path devotee registrations use.
-- ============================================================
create or replace function register_prayer(
  p_prayer_id          text,
  p_role               text,
  p_name               text,
  p_phone              text,
  p_participant_count  integer,
  p_notes              text
) returns table(booking_id text, status text, fee numeric)
language plpgsql
security definer
as $$
declare
  v_prayer    prayers%rowtype;
  v_booking_id text;
  v_status    text;
  v_fee       numeric;
  v_updated   integer;
  v_over      boolean;
begin
  select * into v_prayer from prayers where id = p_prayer_id for update;
  if not found then
    raise exception 'PRAYER_NOT_FOUND';
  end if;

  v_over := coalesce(
    v_prayer.status_override = 'completed',
    v_prayer.status_override is null and v_prayer.date < current_date
  );
  if v_over then
    raise exception 'PRAYER_OVER';
  end if;

  if p_role = 'ubayakarar' then
    if not v_prayer.ubayakarar_open then
      raise exception 'ROLE_TAKEN';
    end if;
    update prayers set ubayakarar_sponsor = p_name, ubayakarar_open = false
      where id = p_prayer_id and ubayakarar_open = true;
    get diagnostics v_updated = row_count;
    if v_updated = 0 then
      raise exception 'ROLE_TAKEN';
    end if;
    v_status := 'Pending Payment';
    v_fee := v_prayer.ubayam_fee;

  elsif p_role = 'annathanam' then
    if not v_prayer.annathanam_open then
      raise exception 'ROLE_TAKEN';
    end if;
    update prayers set annathanam_sponsor = p_name, annathanam_open = false
      where id = p_prayer_id and annathanam_open = true;
    get diagnostics v_updated = row_count;
    if v_updated = 0 then
      raise exception 'ROLE_TAKEN';
    end if;
    v_status := 'Reserved';
    v_fee := null;

  elsif p_role = 'participant' then
    if not v_prayer.participants_enabled then
      raise exception 'PARTICIPANT_NOT_ENABLED';
    end if;
    v_status := case when coalesce(v_prayer.participant_fee, 0) > 0 then 'Pending Payment' else 'Reserved' end;
    v_fee := v_prayer.participant_fee;

  else
    raise exception 'INVALID_ROLE';
  end if;

  v_booking_id := 'AP-' || upper(p_prayer_id) || '-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 4));

  insert into bookings (booking_id, prayer_id, prayer_name, date, role, name, phone, participant_count, notes, status)
  values (v_booking_id, p_prayer_id, v_prayer.name, v_prayer.date, p_role, p_name, p_phone,
          greatest(1, coalesce(p_participant_count, 1)), coalesce(p_notes, ''), v_status);

  return query select v_booking_id, v_status, v_fee;
end;
$$;

-- ============================================================
-- admin_set_booking_status() — Confirm/Cancel a booking.
-- ============================================================
create or replace function admin_set_booking_status(p_booking_id text, p_status text)
returns void
language plpgsql
security definer
as $$
declare
  v_booking bookings%rowtype;
begin
  if p_status not in ('Pending Payment', 'Reserved', 'Confirmed', 'Paid/Confirmed', 'Cancelled') then
    raise exception 'INVALID_STATUS';
  end if;

  select * into v_booking from bookings where booking_id = p_booking_id for update;
  if not found then
    raise exception 'BOOKING_NOT_FOUND';
  end if;

  update bookings set status = p_status where booking_id = p_booking_id;

  if p_status = 'Cancelled' and v_booking.status <> 'Cancelled' and v_booking.role in ('ubayakarar', 'annathanam') then
    if v_booking.role = 'ubayakarar' then
      update prayers set ubayakarar_open = true, ubayakarar_sponsor = null
        where id = v_booking.prayer_id and ubayakarar_sponsor is not distinct from v_booking.name;
    else
      update prayers set annathanam_open = true, annathanam_sponsor = null
        where id = v_booking.prayer_id and annathanam_sponsor is not distinct from v_booking.name;
    end if;
  end if;
end;
$$;


-- ============================================================
-- PART 2 — admin_add_booking(). Originally
-- supabase/admin-add-booking-function.sql. Lets the committee
-- record a booking by hand from admin-prayers.html's "+ Add
-- Booking" button — including for a past pooja, which
-- register_prayer() above deliberately refuses.
-- ============================================================
create or replace function admin_add_booking(
  p_prayer_id          text,
  p_role               text,
  p_name               text,
  p_phone              text,
  p_participant_count  integer,
  p_notes              text,
  p_status             text,
  p_payment_method     text default null
) returns table(booking_id text, status text)
language plpgsql
security definer
as $$
declare
  v_prayer     prayers%rowtype;
  v_booking_id text;
  v_status     text;
begin
  select * into v_prayer from prayers where id = p_prayer_id for update;
  if not found then
    raise exception 'PRAYER_NOT_FOUND';
  end if;

  if p_role not in ('ubayakarar', 'annathanam', 'participant') then
    raise exception 'INVALID_ROLE';
  end if;

  v_status := coalesce(nullif(p_status, ''), case when p_role = 'annathanam' then 'Reserved' else 'Confirmed' end);
  if v_status not in ('Pending Payment', 'Reserved', 'Confirmed', 'Paid/Confirmed', 'Cancelled') then
    raise exception 'INVALID_STATUS';
  end if;
  if nullif(p_payment_method, '') is not null and p_payment_method not in ('Bank Transfer', 'QR Transfer', 'Cash') then
    raise exception 'INVALID_PAYMENT_METHOD';
  end if;

  v_booking_id := 'AP-' || upper(p_prayer_id) || '-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 4));

  insert into bookings (booking_id, prayer_id, prayer_name, date, role, name, phone, participant_count, notes, status, payment_method)
  values (v_booking_id, p_prayer_id, v_prayer.name, v_prayer.date, p_role, p_name, coalesce(p_phone, ''),
          greatest(1, coalesce(p_participant_count, 1)), coalesce(p_notes, ''), v_status, nullif(p_payment_method, ''));

  if p_role = 'ubayakarar' then
    update prayers set ubayakarar_sponsor = p_name, ubayakarar_open = false where id = p_prayer_id;
  elsif p_role = 'annathanam' then
    update prayers set annathanam_sponsor = p_name, annathanam_open = false where id = p_prayer_id;
  end if;

  return query select v_booking_id, v_status;
end;
$$;


-- ============================================================
-- PART 3 — admin_add_bulk_participants(). Originally
-- supabase/admin-add-bulk-participants-function.sql. Paste-a-
-- whole-list version of admin_add_booking() for backfilling a
-- past event's participant list (e.g. for an AGM report).
-- ============================================================
create or replace function admin_add_bulk_participants(
  p_prayer_id       text,
  p_entries         jsonb,   -- e.g. '[{"name":"Mr. Ravi","count":2},{"name":"Kumaresan A/L Muthu","count":1}]'
  p_status          text,
  p_payment_method  text default null  -- applies to every entry in this batch, e.g. "everyone paid cash at the door"
) returns integer
language plpgsql
security definer
as $$
declare
  v_prayer     prayers%rowtype;
  v_status     text;
  v_entry      jsonb;
  v_name       text;
  v_inserted   integer := 0;
  v_booking_id text;
begin
  select * into v_prayer from prayers where id = p_prayer_id for update;
  if not found then
    raise exception 'PRAYER_NOT_FOUND';
  end if;

  v_status := coalesce(nullif(p_status, ''), 'Confirmed');
  if v_status not in ('Pending Payment', 'Reserved', 'Confirmed', 'Paid/Confirmed', 'Cancelled') then
    raise exception 'INVALID_STATUS';
  end if;
  if nullif(p_payment_method, '') is not null and p_payment_method not in ('Bank Transfer', 'QR Transfer', 'Cash') then
    raise exception 'INVALID_PAYMENT_METHOD';
  end if;

  if jsonb_typeof(p_entries) is distinct from 'array' or jsonb_array_length(p_entries) = 0 then
    raise exception 'NO_ENTRIES';
  end if;

  for v_entry in select * from jsonb_array_elements(p_entries)
  loop
    v_name := trim(both from coalesce(v_entry->>'name', ''));
    if v_name <> '' then
      v_booking_id := 'AP-' || upper(p_prayer_id) || '-' ||
        upper(substr(md5(random()::text || clock_timestamp()::text || v_inserted::text), 1, 4));

      insert into bookings (booking_id, prayer_id, prayer_name, date, role, name, phone, participant_count, notes, status, payment_method)
      values (
        v_booking_id, p_prayer_id, v_prayer.name, v_prayer.date, 'participant',
        v_name, '', greatest(1, coalesce((v_entry->>'count')::integer, 1)),
        'Backfilled — bulk-entered participant list.', v_status, nullif(p_payment_method, '')
      );
      v_inserted := v_inserted + 1;
    end if;
  end loop;

  if v_inserted = 0 then
    raise exception 'NO_ENTRIES';
  end if;

  return v_inserted;
end;
$$;


-- ============================================================
-- PART 4 — admin_edit_booking() / admin_delete_booking().
-- Originally supabase/admin-edit-delete-booking-functions.sql.
-- Full edit and permanent delete for any booking (sponsor OR
-- participant) — this is what the Edit/Delete buttons on the
-- Bookings tab, and the Edit/Delete controls inside the Schedule
-- tab's 👥 Manage Participants modal, both call.
-- ============================================================
create or replace function admin_edit_booking(
  p_booking_id         text,
  p_name               text,
  p_phone              text,
  p_participant_count  integer,
  p_notes              text,
  p_status             text,
  p_payment_method     text default null
) returns void
language plpgsql
security definer
as $$
declare
  v_booking bookings%rowtype;
begin
  if p_status not in ('Pending Payment', 'Reserved', 'Confirmed', 'Paid/Confirmed', 'Cancelled') then
    raise exception 'INVALID_STATUS';
  end if;
  if nullif(p_payment_method, '') is not null and p_payment_method not in ('Bank Transfer', 'QR Transfer', 'Cash') then
    raise exception 'INVALID_PAYMENT_METHOD';
  end if;

  select * into v_booking from bookings where booking_id = p_booking_id for update;
  if not found then
    raise exception 'BOOKING_NOT_FOUND';
  end if;

  update bookings
    set name = p_name,
        phone = coalesce(p_phone, ''),
        participant_count = greatest(1, coalesce(p_participant_count, 1)),
        notes = coalesce(p_notes, ''),
        status = p_status,
        payment_method = nullif(p_payment_method, ''),
        updated_at = now()
    where booking_id = p_booking_id;

  if v_booking.role in ('ubayakarar', 'annathanam') then
    if p_status <> 'Cancelled' then
      if v_booking.role = 'ubayakarar' then
        update prayers set ubayakarar_sponsor = p_name, ubayakarar_open = false where id = v_booking.prayer_id;
      else
        update prayers set annathanam_sponsor = p_name, annathanam_open = false where id = v_booking.prayer_id;
      end if;
    elsif v_booking.status <> 'Cancelled' then
      if v_booking.role = 'ubayakarar' then
        update prayers set ubayakarar_open = true, ubayakarar_sponsor = null
          where id = v_booking.prayer_id and ubayakarar_sponsor is not distinct from v_booking.name;
      else
        update prayers set annathanam_open = true, annathanam_sponsor = null
          where id = v_booking.prayer_id and annathanam_sponsor is not distinct from v_booking.name;
      end if;
    end if;
  end if;
end;
$$;

create or replace function admin_delete_booking(p_booking_id text)
returns void
language plpgsql
security definer
as $$
declare
  v_booking bookings%rowtype;
begin
  select * into v_booking from bookings where booking_id = p_booking_id for update;
  if not found then
    raise exception 'BOOKING_NOT_FOUND';
  end if;

  if v_booking.status <> 'Cancelled' and v_booking.role in ('ubayakarar', 'annathanam') then
    if v_booking.role = 'ubayakarar' then
      update prayers set ubayakarar_open = true, ubayakarar_sponsor = null
        where id = v_booking.prayer_id and ubayakarar_sponsor is not distinct from v_booking.name;
    else
      update prayers set annathanam_open = true, annathanam_sponsor = null
        where id = v_booking.prayer_id and annathanam_sponsor is not distinct from v_booking.name;
    end if;
  end if;

  delete from bookings where booking_id = p_booking_id;
end;
$$;


-- ============================================================
-- Weekly Friday Pooja Annathanam — a dedicated table, separate from
-- prayers/bookings on purpose (see supabase/friday-annathanam-function.sql
-- for the full explanation). One row per Friday of the year;
-- sponsor_name null = open, paid_date null = not paid yet, skip_reason
-- set = no Annathanam that week at all (e.g. Thaipusam).
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

drop trigger if exists friday_annathanam_set_updated_at on friday_annathanam;
create trigger friday_annathanam_set_updated_at before update on friday_annathanam
  for each row execute function set_updated_at();

-- public: self-register as this Friday's Annathanam sponsor — same
-- race-safe locking as register_prayer().
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

-- admin: full CRUD for one Friday — upsert by design, so it also
-- covers adding a Friday that doesn't exist yet (e.g. next year's
-- weeks). p_fee of null keeps an existing row's current fee.
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

-- admin: remove a Friday row entirely (a mistaken date, not the
-- normal "clear the sponsor" use, which is admin_set_friday_annathanam()
-- with a blank sponsor name).
create or replace function admin_delete_friday_annathanam(p_date date)
returns void
language plpgsql
security definer
as $$
begin
  delete from friday_annathanam where date = p_date;
end;
$$;

-- seed: the 2026 schedule, imported from the committee's spreadsheet.
-- "on conflict do nothing" makes this safe to re-run.
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


-- ============================================================
-- SELF-CHECK — run automatically as part of this script. Look at
-- this query's result at the bottom of the Supabase results panel:
-- you should see exactly these 8 rows plus a Friday Annathanam row
-- count of 52 (or more, if you've added future years). If any
-- function is missing, scroll up for the red error that stopped it
-- from being created.
-- ============================================================
select proname as installed_admin_function
from pg_proc
where proname in (
  'admin_add_booking',
  'admin_add_bulk_participants',
  'admin_delete_booking',
  'admin_edit_booking',
  'admin_set_booking_status',
  'admin_set_friday_annathanam',
  'admin_delete_friday_annathanam',
  'register_friday_annathanam'
)
order by proname;

select count(*) as friday_annathanam_rows from friday_annathanam;
