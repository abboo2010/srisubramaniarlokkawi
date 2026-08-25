// ============================================================
// cms-content.js — Netlify Function (public, read-only)
//
// Returns ALL site content the new /cms.html dashboard manages —
// Hero Banner, Home Tiles, About, Deities, Pooja Timings, Sevas,
// Announcements, Gallery, and Contact Us — from Supabase in one
// request. This replaces the old client-side Google Sheets fetch
// (loadLiveContent() in script.js used to hit 10 separate sheet
// tabs); the bundled content-data.js is kept only as an offline
// fallback in case Supabase is unreachable or not configured yet,
// same pattern as prayers-list.js.
//
// Deliberately excludes Members — that stays behind
// check-membership.js (single-record lookup only, never the full
// list) and cms-members.js (password-gated, for the CMS).
// ============================================================
const { supabaseClient } = require("./_supabase");

const NOT_CONFIGURED = {
  configured: false, heroBanner: null, navTiles: null, about: null, deities: null,
  poojaTimings: null, sevas: null, announcements: null, gallery: null, contact: null
};

exports.handler = async () => {
  const supabase = supabaseClient();
  if (!supabase) {
    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify(NOT_CONFIGURED) };
  }

  try {
    const [hero, tiles, about, deities, timings, sevas, announcements, galleryCategories, galleryFolders, galleryPhotos, contact] = await Promise.all([
      supabase.from("hero_banner").select("*").eq("id", 1).maybeSingle(),
      supabase.from("nav_tiles").select("*").eq("enabled", true).order("sort_order", { ascending: true }),
      supabase.from("about_page").select("*").eq("id", 1).maybeSingle(),
      supabase.from("deities").select("*").order("sort_order", { ascending: true }),
      supabase.from("pooja_timings").select("*").order("sort_order", { ascending: true }),
      supabase.from("sevas").select("*").order("sort_order", { ascending: true }),
      supabase.from("announcements").select("*").eq("published", true).order("sort_order", { ascending: true }),
      supabase.from("gallery_categories").select("*").order("sort_order", { ascending: true }),
      supabase.from("gallery_folders").select("*").order("sort_order", { ascending: true }),
      supabase.from("gallery").select("*").order("sort_order", { ascending: true }),
      supabase.from("contact_info").select("*").eq("id", 1).maybeSingle()
    ]);

    for (const r of [hero, tiles, about, deities, timings, sevas, announcements, galleryCategories, galleryFolders, galleryPhotos, contact]) {
      if (r.error) throw r.error;
    }

    const h = hero.data;
    const heroBanner = h ? {
      eyebrow: { en: h.eyebrow_en, bm: h.eyebrow_bm, ta: h.eyebrow_ta },
      titleLine1: { en: h.title_line1_en, bm: h.title_line1_bm, ta: h.title_line1_ta },
      titleLine2: { en: h.title_line2_en, bm: h.title_line2_bm, ta: h.title_line2_ta },
      establishedValue: h.established_value,
      establishedLabel: { en: h.established_label_en, bm: h.established_label_bm, ta: h.established_label_ta },
      devoteesValue: h.devotees_value,
      devoteesLabel: { en: h.devotees_label_en, bm: h.devotees_label_bm, ta: h.devotees_label_ta },
      annualEventsValue: h.annual_events_value,
      annualEventsLabel: { en: h.annual_events_label_en, bm: h.annual_events_label_bm, ta: h.annual_events_label_ta },
      upcomingEventsLabel: { en: h.upcoming_events_label_en, bm: h.upcoming_events_label_bm, ta: h.upcoming_events_label_ta },
      upcomingEventsLink: h.upcoming_events_link,
      poojaTimingsLabel: { en: h.pooja_timings_label_en, bm: h.pooja_timings_label_bm, ta: h.pooja_timings_label_ta },
      poojaTimingsLink: h.pooja_timings_link,
      imageUrl: h.image_url
    } : null;

    const navTiles = (tiles.data || []).map(t => ({
      key: t.tile_key, icon: t.icon,
      title: { en: t.title_en, bm: t.title_bm, ta: t.title_ta },
      desc: { en: t.desc_en, bm: t.desc_bm, ta: t.desc_ta },
      destination: t.destination
    }));

    const a = about.data;
    const splitParas = (s) => (s || "").split(/\n\s*\n/).map(x => x.trim()).filter(Boolean);
    const splitLines = (s) => (s || "").split("\n").map(x => x.trim()).filter(Boolean);
    const aboutOut = a ? {
      vision_en: a.vision_en, vision_bm: a.vision_bm, vision_ta: a.vision_ta,
      mission_en: a.mission_en, mission_bm: a.mission_bm, mission_ta: a.mission_ta,
      history_en: splitParas(a.history_en).map(p => ({ paragraph: p })),
      history_bm: splitParas(a.history_bm).map(p => ({ paragraph: p })),
      history_ta: splitParas(a.history_ta).map(p => ({ paragraph: p })),
      activities_en: splitLines(a.activities_en).map(x => ({ activity: x })),
      activities_bm: splitLines(a.activities_bm).map(x => ({ activity: x })),
      activities_ta: splitLines(a.activities_ta).map(x => ({ activity: x }))
    } : null;

    const deitiesOut = (deities.data || []).map(d => ({
      name_en: d.name_en, name_bm: d.name_bm, name_ta: d.name_ta,
      role_en: d.role_en, role_bm: d.role_bm, role_ta: d.role_ta,
      description_en: d.description_en, description_bm: d.description_bm, description_ta: d.description_ta,
      image: d.image_url, color: d.color
    }));

    const byList = { today: [], daily: [], friday: [], fullMoon: [] };
    const poojaName = {};
    (timings.data || []).forEach(r => {
      const row = { name_en: r.name_en, name: r.name_en, time: r.time_label };
      if (byList[r.list_type]) byList[r.list_type].push(row);
      if (!poojaName[r.name_en]) poojaName[r.name_en] = { bm: r.name_bm, ta: r.name_ta };
    });
    const poojaTimings = { today: byList.today, weekly: { daily: byList.daily, friday: byList.friday, fullMoon: byList.fullMoon }, poojaNames: poojaName };

    const sevasOut = (sevas.data || []).map(s => ({
      name_en: s.name_en, name_bm: s.name_bm, name_ta: s.name_ta,
      price_en: s.price_en, price_bm: s.price_bm, price_ta: s.price_ta,
      desc_en: s.desc_en, desc_bm: s.desc_bm, desc_ta: s.desc_ta,
      cta_en: s.cta_en, cta_bm: s.cta_bm, cta_ta: s.cta_ta
    }));

    const announcementsOut = (announcements.data || []).map(x => ({
      title_en: x.title_en, title_bm: x.title_bm, title_ta: x.title_ta,
      desc_en: x.desc_en, desc_bm: x.desc_bm, desc_ta: x.desc_ta
    }));

    // Gallery is Category > Folder > Photo. Assembled here (rather than
    // three separate fetches on the client) so the public site gets one
    // ready-to-render tree; cms.html's admin listing still reads the
    // three tables flat via cms-crud.js for editing.
    const photosByFolder = {};
    (galleryPhotos.data || []).forEach(p => {
      if (!p.folder_id) return; // orphaned/legacy row with no folder yet — not shown publicly
      (photosByFolder[p.folder_id] = photosByFolder[p.folder_id] || []).push({
        image: p.image_url, thumbnail: p.thumbnail_url || p.image_url,
        label_en: p.label_en, label_bm: p.label_bm, label_ta: p.label_ta
      });
    });
    const foldersByCategory = {};
    (galleryFolders.data || []).forEach(f => {
      (foldersByCategory[f.category_id] = foldersByCategory[f.category_id] || []).push({
        id: f.id, name_en: f.name_en, name_bm: f.name_bm, name_ta: f.name_ta,
        photos: photosByFolder[f.id] || []
      });
    });
    const galleryOut = (galleryCategories.data || []).map(c => ({
      id: c.id, name_en: c.name_en, name_bm: c.name_bm, name_ta: c.name_ta,
      folders: foldersByCategory[c.id] || []
    }));

    const c = contact.data;
    const contactOut = c ? {
      orgName: c.org_name, registrationNo: c.registration_no, phone: c.phone, email: c.email,
      whatsappNumber: c.whatsapp_number,
      social: (c.social || "").split(",").map(s => s.trim()).filter(Boolean),
      address_en: c.address_en, address_bm: c.address_bm, address_ta: c.address_ta,
      enquiriesHeading: { en: c.enquiries_heading_en, bm: c.enquiries_heading_bm, ta: c.enquiries_heading_ta },
      whatsappCaption: { en: c.whatsapp_caption_en, bm: c.whatsapp_caption_bm, ta: c.whatsapp_caption_ta },
      donationAccount: { accountName: c.donation_account_name, bank: c.donation_bank, accountNumber: c.donation_account_number }
    } : null;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      body: JSON.stringify({
        configured: true, heroBanner, navTiles, about: aboutOut, deities: deitiesOut,
        poojaTimings, sevas: sevasOut, announcements: announcementsOut, gallery: galleryOut, contact: contactOut
      })
    };
  } catch (err) {
    console.error("Fetching CMS content failed:", err);
    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify(NOT_CONFIGURED) };
  }
};
