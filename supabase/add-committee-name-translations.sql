-- ============================================================
-- Add Tamil-script names to the Temple Committee — Ravi reported
-- names weren't switching to Tamil when the language selector was
-- switched. Root cause: committee_members originally stored a
-- single, untranslated "name" column (the reasoning at the time was
-- that a person's own name isn't translated, the same as
-- members.name) — but this site's own Deities section already shows
-- deity names in Tamil script per language, and Ravi wants the same
-- for committee members. This migration adds name_en/name_ta columns,
-- copies the existing name into name_en, and fills name_ta with a
-- transliteration for each of the 15 real committee members (Claude's
-- own transliteration — not reviewed by a Tamil speaker on the
-- committee; freely editable any time from /cms.html's Committee tab).
--
-- Run this once in Supabase (Dashboard → SQL Editor → New query →
-- paste this → Run). Safe to re-run:
--   - "add column if not exists" won't error if already applied.
--   - name_en is only backfilled from the old "name" column where
--     name_en is still blank — never overwrites an edit made since.
--   - name_ta is only filled in where it's still blank — if you've
--     already typed a Tamil name into the CMS yourself (your own
--     wording, which is fine — that's what the field is for), this
--     will never overwrite it.
-- The old "name" column is left in place, unused, exactly like the
-- old category_en columns on the gallery table from an earlier
-- migration — nothing is dropped.
-- ============================================================

alter table committee_members add column if not exists name_en text not null default '';
alter table committee_members add column if not exists name_ta text not null default '';

-- Backfill name_en from the old single "name" column, if that column
-- still exists on this database (a brand-new install that already
-- ran the current cms-schema.sql never had a "name" column at all,
-- so this update simply matches zero rows there).
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'committee_members' and column_name = 'name'
  ) then
    update committee_members
    set name_en = name
    where coalesce(name_en, '') = '' and name is not null and name <> '';
  end if;
end $$;

-- Fill in the Tamil name for each of the 15 real committee members,
-- matched against the (now-backfilled) name_en column. Only touches
-- rows where name_ta is still blank.
update committee_members set name_ta = 'கேப்டன் ஷமளா தேவி முனியாண்டி' where coalesce(name_ta,'') = '' and name_en = 'Capt. Shamala Devi Muniandy';
update committee_members set name_ta = 'திரு. பாலச்சந்திரன் ராமச்சந்திரன்' where coalesce(name_ta,'') = '' and name_en = 'Mr. Balachandran Ramachandran';
update committee_members set name_ta = 'திரு. முனீஸ்வரன் காளிமுத்து' where coalesce(name_ta,'') = '' and name_en = 'Mr. Muniswaran Kalimuthu';
update committee_members set name_ta = 'திரு. ரவிவர்மன் அப்பு' where coalesce(name_ta,'') = '' and name_en = 'Mr. Ravivarman Abboo';
update committee_members set name_ta = 'திருமதி. கமலேஸ்வரி காளியப்பெருமாள்' where coalesce(name_ta,'') = '' and name_en = 'Mdm. Kamaleswari Kaliaperumal';
update committee_members set name_ta = 'திருமதி. பரிமளா கிருஷ்ணன்' where coalesce(name_ta,'') = '' and name_en = 'Mdm. Parimalah Krishnan';
update committee_members set name_ta = 'திருமதி. ஜெயா தேவி குணரத்தினம்' where coalesce(name_ta,'') = '' and name_en = 'Mdm. Jeya Devi Gunaratnam';
update committee_members set name_ta = 'திரு. மோகன் எம். ராஜு' where coalesce(name_ta,'') = '' and name_en = 'Mr. Mohan M. Raju';
update committee_members set name_ta = 'திரு. பவித்திரன் குன்ஹப்நாயர்' where coalesce(name_ta,'') = '' and name_en = 'Mr. Pavithran Kunhappnair';
update committee_members set name_ta = 'திரு. நவீன்குமார் சிவகுமார்' where coalesce(name_ta,'') = '' and name_en = 'Mr. Navinkumar Sivakumar';
update committee_members set name_ta = 'திரு. சிவகுரு சுப்ரமணியம்' where coalesce(name_ta,'') = '' and name_en = 'Mr. Sivaguru Subramaniam';
update committee_members set name_ta = 'திரு. பத்துமலை வேருதசலம்' where coalesce(name_ta,'') = '' and name_en = 'Mr. Batumalai Veruthasalam';
update committee_members set name_ta = 'மேஜர் பி. ஷூரஸ் பத்துமலை (ஓய்வு)' where coalesce(name_ta,'') = '' and name_en = 'Major B. Shuras Batumalai (Rtd)';
update committee_members set name_ta = 'திரு. குணசேகரன் ராஜாங்கம்' where coalesce(name_ta,'') = '' and name_en = 'Mr. Gunasekaran Rajangam';
update committee_members set name_ta = 'திரு. கலைச்செல்வன் கோவிந்தராஜா' where coalesce(name_ta,'') = '' and name_en = 'Mr. Kalaichelvan Govindaraja';
