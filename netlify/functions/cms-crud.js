// ============================================================
// cms-crud.js — Netlify Function (password-gated)
//
// Generic create/update/delete for every /cms.html section EXCEPT
// Members (see cms-members.js) and image uploads (see
// cms-upload-image.js). One function instead of nine near-identical
// ones, following the same shape as admin-prayers-crud.js: request
// body is { entity, action, data }.
//
// "Singleton" entities (heroBanner / about / contact) always have
// row id=1 and only support action "update" (an upsert under the
// hood, so it also works on a freshly-created table with no row
// yet). "List" entities (navTile / deity / poojaTiming / seva /
// announcement / galleryItem) support create / update / delete like
// admin-prayers-crud.js's prayer/caterer entities.
//
// Required environment variables: same as admin-prayer-bookings.js
// (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_PASSWORD).
// ============================================================
const { supabaseClient } = require("./_supabase");

// entity -> { table, singleton, fields: [ [wireKey, columnName], ... ] }
// "fields" is the whitelist — anything not listed here is ignored,
// so the browser can never write to a column we didn't intend.
const ENTITIES = {
  heroBanner: {
    table: "hero_banner", singleton: true,
    fields: [
      ["eyebrowEn","eyebrow_en"],["eyebrowBm","eyebrow_bm"],["eyebrowTa","eyebrow_ta"],
      ["titleLine1En","title_line1_en"],["titleLine1Bm","title_line1_bm"],["titleLine1Ta","title_line1_ta"],
      ["titleLine2En","title_line2_en"],["titleLine2Bm","title_line2_bm"],["titleLine2Ta","title_line2_ta"],
      ["establishedValue","established_value"],
      ["establishedLabelEn","established_label_en"],["establishedLabelBm","established_label_bm"],["establishedLabelTa","established_label_ta"],
      ["devoteesValue","devotees_value"],
      ["devoteesLabelEn","devotees_label_en"],["devoteesLabelBm","devotees_label_bm"],["devoteesLabelTa","devotees_label_ta"],
      ["annualEventsValue","annual_events_value"],
      ["annualEventsLabelEn","annual_events_label_en"],["annualEventsLabelBm","annual_events_label_bm"],["annualEventsLabelTa","annual_events_label_ta"],
      ["upcomingEventsLabelEn","upcoming_events_label_en"],["upcomingEventsLabelBm","upcoming_events_label_bm"],["upcomingEventsLabelTa","upcoming_events_label_ta"],
      ["upcomingEventsLink","upcoming_events_link"],
      ["poojaTimingsLabelEn","pooja_timings_label_en"],["poojaTimingsLabelBm","pooja_timings_label_bm"],["poojaTimingsLabelTa","pooja_timings_label_ta"],
      ["poojaTimingsLink","pooja_timings_link"],
      ["imageUrl","image_url"]
    ]
  },
  about: {
    table: "about_page", singleton: true,
    fields: [
      ["visionEn","vision_en"],["visionBm","vision_bm"],["visionTa","vision_ta"],
      ["missionEn","mission_en"],["missionBm","mission_bm"],["missionTa","mission_ta"],
      ["historyEn","history_en"],["historyBm","history_bm"],["historyTa","history_ta"],
      ["activitiesEn","activities_en"],["activitiesBm","activities_bm"],["activitiesTa","activities_ta"]
    ]
  },
  contact: {
    table: "contact_info", singleton: true,
    fields: [
      ["orgName","org_name"],["registrationNo","registration_no"],["phone","phone"],["email","email"],
      ["whatsappNumber","whatsapp_number"],["social","social"],
      ["addressEn","address_en"],["addressBm","address_bm"],["addressTa","address_ta"],
      ["enquiriesHeadingEn","enquiries_heading_en"],["enquiriesHeadingBm","enquiries_heading_bm"],["enquiriesHeadingTa","enquiries_heading_ta"],
      ["whatsappCaptionEn","whatsapp_caption_en"],["whatsappCaptionBm","whatsapp_caption_bm"],["whatsappCaptionTa","whatsapp_caption_ta"],
      ["donationAccountName","donation_account_name"],["donationBank","donation_bank"],["donationAccountNumber","donation_account_number"]
    ]
  },
  navTile: {
    table: "nav_tiles", singleton: false,
    fields: [
      ["tileKey","tile_key"],["icon","icon"],
      ["titleEn","title_en"],["titleBm","title_bm"],["titleTa","title_ta"],
      ["descEn","desc_en"],["descBm","desc_bm"],["descTa","desc_ta"],
      ["destination","destination"],["enabled","enabled"],["sortOrder","sort_order"]
    ],
    boolFields: ["enabled"], numFields: ["sortOrder"]
  },
  deity: {
    table: "deities", singleton: false,
    fields: [
      ["nameEn","name_en"],["nameBm","name_bm"],["nameTa","name_ta"],
      ["roleEn","role_en"],["roleBm","role_bm"],["roleTa","role_ta"],
      ["descriptionEn","description_en"],["descriptionBm","description_bm"],["descriptionTa","description_ta"],
      ["imageUrl","image_url"],["color","color"],["sortOrder","sort_order"]
    ],
    numFields: ["sortOrder"]
  },
  poojaTiming: {
    table: "pooja_timings", singleton: false,
    fields: [
      ["listType","list_type"],["nameEn","name_en"],["nameBm","name_bm"],["nameTa","name_ta"],
      ["timeLabel","time_label"],["sortOrder","sort_order"]
    ],
    numFields: ["sortOrder"]
  },
  seva: {
    table: "sevas", singleton: false,
    fields: [
      ["nameEn","name_en"],["nameBm","name_bm"],["nameTa","name_ta"],
      ["priceEn","price_en"],["priceBm","price_bm"],["priceTa","price_ta"],
      ["descEn","desc_en"],["descBm","desc_bm"],["descTa","desc_ta"],
      ["ctaEn","cta_en"],["ctaBm","cta_bm"],["ctaTa","cta_ta"],
      ["sortOrder","sort_order"]
    ],
    numFields: ["sortOrder"]
  },
  announcement: {
    table: "announcements", singleton: false,
    fields: [
      ["titleEn","title_en"],["titleBm","title_bm"],["titleTa","title_ta"],
      ["descEn","desc_en"],["descBm","desc_bm"],["descTa","desc_ta"],
      ["published","published"],["sortOrder","sort_order"]
    ],
    boolFields: ["published"], numFields: ["sortOrder"]
  },
  galleryCategory: {
    table: "gallery_categories", singleton: false,
    fields: [
      ["nameEn","name_en"],["nameBm","name_bm"],["nameTa","name_ta"],
      ["coverUrl","cover_url"],
      ["sortOrder","sort_order"]
    ],
    numFields: ["sortOrder"]
  },
  galleryFolder: {
    table: "gallery_folders", singleton: false,
    fields: [
      ["categoryId","category_id"],
      ["nameEn","name_en"],["nameBm","name_bm"],["nameTa","name_ta"],
      ["coverUrl","cover_url"],
      ["sortOrder","sort_order"]
    ],
    numFields: ["sortOrder","categoryId"]
  },
  galleryItem: {
    table: "gallery", singleton: false,
    fields: [
      ["folderId","folder_id"],
      ["imageUrl","image_url"],["thumbnailUrl","thumbnail_url"],
      ["labelEn","label_en"],["labelBm","label_bm"],["labelTa","label_ta"],
      ["sortOrder","sort_order"]
    ],
    numFields: ["sortOrder","folderId"]
  }
};

