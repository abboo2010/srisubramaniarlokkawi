// ============================================================
// cms-members.js — Netlify Function (password-gated)
//
// Full record management for the Members list (Name / NRIC /
// Membership No. / Membership Type) — this is what replaces
// hand-editing the private "Members" Google Sheet. The public NRIC
// lookup visitors use on the Membership Status screen is a
// completely separate, narrower function (check-membership.js) that
// only ever returns a single matched record, never the full list —
// this function is never exposed to that screen.
//
// GET  (Bearer token) -> { members: [...] } (full list)
// POST (Bearer token, body { action, data }) ->
//   action "create"     data: { name, nric, membershipNo, membershipType, status }
//   action "update"     data: { id, name, nric, membershipNo, membershipType, status }
//   action "delete"     data: { id }
//   action "bulkImport" data: { rows: [{ name, nric, membershipNo, membershipType, status }, ...] }
//                        — upserts by NRIC (updates existing members,
//                        inserts new ones); used to migrate the old
//                        Members sheet in one paste (see cms.html's
//                        Members tab for the expected CSV columns).
//
// "status" is one of "Active", "Not Active", "Pending for Annual
// renewal" — shown on the public Membership Status screen with a
// colored dot (green for Active, red for the other two). Requires
// the supabase/cms-members-status-migration.sql migration to have
// been run (adds the "status" column to the members table).
//
// Gated by an individual admin login with Content (/cms.html) access
// — see netlify/functions/_admin-auth.js — rather than the old shared
// ADMIN_PASSWORD.
//
// Required environment variables: SUPABASE_URL,
// SUPABASE_SERVICE_ROLE_KEY, ADMIN_JWT_SECRET (see _admin-auth.js).
// ============================================================
const { supabaseClient } = require("./_supabase");
const { requireAdmin } = require("./_admin-auth");

const NRIC_PATTERN = /^\d{6}-\d{2}-\d{4}$/;
const STATUS_VALUES = ["Active", "Not Active", "Pending for Annual renewal"];

function memberRow(data) {
  const row = {};
  if (data.name !== undefined) row.name = String(data.name || "").trim();
  if (data.nric !== undefined) row.nric = String(data.nric || "").trim();
  if (data.membershipNo !== undefined) row.membership_no = String(data.membershipNo || "").trim();
  if (data.membershipType !== undefined) row.membership_type = data.membershipType === "Life" ? "Life" : "Ordinary";
  if (data.status !== undefined) row.status = STATUS_VALUES.includes(data.status) ? data.status : "Active";
  return row;
}

exports.handler = async (event) => {
  const supabase = supabaseClient();
  if (!supabase) {
    return { statusCode: 500, body: JSON.stringify({ error: "Database is not configured yet." }) };
  }
  const auth = await requireAdmin(supabase, event, { need: "cms" });
  if (!auth.ok) {
    return { statusCode: auth.statusCode, body: JSON.stringify({ error: auth.error }) };
  }

  if (event.httpMethod === "GET") {
    try {
      const { data, error } = await supabase.from("members").select("*").order("name", { ascending: true });
      if (error) throw error;
      const members = (data || []).map(m => ({ id: m.id, name: m.name, nric: m.nric, membershipNo: m.membership_no, membershipType: m.membership_type, status: m.status || "Active" }));
      return { statusCode: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }, body: JSON.stringify({ members }) };
    } catch (err) {
      console.error("Fetching members failed:", err);
      return { statusCode: 500, body: JSON.stringify({ error: "Could not load members." }) };
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

  const action = (body.action || "").trim();
  const data = body.data || {};

  try {
    if (action === "delete") {
      if (!data.id) return { statusCode: 400, body: JSON.stringify({ error: "Missing id." }) };
      const { error } = await supabase.from("members").delete().eq("id", data.id);
      if (error) throw error;

    } else if (action === "create") {
      const row = memberRow(data);
      if (!row.name || !NRIC_PATTERN.test(row.nric || "")) {
        return { statusCode: 400, body: JSON.stringify({ error: "Name is required and NRIC must be XXXXXX-XX-XXXX." }) };
      }
      const { error } = await supabase.from("members").insert(row);
      if (error) throw error;

    } else if (action === "update") {
      if (!data.id) return { statusCode: 400, body: JSON.stringify({ error: "Missing id." }) };
      const row = memberRow(data);
      if (row.nric !== undefined && !NRIC_PATTERN.test(row.nric)) {
        return { statusCode: 400, body: JSON.stringify({ error: "NRIC must be XXXXXX-XX-XXXX." }) };
      }
      const { error } = await supabase.from("members").update(row).eq("id", data.id);
      if (error) throw error;

    } else if (action === "bulkImport") {
      const rows = Array.isArray(data.rows) ? data.rows : [];
      const clean = rows.map(memberRow).filter(r => r.name && NRIC_PATTERN.test(r.nric || ""));
      if (!clean.length) {
        return { statusCode: 400, body: JSON.stringify({ error: "No valid rows found (need Name + NRIC as XXXXXX-XX-XXXX)." }) };
      }
      const { error } = await supabase.from("members").upsert(clean, { onConflict: "nric" });
      if (error) throw error;
      return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ok: true, imported: clean.length, skipped: rows.length - clean.length }) };

    } else {
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid action." }) };
    }

    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error(`Members CRUD failed (${action}):`, err);
    const message = err && err.code === "23505" ? "That NRIC is already registered to another member." : "Save failed.";
    return { statusCode: 500, body: JSON.stringify({ error: message }) };
  }
};
