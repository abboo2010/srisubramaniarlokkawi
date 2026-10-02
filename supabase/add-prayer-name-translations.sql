-- ============================================================
-- Adds Malay / Tamil / Chinese names to the Prayers & Events schedule
-- (the `prayers` table), so the calendar and the prayer cards can show
-- each festival in the visitor's language.
--
-- 1) Adds name_bm / name_ta / name_zh columns (blank = show English).
-- 2) Fills them for the annual festival names already on the schedule.
--    Only rows whose translation is still blank are touched, and only by
--    exact English-name match, so anything you edit later by hand in
--    admin-prayers.html is never overwritten. Monthly/special poojas
--    that don't match are simply left blank (they keep showing English
--    until you type a translation in the admin).
--
-- Run once in Supabase: Dashboard -> SQL Editor -> New query -> paste ->
-- Run. Safe to re-run.
-- ============================================================

alter table if exists prayers add column if not exists name_bm text not null default '';
alter table if exists prayers add column if not exists name_ta text not null default '';
alter table if exists prayers add column if not exists name_zh text not null default '';

update prayers set name_bm = coalesce(nullif(name_bm,''), $z$Chitra Pournami$z$), name_ta = coalesce(nullif(name_ta,''), $z$சித்ரா பௌர்ணமி$z$), name_zh = coalesce(nullif(name_zh,''), $z$奇特拉月圆日$z$) where name = $z$Chitra Pournami$z$;
update prayers set name_bm = coalesce(nullif(name_bm,''), $z$Kuttu Pirathanai MIC$z$), name_ta = coalesce(nullif(name_ta,''), $z$MIC கூட்டுப் பிரார்த்தனை$z$), name_zh = coalesce(nullif(name_zh,''), $z$国大党（MIC）集体祈祷$z$) where name = $z$MIC Kuttu Pirathanai$z$;
update prayers set name_bm = coalesce(nullif(name_bm,''), $z$Andu Vila (Ulang Tahun Kuil)$z$), name_ta = coalesce(nullif(name_ta,''), $z$ஆண்டு விழா (ஆலய ஆண்டு விழா)$z$), name_zh = coalesce(nullif(name_zh,''), $z$周年庆典（庙宇周年）$z$) where name = $z$Andu Vila (Temple Anniversary)$z$;
update prayers set name_bm = coalesce(nullif(name_bm,''), $z$Vaikasi Visagam$z$), name_ta = coalesce(nullif(name_ta,''), $z$வைகாசி விசாகம்$z$), name_zh = coalesce(nullif(name_zh,''), $z$维卡西维萨甘节$z$) where name = $z$Vaikasi Visagam$z$;
update prayers set name_bm = coalesce(nullif(name_bm,''), $z$Guru Peyarchi$z$), name_ta = coalesce(nullif(name_ta,''), $z$குருப் பெயர்ச்சி$z$), name_zh = coalesce(nullif(name_zh,''), $z$古鲁移宫（木星转宫）$z$) where name = $z$Guru Peyarchi$z$;
update prayers set name_bm = coalesce(nullif(name_bm,''), $z$Aadi Velli Pertama$z$), name_ta = coalesce(nullif(name_ta,''), $z$முதல் ஆடி வெள்ளி$z$), name_zh = coalesce(nullif(name_zh,''), $z$阿迪月第一个星期五$z$) where name = $z$First Aadi Velli$z$;
update prayers set name_bm = coalesce(nullif(name_bm,''), $z$Aadi Velli Kedua$z$), name_ta = coalesce(nullif(name_ta,''), $z$இரண்டாம் ஆடி வெள்ளி$z$), name_zh = coalesce(nullif(name_zh,''), $z$阿迪月第二个星期五$z$) where name = $z$Second Aadi Velli$z$;
update prayers set name_bm = coalesce(nullif(name_bm,''), $z$Aadi Velli Ketiga$z$), name_ta = coalesce(nullif(name_ta,''), $z$மூன்றாம் ஆடி வெள்ளி$z$), name_zh = coalesce(nullif(name_zh,''), $z$阿迪月第三个星期五$z$) where name = $z$Third Aadi Velli$z$;
update prayers set name_bm = coalesce(nullif(name_bm,''), $z$Aadi Perukku$z$), name_ta = coalesce(nullif(name_ta,''), $z$ஆடிப் பெருக்கு$z$), name_zh = coalesce(nullif(name_zh,''), $z$阿迪月丰盈节$z$) where name = $z$Aadi Perukku$z$;
update prayers set name_bm = coalesce(nullif(name_bm,''), $z$Aadi Krithigai (Nagamma Pongal)$z$), name_ta = coalesce(nullif(name_ta,''), $z$ஆடிக் கிருத்திகை (நாகம்மா பொங்கல்)$z$), name_zh = coalesce(nullif(name_zh,''), $z$阿迪月昴星节（那加玛庞加尔）$z$) where name = $z$Aadi Krithigai (Nagamma Pongal)$z$;
update prayers set name_bm = coalesce(nullif(name_bm,''), $z$Aadi Pooram$z$), name_ta = coalesce(nullif(name_ta,''), $z$ஆடிப் பூரம்$z$), name_zh = coalesce(nullif(name_zh,''), $z$阿迪月普兰节$z$) where name = $z$Aadi Pooram$z$;
update prayers set name_bm = coalesce(nullif(name_bm,''), $z$Garudan Panchami$z$), name_ta = coalesce(nullif(name_ta,''), $z$கருடன் பஞ்சமி$z$), name_zh = coalesce(nullif(name_zh,''), $z$迦楼罗五日节$z$) where name = $z$Garudan Panchami$z$;
update prayers set name_bm = coalesce(nullif(name_bm,''), $z$Varalakshmi Viratham / Pooja Kuttu Vilakku$z$), name_ta = coalesce(nullif(name_ta,''), $z$வரலட்சுமி விரதம் / கூட்டு விளக்கு பூஜை$z$), name_zh = coalesce(nullif(name_zh,''), $z$瓦拉克什米斋戒 / 集体点灯供奉$z$) where name = $z$Varalakshmi Viratham / Kuttu Vilakku Pooja$z$;
update prayers set name_bm = coalesce(nullif(name_bm,''), $z$Krishna Jeyanthi$z$), name_ta = coalesce(nullif(name_ta,''), $z$கிருஷ்ண ஜெயந்தி$z$), name_zh = coalesce(nullif(name_zh,''), $z$奎师那诞辰$z$) where name = $z$Krishna Jeyanthi$z$;
update prayers set name_bm = coalesce(nullif(name_bm,''), $z$Vinayagar Chathurthi$z$), name_ta = coalesce(nullif(name_ta,''), $z$விநாயகர் சதுர்த்தி$z$), name_zh = coalesce(nullif(name_zh,''), $z$象头神诞辰节$z$) where name = $z$Vinayagar Chathurthi$z$;
update prayers set name_bm = coalesce(nullif(name_bm,''), $z$Puratasi Pertama$z$), name_ta = coalesce(nullif(name_ta,''), $z$முதல் புரட்டாசி$z$), name_zh = coalesce(nullif(name_zh,''), $z$普拉塔西月第一次供奉$z$) where name = $z$1st Puratasi$z$;
update prayers set name_bm = coalesce(nullif(name_bm,''), $z$Puratasi Kedua / Pournami$z$), name_ta = coalesce(nullif(name_ta,''), $z$இரண்டாம் புரட்டாசி / பௌர்ணமி$z$), name_zh = coalesce(nullif(name_zh,''), $z$普拉塔西月第二次供奉 / 月圆日$z$) where name = $z$2nd Puratasi / Pournami$z$;
update prayers set name_bm = coalesce(nullif(name_bm,''), $z$Puratasi Ketiga$z$), name_ta = coalesce(nullif(name_ta,''), $z$மூன்றாம் புரட்டாசி$z$), name_zh = coalesce(nullif(name_zh,''), $z$普拉塔西月第三次供奉$z$) where name = $z$3rd Puratasi$z$;
update prayers set name_bm = coalesce(nullif(name_bm,''), $z$Puratasi Keempat$z$), name_ta = coalesce(nullif(name_ta,''), $z$நான்காம் புரட்டாசி$z$), name_zh = coalesce(nullif(name_zh,''), $z$普拉塔西月第四次供奉$z$) where name = $z$4th Puratasi$z$;
update prayers set name_bm = coalesce(nullif(name_bm,''), $z$Permulaan Navarathiri (Pooja Durga)$z$), name_ta = coalesce(nullif(name_ta,''), $z$நவராத்திரி தொடக்கம் (துர்கா பூஜை)$z$), name_zh = coalesce(nullif(name_zh,''), $z$九夜节开始（杜尔加供奉）$z$) where name = $z$Navarathiri Start (Durga Pooja)$z$;
update prayers set name_bm = coalesce(nullif(name_bm,''), $z$Pooja Durga$z$), name_ta = coalesce(nullif(name_ta,''), $z$துர்கா பூஜை$z$), name_zh = coalesce(nullif(name_zh,''), $z$杜尔加供奉$z$) where name = $z$Durga Pooja$z$;
update prayers set name_bm = coalesce(nullif(name_bm,''), $z$Pooja Lakshmi$z$), name_ta = coalesce(nullif(name_ta,''), $z$லட்சுமி பூஜை$z$), name_zh = coalesce(nullif(name_zh,''), $z$拉克什米供奉$z$) where name = $z$Lakshmi Pooja$z$;
update prayers set name_bm = coalesce(nullif(name_bm,''), $z$Puratasi Kelima$z$), name_ta = coalesce(nullif(name_ta,''), $z$ஐந்தாம் புரட்டாசி$z$), name_zh = coalesce(nullif(name_zh,''), $z$普拉塔西月第五次供奉$z$) where name = $z$5th Puratasi$z$;
update prayers set name_bm = coalesce(nullif(name_bm,''), $z$Pooja Saraswathi$z$), name_ta = coalesce(nullif(name_ta,''), $z$சரஸ்வதி பூஜை$z$), name_zh = coalesce(nullif(name_zh,''), $z$萨拉斯瓦蒂供奉$z$) where name = $z$Saraswathi Pooja$z$;
update prayers set name_bm = coalesce(nullif(name_bm,''), $z$Pooja Saraswathi (Pooja Ayudha)$z$), name_ta = coalesce(nullif(name_ta,''), $z$சரஸ்வதி பூஜை (ஆயுத பூஜை)$z$), name_zh = coalesce(nullif(name_zh,''), $z$萨拉斯瓦蒂供奉（工具供奉节）$z$) where name = $z$Saraswathi Pooja (Ayudha Pooja)$z$;
update prayers set name_bm = coalesce(nullif(name_bm,''), $z$Vijaya Dasami$z$), name_ta = coalesce(nullif(name_ta,''), $z$விஜயதசமி$z$), name_zh = coalesce(nullif(name_zh,''), $z$胜利十日节$z$) where name = $z$Vijaya Dasami$z$;
update prayers set name_bm = coalesce(nullif(name_bm,''), $z$Deepavali$z$), name_ta = coalesce(nullif(name_ta,''), $z$தீபாவளி$z$), name_zh = coalesce(nullif(name_zh,''), $z$屠妖节（排灯节）$z$) where name = $z$Deepavali$z$;
update prayers set name_bm = coalesce(nullif(name_bm,''), $z$Permulaan Puasa Kanda Shasti$z$), name_ta = coalesce(nullif(name_ta,''), $z$கந்த சஷ்டி விரதம் தொடக்கம்$z$), name_zh = coalesce(nullif(name_zh,''), $z$坎达沙斯蒂斋戒开始$z$) where name = $z$Start of Kanda Shasti Fast$z$;
update prayers set name_bm = coalesce(nullif(name_bm,''), $z$Puasa Kanda Shasti$z$), name_ta = coalesce(nullif(name_ta,''), $z$கந்த சஷ்டி விரதம்$z$), name_zh = coalesce(nullif(name_zh,''), $z$坎达沙斯蒂斋戒$z$) where name = $z$Kanda Shasti Fast$z$;
update prayers set name_bm = coalesce(nullif(name_bm,''), $z$Soora Samharam (Tamat Puasa Kanda Shasti)$z$), name_ta = coalesce(nullif(name_ta,''), $z$சூரசம்ஹாரம் (கந்த சஷ்டி விரத நிறைவு)$z$), name_zh = coalesce(nullif(name_zh,''), $z$苏拉桑哈拉姆（斩妖仪式，坎达沙斯蒂斋戒结束）$z$) where name = $z$Soora Samharam (End of Kanda Shasti Fast)$z$;
update prayers set name_bm = coalesce(nullif(name_bm,''), $z$Berbuka Puasa Kandha Sasthi — Thirukalyanam Murugan / Vallitheivanai$z$), name_ta = coalesce(nullif(name_ta,''), $z$கந்த சஷ்டி விரத நிறைவு — முருகன் / வள்ளி தெய்வானை திருக்கல்யாணம்$z$), name_zh = coalesce(nullif(name_zh,''), $z$坎达沙斯蒂斋戒结束 — 穆鲁干与瓦丽、黛瓦娜神圣婚礼$z$) where name = $z$Kandha Sasthi Fast Breaking — Murugan / Vallitheivanai Thirukalyanam$z$;
update prayers set name_bm = coalesce(nullif(name_bm,''), $z$Pournami / Karthigai Deepam$z$), name_ta = coalesce(nullif(name_ta,''), $z$பௌர்ணமி / கார்த்திகை தீபம்$z$), name_zh = coalesce(nullif(name_zh,''), $z$月圆日 / 卡尔提盖灯节$z$) where name = $z$Pournami / Karthigai Deepam$z$;
update prayers set name_bm = coalesce(nullif(name_bm,''), $z$Kala Bhairava Ashtami (Pooja Berkumpulan)$z$), name_ta = coalesce(nullif(name_ta,''), $z$கால பைரவ அஷ்டமி (கூட்டு பூஜை)$z$), name_zh = coalesce(nullif(name_zh,''), $z$卡拉拜拉瓦八日节（集体供奉）$z$) where name = $z$Kala Bhairava Ashtami (Group Pooja)$z$;
update prayers set name_bm = coalesce(nullif(name_bm,''), $z$Hanuman Jayanthi$z$), name_ta = coalesce(nullif(name_ta,''), $z$அனுமன் ஜெயந்தி$z$), name_zh = coalesce(nullif(name_zh,''), $z$哈奴曼诞辰$z$) where name = $z$Hanuman Jayanthi$z$;
update prayers set name_bm = coalesce(nullif(name_bm,''), $z$Vaikunda Ekadesi$z$), name_ta = coalesce(nullif(name_ta,''), $z$வைகுண்ட ஏகாதசி$z$), name_zh = coalesce(nullif(name_zh,''), $z$韦昆达埃卡达希$z$) where name = $z$Vaikunda Ekadesi$z$;
update prayers set name_bm = coalesce(nullif(name_bm,''), $z$Abisegam Thiruvathirai / Pournami$z$), name_ta = coalesce(nullif(name_ta,''), $z$திருவாதிரை அபிஷேகம் / பௌர்ணமி$z$), name_zh = coalesce(nullif(name_zh,''), $z$提鲁瓦提莱圣浴 / 月圆日$z$) where name = $z$Thiruvathirai Abisegam / Pournami$z$;
update prayers set name_bm = coalesce(nullif(name_bm,''), $z$Darshanam Thiruvathirai$z$), name_ta = coalesce(nullif(name_ta,''), $z$திருவாதிரை தரிசனம்$z$), name_zh = coalesce(nullif(name_zh,''), $z$提鲁瓦提莱朝拜$z$) where name = $z$Thiruvathirai Darshanam$z$;
