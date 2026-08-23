// ============================================================
// admin-prayers-crud.js — Netlify Function (password-gated)
//
// Full create/update/delete for the Annual Prayers schedule and the
// Annathanam caterer list, used by the "Schedule" tab of
// admin-prayers.html. This is what replaces hand-editing
// content/annual-prayers.json + redeploying — changes here take
// effect on the live site immediately (prayers-list.js reads the
// same table).
//
// Request body: { entity: "prayer" | "caterer", action: "create" |
// "update" | "delete", data: {...} }. "update"/"delete" require
// data.id; "create" for a prayer requires data.id (you choose it,
// e.g. "p46") since it's used as the public booking reference.
//
// Required environment variables: same as admin-prayer-bookings.js.
// ============================================================
const { supabaseClient } = require("./_supabase");

function prayerRowFromInput(data) {
  const row = {};
  if (data.id !== undefined) row.id = String(data.id).trim();
  if (data.ref !== undefined) row.ref = data.ref === "" || data.ref === null ? null : Number(data.ref);
  if (data.date !== undefined) row.date = data.date;
  if (data.name !== undefined) row.name = data.name;
  if (data.ubayamFee !== undefined) row.ubayam_fee = data.ubayamFee === "" || data.ubayamFee === null ? null : Number(data.ubayamFee);
  if (data.ubayakararSponsor !== undefined) row.ubayakarar_sponsor = data.ubayakararSponsor || null;
  if (data.ubayakararOpen !== undefined) row.ubayakarar_open = !!data.ubayakararOpen;
  if (data.annathanamSponsor !== undefined) row.annathanam_sponsor = data.annathanamSponsor || null;
  if (data.annathanamOpen !== undefined) row.annathanam_open = !!data.annathanamOpen;
  if (data.participantsEnabled !== undefined) row.participants_enabled = !!data.participantsEnabled;
  if (data.participantFee !== undefined) row.participant_fee = data.participantFee === "" || data.participantFee === null ? null : Number(data.participantFee);
  if (data.notes !== undefined) row.notes = data.notes || "";
  if (data.statusOverride !== undefined) row.status_override = data.statusOverride || null;
  return row;
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed." }) };
  }

  const suppliedPassword = event.headers["x-admin-password"] || event.headers["X-Admin-Password"] || "";
  if (!process.env.ADMIN_PASSWORD || suppliedPassword !== process.env.ADMIN_PASSWORD) {
    return { statusCode: 401, body: JSON.stringify({ error: "Incorrect password." }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body." }) };
  }

  const entity = (body.entity || "").trim();
  const action = (body.action || "").trim();
  const data = body.data || {};

  if (!["prayer", "caterer"].includes(entity) || !["create", "update", "delete"].includes(action)) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid entity/action." }) };
  }

  const supabase = supabaseClient();
  if (!supabase) {
    return { statusCode: 500, body: JSON.stringify({ error: "Database is not configured yet." }) };
  }

  try {
    if (entity === "prayer") {
      if (action === "delete") {
        if (!data.id) return { statusCode: 400, body: JSON.stringify({ error: "Missing id." }) };
        const { error } = await supabase.from("prayers").delete().eq("id", data.id);
        if (error) throw error;
      } else if (action === "create") {
        const row = prayerRowFromInput(data);
        if (!row.id || !row.date || !row.name) {
          return { statusCode: 400, body: JSON.stringify({ error: "id, date, and name are required." }) };
        }
        const { error } = await supabase.from("prayers").insert(row);
        if (error) throw error;
      } else {
        const row = prayerRowFromInput(data);
        if (!row.id) return { statusCode: 400, body: JSON.stringify({ error: "Missing id." }) };
        const id = row.id;
        delete row.id;
        const { error } = await supabase.from("prayers").update(row).eq("id", id);
        if (error) throw error;
      }
    } else {
      if (action === "delete") {
        if (!data.id) return { statusCode: 400, body: JSON.stringify({ error: "Missing id." }) };
        const { error } = await supabase.from("caterers").delete().eq("id", data.id);
        if (error) throw error;
      } else if (action === "create") {
        const { error } = await supabase.from("caterers").insert({
          name: data.name || "", contact: data.contact || "", phone: data.phone || "", sort_order: Number(data.sortOrder) || 0
        });
        if (error) throw error;
      } else {
        if (!data.id) return { statusCode: 400, body: JSON.stringify({ error: "Missing id." }) };
        const patch = {};
        if (data.name !== undefined) patch.name = data.name;
        if (data.contact !== undefined) patch.contact = data.contact;
        if (data.phone !== undefined) patch.phone = data.phone;
        if (data.sortOrder !== undefined) patch.sort_order = Number(data.sortOrder) || 0;
        const { error } = await supabase.from("caterers").update(patch).eq("id", data.id);
        if (error) throw error;
      }
    }

    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error("Admin prayers CRUD failed:", err);
    const message = err && err.code === "23505" ? "That ID already exists." : "Save failed.";
    return { statusCode: 500, body: JSON.stringify({ error: message }) };
  }
};
