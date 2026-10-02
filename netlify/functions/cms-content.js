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
  poojaTimings: null, sevas: null, announcements: null, gallery: null, contact: null, ticker: null,
  committee: null, pageHeadings: null, menuLabels: null, popup: null, waWidget: null
};

exports.handler = async () => {
  const supabase = supabaseClient();
  if (!supabase) {
    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify(NOT_CONFIGURED) };
  }

  try {
    const [hero, tiles, about, deities, timings, sevas, announcements, galleryCategories, galleryFolders, galleryPhotos, contact, ticker, committee, pageHeadings, menuLabels, popup, waWidget] = await Promise.all([
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
      supabase.from("contact_info").select("*").eq("id", 1).maybeSingle(),
      supabase.from("site_ticker").select("*").eq("id", 1).maybeSingle(),
      supabase.from("committee_members").select("*").order("sort_order", { ascending: true }),
      supabase.from("page_headings").select("*"),
      supabase.from("menu_labels").select("*"),
      supabase.from("site_popup").select("*").eq("id", 1).maybeSingle(),
      supabase.from("whatsapp_widget").select("*").eq("id", 1).maybeSingle()
    ]);

    for (const r of [hero, tiles, about, deities, timings, sevas, announcements, galleryCategories, galleryFolders, galleryPhotos, contact]) {
      if (r.error) throw r.error;
    }
    // ticker is handled leniently on purpose: site_ticker is a newer table
    // that may not exist yet if add-site-ticker.sql hasn't been run —
    // that must never take down the rest of the site's live content, so
    // its error (if any) is swallowed and the front-end just keeps its
    // bundled default ticker text instead.
    const tk = (!ticker.error && ticker.data) ? ticker.data : null;
    const tickerOut = tk ? {
      enabled: tk.enabled, message_en: tk.message_en, message_bm: tk.message_bm, message_ta: tk.message_ta, message_zh: tk.message_zh
    } : null;

    // site_popup is a newer table too — handled leniently for the same
    // reason as site_ticker: must never take down the rest of the site's
    // live content if add-site-popup.sql hasn't been run yet.
    const pu = (!popup.error && popup.data) ? popup.data : null;
    const popupOut = pu ? {
      enabled: pu.enabled,
      title_en: pu.title_en, title_bm: pu.title_bm, title_ta: pu.title_ta, title_zh: pu.title_zh,
      message_en: pu.message_en, message_bm: pu.message_bm, message_ta: pu.message_ta, message_zh: pu.message_zh,
      // image_url/link_target/link_label_* were added to site_popup by
      // add-site-popup-image-link.sql — if that migration hasn't been
      // run yet, these columns simply aren't on the row and come back
      // undefined here, which script.js already treats as "not set".
      image_url: pu.image_url, link_target: pu.link_target,
      link_label_en: pu.link_label_en, link_label_bm: pu.link_label_bm, link_label_ta: pu.link_label_ta, link_label_zh: pu.link_label_zh
    } : null;

    // whatsapp_widget is a newer table too — handled leniently for the
    // same reason as site_ticker/site_popup: must never take down the
    // rest of the site's live content if add-whatsapp-widget.sql hasn't
    // been run yet.
    const ww = (!waWidget.error && waWidget.data) ? waWidget.data : null;
    const waWidgetOut = ww ? {
      enabled: ww.enabled, image_url: ww.image_url,
      heading_en: ww.heading_en, heading_bm: ww.heading_bm, heading_ta: ww.heading_ta, heading_zh: ww.heading_zh,
      description_en: ww.description_en, description_bm: ww.description_bm, description_ta: ww.description_ta, description_zh: ww.description_zh,
      phone_number: ww.phone_number,
      message_en: ww.message_en, message_bm: ww.message_bm, message_ta: ww.message_ta, message_zh: ww.message_zh,
      button_label_en: ww.button_label_en, button_label_bm: ww.button_label_bm, button_label_ta: ww.button_label_ta, button_label_zh: ww.button_label_zh
    } : null;

    // committee_members is a newer table too (added alongside the Temple
    // Committee screen) — handled leniently for the same reason as
    // site_ticker: must never take down the rest of the site's content
    // if add-committee.sql hasn't been run yet.
    const committeeOut = !committee.error ? { president: [], vicePresident: [], officer: [], member: [], auditor: [], trustee: [] } : null;
    if (committeeOut) {
      (committee.data || []).forEach(m => {
        const row = {
          name_en: m.name_en, name_bm: m.name_en, name_ta: m.name_ta,
          role_en: m.role_en, role_bm: m.role_bm, role_ta: m.role_ta, role_zh: m.role_zh,
          subtitle_en: m.subtitle_en, subtitle_bm: m.subtitle_bm, subtitle_ta: m.subtitle_ta, subtitle_zh: m.subtitle_zh,
          phone: m.phone
        };
        if (committeeOut[m.tier]) committeeOut[m.tier].push(row);
      });
    }

    const h = hero.data;
    const heroBanner = h ? {
      eyebrow: { en: h.eyebrow_en, bm: h.eyebrow_bm, ta: h.eyebrow_ta, zh: h.eyebrow_zh },
      titleLine1: { en: h.title_line1_en, bm: h.title_line1_bm, ta: h.title_line1_ta, zh: h.title_line1_zh },
      titleLine2: { en: h.title_line2_en, bm: h.title_line2_bm, ta: h.title_line2_ta, zh: h.title_line2_zh },
      establishedValue: h.established_value,
      establishedLabel: { en: h.established_label_en, bm: h.established_label_bm, ta: h.established_label_ta, zh: h.established_label_zh },
      devoteesValue: h.devotees_value,
      devoteesLabel: { en: h.devotees_label_en, bm: h.devotees_label_bm, ta: h.devotees_label_ta, zh: h.devotees_label_zh },
      annualEventsValue: h.annual_events_value,
      annualEventsLabel: { en: h.annual_events_label_en, bm: h.annual_events_label_bm, ta: h.annual_events_label_ta, zh: h.annual_events_label_zh },
      upcomingEventsLabel: { en: h.upcoming_events_label_en, bm: h.upcoming_events_label_bm, ta: h.upcoming_events_label_ta, zh: h.upcoming_events_label_zh },
      upcomingEventsLink: h.upcoming_events_link,
      poojaTimingsLabel: { en: h.pooja_timings_label_en, bm: h.pooja_timings_label_bm, ta: h.pooja_timings_label_ta, zh: h.pooja_timings_label_zh },
      poojaTimingsLink: h.pooja_timings_link,
      imageUrl: h.image_url
    } : null;

    const navTiles = (tiles.data || []).map(t => ({
      key: t.tile_key, icon: t.icon,
      title: { en: t.title_en, bm: t.title_bm, ta: t.title_ta, zh: t.title_zh },
      desc: { en: t.desc_en, bm: t.desc_bm, ta: t.desc_ta, zh: t.desc_zh },
      destination: t.destination
    }));

    const a = about.data;
    const splitParas = (s) => (s || "").split(/\n\s*\n/).map(x => x.trim()).filter(Boolean);
    const splitLines = (s) => (s || "").split("\n").map(x => x.trim()).filter(Boolean);
    const aboutOut = a ? {
      vision_en: a.vision_en, vision_bm: a.vision_bm, vision_ta: a.vision_ta, vision_zh: a.vision_zh, vision_zh: a.vision_zh,
      mission_en: a.mission_en, mission_bm: a.mission_bm, mission_ta: a.mission_ta, mission_zh: a.mission_zh, mission_zh: a.mission_zh,
      history_en: splitParas(a.history_en).map(p => ({ paragraph: p })),
      history_bm: splitParas(a.history_bm).map(p => ({ paragraph: p })),
      history_ta: splitParas(a.history_ta).map(p => ({ paragraph: p })),
      history_zh: splitParas(a.history_zh).map(p => ({ paragraph: p })),
      activities_en: splitLines(a.activities_en).map(x => ({ activity: x })),
      activities_bm: splitLines(a.activities_bm).map(x => ({ activity: x })),
      activities_ta: splitLines(a.activities_ta).map(x => ({ activity: x })),
      activities_zh: splitLines(a.activities_zh).map(x => ({ activity: x }))
    } : null;

    const deitiesOut = (deities.data || []).map(d => ({
      name_en: d.name_en, name_bm: d.name_bm, name_ta: d.name_ta, name_zh: d.name_zh,
      role_en: d.role_en, role_bm: d.role_bm, role_ta: d.role_ta, role_zh: d.role_zh,
      description_en: d.description_en, description_bm: d.description_bm, description_ta: d.description_ta, description_zh: d.description_zh,
      image: d.image_url, color: d.color
    }));

    const byList = { today: [], daily: [], friday: [], fullMoon: [] };
    const poojaName = {};
    (timings.data || []).forEach(r => {
      const row = { name_en: r.name_en, name: r.name_en, time: r.time_label };
      if (byList[r.list_type]) byList[r.list_type].push(row);
      if (!poojaName[r.name_en]) poojaName[r.name_en] = { bm: r.name_bm, ta: r.name_ta, zh: r.name_zh };
    });
    const poojaTimings = { today: byList.today, weekly: { daily: byList.daily, friday: byList.friday, fullMoon: byList.fullMoon }, poojaNames: poojaName };

    const sevasOut = (sevas.data || []).map(s => ({
      name_en: s.name_en, name_bm: s.name_bm, name_ta: s.name_ta, name_zh: s.name_zh,
      price_en: s.price_en, price_bm: s.price_bm, price_ta: s.price_ta, price_zh: s.price_zh,
      desc_en: s.desc_en, desc_bm: s.desc_bm, desc_ta: s.desc_ta, desc_zh: s.desc_zh,
      cta_en: s.cta_en, cta_bm: s.cta_bm, cta_ta: s.cta_ta, cta_zh: s.cta_zh
    }));

    const announcementsOut = (announcements.data || []).map(x => ({
      title_en: x.title_en, title_bm: x.title_bm, title_ta: x.title_ta, title_zh: x.title_zh,
      desc_en: x.desc_en, desc_bm: x.desc_bm, desc_ta: x.desc_ta, desc_zh: x.desc_zh
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
        label_en: p.label_en, label_bm: p.label_bm, label_ta: p.label_ta, label_zh: p.label_zh
      });
    });
    const foldersByCategory = {};
    (galleryFolders.data || []).forEach(f => {
      (foldersByCategory[f.category_id] = foldersByCategory[f.category_id] || []).push({
        id: f.id, name_en: f.name_en, name_bm: f.name_bm, name_ta: f.name_ta, name_zh: f.name_zh,
        cover: f.cover_url || "",
        photos: photosByFolder[f.id] || []
      });
    });
    const galleryOut = (galleryCategories.data || []).map(c => ({
      id: c.id, name_en: c.name_en, name_bm: c.name_bm, name_ta: c.name_ta, name_zh: c.name_zh,
      cover: c.cover_url || "",
      folders: foldersByCategory[c.id] || []
    }));

    // page_headings is a newer table too — handled leniently for the
    // same reason as site_ticker/committee_members: must never take
    // down the rest of the site's content if add-page-headings.sql
    // hasn't been run yet. Returned as a flat array; script.js matches
    // each row to its screen by screen_key.
    const pageHeadingsOut = !pageHeadings.error
      ? (pageHeadings.data || []).map(r => ({
          screen_key: r.screen_key,
          heading_en: r.heading_en, heading_bm: r.heading_bm, heading_ta: r.heading_ta, heading_zh: r.heading_zh,
          sub_en: r.sub_en, sub_bm: r.sub_bm, sub_ta: r.sub_ta, sub_zh: r.sub_zh
        }))
      : null;

    // menu_labels is a newer table too — handled leniently for the
    // same reason as page_headings just above.
    const menuLabelsOut = !menuLabels.error
      ? (menuLabels.data || []).map(r => ({
          screen_key: r.screen_key,
          label_en: r.label_en, label_bm: r.label_bm, label_ta: r.label_ta, label_zh: r.label_zh
        }))
      : null;

    const c = contact.data;
    const contactOut = c ? {
      orgName: c.org_name, registrationNo: c.registration_no, phone: c.phone, email: c.email,
      whatsappNumber: c.whatsapp_number,
      social: (c.social || "").split(",").map(s => s.trim()).filter(Boolean),
      address_en: c.address_en, address_bm: c.address_bm, address_ta: c.address_ta, address_zh: c.address_zh,
      enquiriesHeading: { en: c.enquiries_heading_en, bm: c.enquiries_heading_bm, ta: c.enquiries_heading_ta, zh: c.enquiries_heading_zh },
      whatsappCaption: { en: c.whatsapp_caption_en, bm: c.whatsapp_caption_bm, ta: c.whatsapp_caption_ta, zh: c.whatsapp_caption_zh },
      donationAccount: { accountName: c.donation_account_name, bank: c.donation_bank, accountNumber: c.donation_account_number }
    } : null;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      body: JSON.stringify({
        configured: true, heroBanner, navTiles, about: aboutOut, deities: deitiesOut,
        poojaTimings, sevas: sevasOut, announcements: announcementsOut, gallery: galleryOut, contact: contactOut,
        ticker: tickerOut, committee: committeeOut, pageHeadings: pageHeadingsOut, menuLabels: menuLabelsOut,
        popup: popupOut, waWidget: waWidgetOut
      })
    };
  } catch (err) {
    console.error("Fetching CMS content failed:", err);
    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify(NOT_CONFIGURED) };
  }
};
