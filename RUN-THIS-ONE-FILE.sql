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
  status             text not null default 'Pending Payment'
                       check (status in ('Pending Payment', 'Reserved', 'Confirmed', 'Cancelled')),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists bookings_prayer_idx on bookings (prayer_id);
create index if not exists bookings_status_idx on bookings (status);

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
  if p_status not in ('Pending Payment', 'Reserved', 'Confirmed', 'Cancelled') then
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
  p_status             text
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
  if v_status not in ('Pending Payment', 'Reserved', 'Confirmed', 'Cancelled') then
    raise exception 'INVALID_STATUS';
  end if;

  v_booking_id := 'AP-' || upper(p_prayer_id) || '-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 4));

  insert into bookings (booking_id, prayer_id, prayer_name, date, role, name, phone, participant_count, notes, status)
  values (v_booking_id, p_prayer_id, v_prayer.name, v_prayer.date, p_role, p_name, coalesce(p_phone, ''),
          greatest(1, coalesce(p_participant_count, 1)), coalesce(p_notes, ''), v_status);

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
  p_prayer_id text,
  p_entries   jsonb,   -- e.g. '[{"name":"Mr. Ravi","count":2},{"name":"Kumaresan A/L Muthu","count":1}]'
  p_status    text
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
  if v_status not in ('Pending Payment', 'Reserved', 'Confirmed', 'Cancelled') then
    raise exception 'INVALID_STATUS';
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

      insert into bookings (booking_id, prayer_id, prayer_name, date, role, name, phone, participant_count, notes, status)
      values (
        v_booking_id, p_prayer_id, v_prayer.name, v_prayer.date, 'participant',
        v_name, '', greatest(1, coalesce((v_entry->>'count')::integer, 1)),
        'Backfilled — bulk-entered participant list.', v_status
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
  p_status             text
) returns void
language plpgsql
security definer
as $$
declare
  v_booking bookings%rowtype;
begin
  if p_status not in ('Pending Payment', 'Reserved', 'Confirmed', 'Cancelled') then
    raise exception 'INVALID_STATUS';
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
-- SELF-CHECK — run automatically as part of this script. Look at
-- this query's result at the bottom of the Supabase results panel:
-- you should see exactly these 5 rows. If any is missing, scroll up
-- for the red error that stopped it from being created.
-- ============================================================
select proname as installed_admin_function
from pg_proc
where proname in (
  'admin_add_booking',
  'admin_add_bulk_participants',
  'admin_delete_booking',
  'admin_edit_booking',
  'admin_set_booking_status'
)
order by proname;
