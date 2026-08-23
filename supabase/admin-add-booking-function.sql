-- ============================================================
-- Sri Subramaniar Alayam — Annual Prayers & Registration
-- admin_add_booking() — lets the committee record a booking by hand
-- from admin-prayers.html's new "+ Add Booking" button.
--
-- Why this exists: the public registration form (register_prayer(),
-- see schema.sql) refuses anything for a pooja that has already
-- taken place — that's correct for devotees, but it means there was
-- no way to log people who actually attended a PAST pooja (e.g. a
-- walk-in participant list you're entering after the fact, or a
-- sponsor you forgot to record at the time). This function is the
-- same idea as register_prayer() but for the admin: no "must be
-- upcoming" check, no "must currently be open" check — the admin is
-- the source of truth, not a race between two devotees.
--
-- For Ubayakarar/Annathanam it also updates that pooja's sponsor
-- name on the Schedule tab (and marks the slot no longer open),
-- same as a real registration would, so everything stays consistent.
-- For Participant it just adds the row — participant slots were
-- never exclusive to begin with.
--
-- Run this once in your Supabase project's SQL Editor (Dashboard →
-- SQL Editor → New query → paste this whole file → Run). Safe to
-- re-run — "or replace" just redefines the function.
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
  if v_status not in ('Pending Payment', 'Reserved', 'Confirmed', 'Cancelled') then
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
