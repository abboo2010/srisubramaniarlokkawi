-- New pooja timings (28 Nov 2026): replaces every row in pooja_timings,
-- removing the Full Moon (Pournami) schedule. Safe to re-run, but a re-run
-- overwrites any timing edits made later in /cms.html.
begin;

-- A pooja name can now repeat in one day (morning and evening), so a row
-- is unique by list + name + time instead of list + name.
alter table pooja_timings drop constraint if exists pooja_timings_list_name_key;
drop index if exists pooja_timings_list_name_key;
create unique index if not exists pooja_timings_list_name_time_key
  on pooja_timings (list_type, name_en, time_label);

delete from pooja_timings;

insert into pooja_timings (list_type, name_en, name_bm, name_ta, name_zh, time_label, sort_order) values
  ('today', 'Nadai Thirappu', 'Pembukaan Pintu Kuil', 'நடைத் திறப்பு', '开庙门', '5:30 AM', 0),
  ('today', 'Abishegam', 'Abhishekam', 'அபிஷேகம்', 'Abhishekam', '6:00 AM', 1),
  ('today', 'Pooja', 'Pooja', 'பூஜை', 'Pooja', '7:00 AM', 2),
  ('today', 'Nadai Saatthal', 'Penutupan Pintu Kuil', 'நடை சாத்துதல்', '关庙门', '10:00 AM', 3),
  ('today', 'Nadai Thirappu', 'Pembukaan Pintu Kuil', 'நடைத் திறப்பு', '开庙门', '5:30 PM', 4),
  ('today', 'Pooja', 'Pooja', 'பூஜை', 'Pooja', '7:00 PM', 5),
  ('today', 'Nadai Saatthal', 'Penutupan Pintu Kuil', 'நடை சாத்துதல்', '关庙门', '8:45 PM', 6),
  ('daily', 'Nadai Thirappu', 'Pembukaan Pintu Kuil', 'நடைத் திறப்பு', '开庙门', '5:30 AM', 0),
  ('daily', 'Abishegam', 'Abhishekam', 'அபிஷேகம்', 'Abhishekam', '6:00 AM', 1),
  ('daily', 'Pooja', 'Pooja', 'பூஜை', 'Pooja', '7:00 AM', 2),
  ('daily', 'Nadai Saatthal', 'Penutupan Pintu Kuil', 'நடை சாத்துதல்', '关庙门', '10:00 AM', 3),
  ('daily', 'Nadai Thirappu', 'Pembukaan Pintu Kuil', 'நடைத் திறப்பு', '开庙门', '5:30 PM', 4),
  ('daily', 'Pooja', 'Pooja', 'பூஜை', 'Pooja', '7:00 PM', 5),
  ('daily', 'Nadai Saatthal', 'Penutupan Pintu Kuil', 'நடை சாத்துதல்', '关庙门', '8:45 PM', 6),
  ('friday', 'Abishegam', 'Abhishekam', 'அபிஷேகம்', 'Abhishekam', '5:30 AM', 0),
  ('friday', 'Pooja', 'Pooja', 'பூஜை', 'Pooja', '7:00 AM', 1),
  ('friday', 'Nadai Saatthal', 'Penutupan Pintu Kuil', 'நடை சாத்துதல்', '关庙门', '10:00 AM', 2),
  ('friday', 'Abishegam', 'Abhishekam', 'அபிஷேகம்', 'Abhishekam', '4:30 PM', 3),
  ('friday', 'Pooja', 'Pooja', 'பூஜை', 'Pooja', '7:00 PM', 4),
  ('friday', 'Nadai Saatthal', 'Penutupan Pintu Kuil', 'நடை சாத்துதல்', '关庙门', '9:00 PM', 5);

commit;

select list_type, time_label, name_en from pooja_timings order by list_type, sort_order;
