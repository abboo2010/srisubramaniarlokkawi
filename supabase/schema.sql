-- ============================================================
-- Sri Subramaniar Alayam — Annual Prayers & Registration
-- Supabase (Postgres) schema
--
-- Run this once in your Supabase project's SQL Editor (Dashboard →
-- SQL Editor → New query → paste this whole file → Run), BEFORE
-- running seed.sql. Safe to re-run: uses "if not exists" / "or
-- replace" throughout.
--
-- Security model: Row Level Security is enabled on both tables with
-- NO policies granted to the anon/authenticated roles — meaning the
-- browser can never read or write these tables directly, on purpose.
-- Every read and write goes through a Netlify Function using the
-- service_role key (server-side only, never shipped to the browser),
-- the same trust model this project already uses for the Membership
-- check. Table Editor access in the Supabase dashboard is unaffected
-- by RLS — it always uses full admin rights.
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
-- Runs as a single transaction: locks the prayer row (FOR UPDATE),
-- re-checks the role is still open, flips it closed + records the
-- sponsor in the same statement, and only then inserts the booking
-- row. Two devotees registering for the same exclusive slot within
-- milliseconds of each other cannot both win — the second one's
-- conditional UPDATE affects zero rows and the function raises
-- ROLE_TAKEN, which the Netlify Function turns into a friendly
-- "someone just reserved this" message.
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
-- admin_set_booking_status() — used by admin-prayers.html to
-- Confirm/Cancel a booking. Cancelling a Ubayakarar/Annathanam
-- booking automatically reopens that slot on the prayers row (only
-- if the sponsor recorded there still matches this exact booking,
-- so it never clobbers a sponsor the committee has since reassigned
-- by hand).
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
