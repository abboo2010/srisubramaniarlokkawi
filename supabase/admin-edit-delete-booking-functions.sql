-- ============================================================
-- Sri Subramaniar Alayam — Annual Prayers & Registration
-- admin_edit_booking() / admin_delete_booking() — full edit and
-- permanent delete for a booking, used by the Edit/Delete buttons
-- now on every row of admin-prayers.html's Bookings tab.
--
-- Neither function lets you change WHICH pooja or role a booking
-- belongs to (that's a structural change — delete it and use
-- "+ Add Booking" to re-add it under the correct pooja/role
-- instead). What they do let you fix: name, phone, headcount,
-- notes, status, and payment method (Bank Transfer / QR Transfer /
-- Cash — how the committee actually received the money, not
-- something the devotee picks) for edit; a full, permanent removal
-- for delete — as opposed to Cancel, which keeps the record but
-- marks it void.
--
-- Both keep the Schedule tab's sponsor fields in sync for
-- Ubayakarar/Annathanam bookings, same reasoning as
-- admin_add_booking(): editing a sponsor's name here updates the
-- name shown on the Schedule tab too, and deleting (or editing to
-- Cancelled) a still-active Ubayakarar/Annathanam booking reopens
-- that slot — mirroring admin_set_booking_status()'s Cancel path.
--
-- Run this once in your Supabase project's SQL Editor (Dashboard →
-- SQL Editor → New query → paste this whole file → Run). Safe to
-- re-run — "or replace" just redefines the functions.
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
  if p_status not in ('Pending Payment', 'Reserved', 'Confirmed', 'Cancelled') then
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
      -- staying (or becoming) active — keep the Schedule tab's sponsor name
      -- in sync with whatever name this was just edited to, and make sure
      -- the slot reads as taken (covers un-cancelling one via this form too).
      if v_booking.role = 'ubayakarar' then
        update prayers set ubayakarar_sponsor = p_name, ubayakarar_open = false where id = v_booking.prayer_id;
      else
        update prayers set annathanam_sponsor = p_name, annathanam_open = false where id = v_booking.prayer_id;
      end if;
    elsif v_booking.status <> 'Cancelled' then
      -- this edit just cancelled a previously-active sponsor booking — reopen
      -- the slot, same as admin_set_booking_status()'s Cancel path. Only
      -- clears the sponsor if it still matches this exact booking's old name,
      -- so it never clobbers a sponsor the committee has since reassigned.
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
