-- ============================================================
-- One-time migration: adds the Gallery Category > Folder > Photo
-- hierarchy on top of an existing live database.
--
-- Before this, the Gallery was a single flat list of photos with a
-- free-text "category" field. This migration:
--   1. Creates the new gallery_categories and gallery_folders tables.
--   2. Adds folder_id and thumbnail_url columns to the existing
--      gallery table (kept the same name/table — just extended).
--   3. For every distinct category_en value already in gallery,
--      creates a matching Category, plus one Folder named "General"
--      under it, and points the existing photos in that category at
--      that folder — so nothing already in the Gallery tab disappears.
--      Any photo with an already-set folder_id, or a blank
--      category_en, is left alone.
--
-- Safe to re-run: every step uses "if not exists" / "on conflict do
-- nothing", and step 3 only touches rows that still have no folder_id.
--
-- Run this once in Supabase (Dashboard -> SQL Editor -> New query ->
-- paste this whole file -> Run). Afterwards, open /cms.html's new
-- "Gallery Categories" and "Gallery Folders" tabs to rename "General"
-- folders to something more specific, or add real folders per event.
-- ============================================================

-- ---------- 1. New tables ----------

create table if not exists gallery_categories (
  id          bigint generated always as identity primary key,
  name_en     text not null default '',
  name_bm     text not null default '',
  name_ta     text not null default '',
  sort_order  integer not null default 0,
  updated_at  timestamptz not null default now()
);
create unique index if not exists gallery_categories_name_en_key on gallery_categories (name_en);
alter table gallery_categories enable row level security;
drop trigger if exists gallery_categories_set_updated_at on gallery_categories;
create trigger gallery_categories_set_updated_at before update on gallery_categories
  for each row execute function set_updated_at();

create table if not exists gallery_folders (
  id           bigint generated always as identity primary key,
  category_id  bigint not null references gallery_categories(id) on delete cascade,
  name_en      text not null default '',
  name_bm      text not null default '',
  name_ta      text not null default '',
  sort_order   integer not null default 0,
  updated_at   timestamptz not null default now()
);
create index if not exists gallery_folders_category_idx on gallery_folders (category_id, sort_order);
create unique index if not exists gallery_folders_category_name_key on gallery_folders (category_id, name_en);
alter table gallery_folders enable row level security;
drop trigger if exists gallery_folders_set_updated_at on gallery_folders;
create trigger gallery_folders_set_updated_at before update on gallery_folders
  for each row execute function set_updated_at();

-- ---------- 2. Extend the existing gallery (photos) table ----------

alter table gallery add column if not exists folder_id bigint references gallery_folders(id) on delete cascade;
alter table gallery add column if not exists thumbnail_url text not null default '';
create index if not exists gallery_folder_idx on gallery (folder_id, sort_order);

-- ---------- 3. Backfill: one Category + one "General" Folder per
-- distinct existing category_en, existing photos pointed at it ----------

insert into gallery_categories (name_en, name_bm, name_ta, sort_order)
select name_en, name_bm, name_ta, (row_number() over (order by min_sort) - 1)::int
from (
  select g.category_en as name_en, g.category_bm as name_bm, g.category_ta as name_ta,
         min(g.sort_order) as min_sort
  from gallery g
  where g.folder_id is null and coalesce(g.category_en, '') <> ''
  group by g.category_en, g.category_bm, g.category_ta
) grouped
on conflict (name_en) do nothing;

insert into gallery_folders (category_id, name_en, name_bm, name_ta, sort_order)
select c.id, 'General', 'Umum', 'பொது', 0
from gallery_categories c
where exists (
  select 1 from gallery g where g.folder_id is null and g.category_en = c.name_en
)
on conflict (category_id, name_en) do nothing;

update gallery g
set folder_id = f.id
from gallery_folders f
join gallery_categories c on c.id = f.category_id
where g.folder_id is null
  and coalesce(g.category_en, '') <> ''
  and g.category_en = c.name_en
  and f.name_en = 'General';