function rowFromInput(config, data) {
  const row = {};
  config.fields.forEach(([wireKey, col]) => {
    if (data[wireKey] === undefined) return;
    let v = data[wireKey];
    if (config.boolFields && config.boolFields.includes(wireKey)) v = !!v;
    else if (config.numFields && config.numFields.includes(wireKey)) v = v === "" || v === null ? 0 : Number(v);
    else if (typeof v === "string") v = v; // keep as-is, including empty string
    row[col] = v;
  });
  return row;
}

// The reverse of rowFromInput — used by the GET (admin listing) branch
// below so cms.html always works in the same camelCase field names
// whether it's reading a row into a form or saving one back.
function wireFromRow(config, dbRow) {
  const out = { id: dbRow.id };
  config.fields.forEach(([wireKey, col]) => { out[wireKey] = dbRow[col]; });
  return out;
}

exports.handler = async (event) => {
  const suppliedPassword = event.headers["x-admin-password"] || event.headers["X-Admin-Password"] || "";
  if (!process.env.ADMIN_PASSWORD || suppliedPassword !== process.env.ADMIN_PASSWORD) {
    return { statusCode: 401, body: JSON.stringify({ error: "Incorrect password." }) };
  }

  // ---------- GET: raw admin listing for one entity, used to populate
  // cms.html's tables/forms (includes disabled tiles, unpublished
  // announcements, etc. — unlike the public cms-content.js). ----------
  if (event.httpMethod === "GET") {
    const entityName = (event.queryStringParameters && event.queryStringParameters.entity || "").trim();
    const config = ENTITIES[entityName];
    if (!config) return { statusCode: 400, body: JSON.stringify({ error: "Invalid entity." }) };

    const supabase = supabaseClient();
    if (!supabase) return { statusCode: 500, body: JSON.stringify({ error: "Database is not configured yet." }) };

    try {
      if (config.singleton) {
        const { data, error } = await supabase.from(config.table).select("*").eq("id", 1).maybeSingle();
        if (error) throw error;
        return { statusCode: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }, body: JSON.stringify({ row: data ? wireFromRow(config, data) : null }) };
      }
      const { data, error } = await supabase.from(config.table).select("*").order("sort_order", { ascending: true });
      if (error) throw error;
      return { statusCode: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }, body: JSON.stringify({ rows: (data || []).map(r => wireFromRow(config, r)) }) };
    } catch (err) {
      console.error(`CMS admin listing failed (${entityName}):`, err);
      return { statusCode: 500, body: JSON.stringify({ error: "Could not load." }) };
    }
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed." }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body." }) };
  }

  const entityName = (body.entity || "").trim();
  const action = (body.action || "").trim();
  const data = body.data || {};
  const config = ENTITIES[entityName];

  if (!config || !["create", "update", "delete"].includes(action)) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid entity/action." }) };
  }
  if (config.singleton && action !== "update") {
    return { statusCode: 400, body: JSON.stringify({ error: "This section only supports update." }) };
  }

  const supabase = supabaseClient();
  if (!supabase) {
    return { statusCode: 500, body: JSON.stringify({ error: "Database is not configured yet." }) };
  }

  try {
    if (config.singleton) {
      const row = rowFromInput(config, data);
      row.id = 1;
      const { error } = await supabase.from(config.table).upsert(row, { onConflict: "id" });
      if (error) throw error;
    } else if (action === "delete") {
      if (!data.id) return { statusCode: 400, body: JSON.stringify({ error: "Missing id." }) };
      const { error } = await supabase.from(config.table).delete().eq("id", data.id);
      if (error) throw error;
    } else if (action === "create") {
      const row = rowFromInput(config, data);
      const { error } = await supabase.from(config.table).insert(row);
      if (error) throw error;
    } else {
      if (!data.id) return { statusCode: 400, body: JSON.stringify({ error: "Missing id." }) };
      const row = rowFromInput(config, data);
      const { error } = await supabase.from(config.table).update(row).eq("id", data.id);
      if (error) throw error;
    }

    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error(`CMS CRUD failed (${entityName}/${action}):`, err);
    const message = err && err.code === "23505" ? "That value must be unique — it's already in use." : "Save failed.";
    return { statusCode: 500, body: JSON.stringify({ error: message }) };
  }
};
