-- ============================================================
-- Sri Subramaniar Alayam — Annual Prayers & Registration
-- admin_add_bulk_participants() — paste-a-whole-list version of
-- admin_add_booking(), for typing in a past event's participant
-- list (e.g. for AGM reporting) without clicking "Add Booking" once
-- per person.
--
-- Takes one pooja and a JSON array of {"name": ..., "count": ...}
-- entries (built from the admin page's textarea, one line per
-- person) and inserts one participant booking per entry, all in a
-- single transaction — so a mistake partway through doesn't leave a
-- half-entered list behind.
--
-- Same "admin is the source of truth" reasoning as admin_add_booking:
-- no "must be upcoming" check, so this works for past poojas too.
--
-- Run this once in your Supabase project's SQL Editor (Dashboard →
-- SQL Editor → New query → paste this whole file → Run). Safe to
-- re-run — "or replace" just redefines the function.
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
