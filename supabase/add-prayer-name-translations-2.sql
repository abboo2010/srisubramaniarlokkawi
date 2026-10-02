-- Part 2: translates the monthly Pournami / Bairavar poojas and 3 annual/special variants.
-- Only fills rows whose translation is still blank. Safe to re-run.

update prayers p set
  name_bm = case x.kind when 'Pournami' then 'Pooja Pournami Bulanan' else 'Pooja Bairavar Bulanan' end
    || ' (' || (array['Januari','Februari','Mac','April','Mei','Jun','Julai','Ogos','September','Oktober','November','Disember'])[x.m] || ' ' || x.y || ')',
  name_ta = case x.kind when 'Pournami' then 'மாதாந்திர பௌர்ணமி பூஜை' else 'மாதாந்திர பைரவர் பூஜை' end
    || ' (' || (array['ஜனவரி','பிப்ரவரி','மார்ச்','ஏப்ரல்','மே','ஜூன்','ஜூலை','ஆகஸ்ட்','செப்டம்பர்','அக்டோபர்','நவம்பர்','டிசம்பர்'])[x.m] || ' ' || x.y || ')',
  name_zh = case x.kind when 'Pournami' then '每月月圆供奉' else '每月拜拉瓦供奉' end
    || '（' || x.y || '年' || x.m || '月）'
from (
  select id,
         substring(name from '^Monthly (Pournami|Bairavar) Pooja') as kind,
         (strpos('JanFebMarAprMayJunJulAugSepOctNovDec', substring(name from '\(([A-Za-z]{3})')) + 2) / 3 as m,
         substring(name from '(\d{4})\)') as y
  from prayers
  where name ~ '^Monthly (Pournami|Bairavar) Pooja \([A-Za-z]+ \d{4}\)$'
) x
where p.id = x.id and p.name_bm = '' and p.name_ta = '' and p.name_zh = '';

update prayers set name_bm = $z$Aadi Krithigai (Nagamma Pongal) - Thechatti$z$, name_ta = $z$ஆடிக் கிருத்திகை (நாகம்மா பொங்கல்) - Thechatti$z$, name_zh = $z$阿迪月昴星节（那加玛庞加尔）- Thechatti$z$ where name = $z$Aadi Krithigai (Nagamma Pongal) - Thechatti$z$ and name_zh = '';
update prayers set name_bm = $z$Krishna Jeyanthi (dengan Homam)$z$, name_ta = $z$கிருஷ்ண ஜெயந்தி (ஹோமத்துடன்)$z$, name_zh = $z$奎师那诞辰（含火供）$z$ where name = $z$Krishna Jeyanthi (with Homam)$z$ and name_zh = '';
update prayers set name_bm = $z$Doa Khas Hari Jumaat$z$, name_ta = $z$வெள்ளிக்கிழமை சிறப்பு பிரார்த்தனை$z$, name_zh = $z$星期五特别祈祷$z$ where name = $z$Friday Special Prayer$z$ and name_zh = '';
