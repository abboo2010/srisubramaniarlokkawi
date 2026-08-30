// ============================================================
// admin-update-booking.js — Netlify Function (password-gated)
//
// Lets the committee mark a booking Confirmed or Cancelled from
// admin-prayers.html. Delegates to admin_set_booking_status() (see
// supabase/schema.sql), which — when cancelling a Ubayakarar or
// Annathanam booking — also reopens that slot on the prayers row,
// so the site immediately shows it as available again.
//
// Gated by an individual admin login with Prayers & Bookings
// (/admin-prayers.html) access — see netlify/functions/_admin-auth.js —
// rather than the old shared ADMIN_PASSWORD.
//
// Required environment variables: same as admin-prayer-bookings.js.
// ============================================================
const { supabaseClient } = require("./_supabase");
const { requireAdmin } = require("./_admin-auth");

const VALID_STATUSES = ["Confirmed", "Paid/Confirmed", "Cancelled", "Pending Payment", "Reserved"];

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
  const bookingId = (body.bookingId || "").trim();
  const newStatus = (body.status || "").trim();
  if (!bookingId || !VALID_STATUSES.includes(newStatus)) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing or invalid fields." }) };
  }

  try {
    const { error } = await supabase.rpc("admin_set_booking_status", { p_booking_id: bookingId, p_status: newStatus });
    if (error) {
      if (error.message === "BOOKING_NOT_FOUND") {
        return { statusCode: 404, body: JSON.stringify({ error: "Booking not found." }) };
      }
      throw error;
    }
    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error("Updating prayer booking failed:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Update failed." }) };
  }
};
