// ============================================================
// admin-friday-annathanam-crud.js — Netlify Function (password-gated)
//
// Full read/write for the Weekly Friday Pooja Annathanam tab —
// list (including sponsor phone numbers, which the public
// friday-annathanam-list.js endpoint never returns), set (edit a
// Friday's sponsor/paid-date/skip-reason, or add one that doesn't
// exist yet), and delete (remove a mistakenly-added row entirely).
//
// Request body: { action: "list" } | { action: "set", data: {...} }
// | { action: "delete", data: { date } }. Delegates to
// admin_set_friday_annathanam() / admin_delete_friday_annathanam()
// (see supabase/friday-annathanam-function.sql) — both skip any
// open/date checks, same "admin is the source of truth" reasoning
// as the rest of this project's admin functions.
//
// Required environment variables: SUPABASE_URL,
// SUPABASE_SERVICE_ROLE_KEY, ADMIN_PASSWORD (same as
// admin-prayer-bookings.js).
// ============================================================
const { supabaseClient } = require("./_supabase");

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

  const action = (body.action || "").trim();
  const data = body.data || {};

  if (!["list", "set", "delete"].includes(action)) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid action." }) };
  }

  const supabase = supabaseClient();
  if (!supabase) {
    return { statusCode: 500, body: JSON.stringify({ error: "Database is not configured yet." }) };
  }

  try {
    if (action === "list") {
      const { data: rows, error } = await supabase
        .from("friday_annathanam")
        .select("*")
        .order("date", { ascending: true });
      if (error) throw error;

      const weeks = (rows || []).map((r) => ({
        date: r.date,
        fee: r.fee,
        sponsorName: r.sponsor_name,
        sponsorPhone: r.sponsor_phone,
        paidDate: r.paid_date,
        skipReason: r.skip_reason,
        notes: r.notes
      }));

      return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ weeks }) };
    }

    if (action === "delete") {
      if (!data.date) return { statusCode: 400, body: JSON.stringify({ error: "Missing date." }) };
      const { error } = await supabase.rpc("admin_delete_friday_annathanam", { p_date: data.date });
      if (error) throw error;
      return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ok: true }) };
    }

    // action === "set"
    if (!data.date) return { statusCode: 400, body: JSON.stringify({ error: "Missing date." }) };
    const { error } = await supabase.rpc("admin_set_friday_annathanam", {
      p_date: data.date,
      p_fee: data.fee === "" || data.fee === null || data.fee === undefined ? null : Number(data.fee),
      p_sponsor_name: data.sponsorName || "",
      p_sponsor_phone: data.sponsorPhone || "",
      p_paid_date: data.paidDate || null,
      p_skip_reason: data.skipReason || "",
      p_notes: data.notes || ""
    });
    if (error) throw error;
    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error("Admin Friday Annathanam CRUD failed:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Save failed." }) };
  }
};
