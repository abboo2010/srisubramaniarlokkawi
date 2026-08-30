// ============================================================
// admin-add-bulk-participants.js — Netlify Function (password-gated)
//
// Paste-a-whole-list version of admin-add-booking.js, used by the
// "+ Bulk Add Participants" button in admin-prayers.html — for
// typing in a past pooja's participant list in one go (e.g. to have
// on hand for an AGM report) instead of adding people one at a time.
//
// Request body: { prayerId, entries: [{ name, count }], status }.
// Delegates to admin_add_bulk_participants() (see
// supabase/admin-add-bulk-participants-function.sql), which inserts
// every entry as its own participant booking in a single transaction.
//
// Gated by an individual admin login with Prayers & Bookings
// (/admin-prayers.html) access — see _admin-auth.js — rather than the
// old shared ADMIN_PASSWORD.
//
// Required environment variables: same as admin-prayer-bookings.js.
// ============================================================
const { supabaseClient } = require("./_supabase");
const { requireAdmin } = require("./_admin-auth");

const VALID_STATUSES = ["Pending Payment", "Reserved", "Confirmed", "Paid/Confirmed", "Cancelled"];
const VALID_PAYMENT_METHODS = ["Bank Transfer", "QR Transfer", "Cash"];

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed." }) };
  }

  const supabase = supabaseClient();
  if (!supabase) {
    return { statusCode: 500, body: JSON.stringify({ error: "Database is not configured yet." }) };
  }
  const auth = await requireAdmin(supabase, event, { need: "prayers" });
  if (!auth.ok) {
    return { statusCode: auth.statusCode, body: JSON.stringify({ error: auth.error }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body." }) };
  }

  const prayerId = (body.prayerId || "").trim();
  const status = (body.status || "").trim();
  const paymentMethod = (body.paymentMethod || "").trim();
  const entries = Array.isArray(body.entries)
    ? body.entries
        .map((e) => ({ name: String((e && e.name) || "").trim(), count: Math.max(1, parseInt(e && e.count, 10) || 1) }))
        .filter((e) => e.name)
    : [];

  if (!prayerId || !entries.length) {
    return { statusCode: 400, body: JSON.stringify({ error: "Pooja and at least one participant name are required." }) };
  }
  if (status && !VALID_STATUSES.includes(status)) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid status." }) };
  }
  if (paymentMethod && !VALID_PAYMENT_METHODS.includes(paymentMethod)) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid payment method." }) };
  }

  try {
    const { data, error } = await supabase.rpc("admin_add_bulk_participants", {
      p_prayer_id: prayerId,
      p_entries: entries,
      p_status: status,
      p_payment_method: paymentMethod
    });

    if (error) {
      if (error.message === "PRAYER_NOT_FOUND") {
        return { statusCode: 404, body: JSON.stringify({ error: "Pooja not found." }) };
      }
      if (error.message === "NO_ENTRIES") {
        return { statusCode: 400, body: JSON.stringify({ error: "No valid participant names found." }) };
      }
      throw error;
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inserted: data })
    };
  } catch (err) {
    console.error("Admin bulk add participants failed:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Save failed." }) };
  }
};
