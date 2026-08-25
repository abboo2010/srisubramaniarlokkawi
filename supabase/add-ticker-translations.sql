-- ============================================================
-- Backfills Malay + Tamil text for the notice ticker, for anyone
-- who already ran the original add-site-ticker.sql (which only
-- seeded the English message — the Malay/Tamil fields were left
-- blank on purpose at the time, and the site was silently falling
-- back to English on those two language tabs ever since).
--
-- Only NEEDED if you already ran add-site-ticker.sql before this
-- fix. If you're setting the ticker up for the first time, just
-- run the updated add-site-ticker.sql instead — it now seeds all
-- three languages directly and you can skip this file entirely.
--
-- Safe to re-run, and safe either way: only fills message_bm /
-- message_ta when they're still blank, so it will NEVER overwrite
-- wording you've already typed into the Ticker tab in /cms.html.
--
-- Run this once in Supabase (Dashboard -> SQL Editor -> New query ->
-- paste this whole file -> Run).
-- ============================================================

update site_ticker
set message_bm = '⚠️ LAMAN WEB DALAM PEMBINAAN: Maklumat yang dipaparkan adalah untuk tujuan ujian/rujukan sahaja dan belum disemak atau diluluskan oleh Jawatankuasa Pengurusan Kuil. Sila jangan anggap ia sebagai rasmi atau muktamad.'
where id = 1 and coalesce(message_bm, '') = '';

update site_ticker
set message_ta = '⚠️ இணையதளம் கட்டுமானத்தில் உள்ளது: இங்கு காட்டப்படும் தகவல்கள் சோதனை/குறிப்புக்காக மட்டுமே, மேலும் இது இன்னும் கோயில் நிர்வாகக் குழுவால் சரிபார்க்கப்படவோ அங்கீகரிக்கப்படவோ இல்லை. தயவுசெய்து இதை உத்தியோகபூர்வமானதாகவோ இறுதியானதாகவோ கருத வேண்டாம்.'
where id = 1 and coalesce(message_ta, '') = '';
