// ============================================================
// admin-delete-booking.js — Netlify Function (password-gated)
//
// Permanently removes a booking, used by the Delete button on every
// row of admin-prayers.html's Bookings tab. Different from Cancel
// (admin-update-booking.js), which keeps the record but marks it
// void — this erases it entirely. Delegates to admin_delete_booking()
// (see supabase/admin-edit-delete-booking-functions.sql), which
// reopens the Ubayakarar/Annathanam slot on the Schedule tab first
// if the booking being deleted was still active.
//
// Gated by an individual admin login with Prayers & Bookings
// (/admin-prayers.html) access — see netlify/functions/_admin-auth.js —
// rather than the old shared ADMIN_PASSWORD.
//
// Required environment variables: same as admin-prayer-bookings.js.
// ============================================================
const { supabaseClient } = require("./_supabase");
const { requireAdmin } = require("./_admin-auth");

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
  if (!bookingId) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing booking id." }) };
  }

  try {
    const { error } = await supabase.rpc("admin_delete_booking", { p_booking_id: bookingId });

    if (error) {
      if (error.message === "BOOKING_NOT_FOUND") {
        return { statusCode: 404, body: JSON.stringify({ error: "Booking not found." }) };
      }
      throw error;
    }

    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error("Admin delete booking failed:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Delete failed." }) };
  }
};
