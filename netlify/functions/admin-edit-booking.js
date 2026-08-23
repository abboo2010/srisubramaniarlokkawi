// ============================================================
// admin-edit-booking.js — Netlify Function (password-gated)
//
// Full edit (name, phone, headcount, notes, status) for an existing
// booking, used by the Edit button on every row of admin-prayers.html's
// Bookings tab. Delegates to admin_edit_booking() (see
// supabase/admin-edit-delete-booking-functions.sql), which does NOT
// let you move a booking to a different pooja or role — delete and
// re-add it instead if it needs to move. Keeps the Schedule tab's
// Ubayakarar/Annathanam sponsor fields in sync when relevant.
//
// Required environment variables: same as admin-prayer-bookings.js.
// ============================================================
const { supabaseClient } = require("./_supabase");

const VALID_STATUSES = ["Pending Payment", "Reserved", "Confirmed", "Cancelled"];
const VALID_PAYMENT_METHODS = ["Bank Transfer", "QR Transfer", "Cash"];

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

  const bookingId = (body.bookingId || "").trim();
  const name = (body.name || "").trim();
  const phone = (body.phone || "").trim();
  const notes = (body.notes || "").trim();
  const status = (body.status || "").trim();
  const paymentMethod = (body.paymentMethod || "").trim();
  const participantCount = Math.max(1, parseInt(body.participantCount, 10) || 1);

  if (!bookingId || !name) {
    return { statusCode: 400, body: JSON.stringify({ error: "Booking and name are required." }) };
  }
  if (!VALID_STATUSES.includes(status)) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid status." }) };
  }
  if (paymentMethod && !VALID_PAYMENT_METHODS.includes(paymentMethod)) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid payment method." }) };
  }

  const supabase = supabaseClient();
  if (!supabase) {
    return { statusCode: 500, body: JSON.stringify({ error: "Database is not configured yet." }) };
  }

  try {
    const { error } = await supabase.rpc("admin_edit_booking", {
      p_booking_id: bookingId,
      p_name: name,
      p_phone: phone,
      p_participant_count: participantCount,
      p_notes: notes,
      p_status: status,
      p_payment_method: paymentMethod
    });

    if (error) {
      if (error.message === "BOOKING_NOT_FOUND") {
        return { statusCode: 404, body: JSON.stringify({ error: "Booking not found." }) };
      }
      throw error;
    }

    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error("Admin edit booking failed:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Save failed." }) };
  }
};
