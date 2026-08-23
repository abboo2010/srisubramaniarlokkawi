// ============================================================
// admin-add-booking.js — Netlify Function (password-gated)
//
// Lets the committee manually record a booking from admin-prayers.html
// — used for things the public registration form can't do, chiefly
// entering a participant list (or a sponsor) for a PAST pooja after
// the fact. Delegates to admin_add_booking() (see
// supabase/admin-add-booking-function.sql), which skips the "must be
// upcoming" / "must currently be open" checks that register_prayer()
// enforces for public devotee registrations, since the admin is the
// source of truth here, not a race between two devotees.
//
// Required environment variables: same as admin-prayer-bookings.js.
// ============================================================
const { supabaseClient } = require("./_supabase");

const VALID_ROLES = ["ubayakarar", "annathanam", "participant"];
const VALID_STATUSES = ["Pending Payment", "Reserved", "Confirmed", "Cancelled"];

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

  const prayerId = (body.prayerId || "").trim();
  const role = (body.role || "").trim();
  const name = (body.name || "").trim();
  const phone = (body.phone || "").trim();
  const notes = (body.notes || "").trim();
  const status = (body.status || "").trim();
  const participantCount = Math.max(1, parseInt(body.participantCount, 10) || 1);

  if (!prayerId || !VALID_ROLES.includes(role) || !name) {
    return { statusCode: 400, body: JSON.stringify({ error: "Pooja, role, and name are required." }) };
  }
  if (status && !VALID_STATUSES.includes(status)) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid status." }) };
  }

  const supabase = supabaseClient();
  if (!supabase) {
    return { statusCode: 500, body: JSON.stringify({ error: "Database is not configured yet." }) };
  }

  try {
    const { data, error } = await supabase.rpc("admin_add_booking", {
      p_prayer_id: prayerId,
      p_role: role,
      p_name: name,
      p_phone: phone,
      p_participant_count: participantCount,
      p_notes: notes,
      p_status: status
    });

    if (error) {
      if (error.message === "PRAYER_NOT_FOUND") {
        return { statusCode: 404, body: JSON.stringify({ error: "Pooja not found." }) };
      }
      throw error;
    }

    const result = Array.isArray(data) ? data[0] : data;
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: result.booking_id, status: result.status })
    };
  } catch (err) {
    console.error("Admin add booking failed:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Save failed." }) };
  }
};
