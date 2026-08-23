// ============================================================
// admin-prayer-bookings.js — Netlify Function (password-gated)
//
// Returns the FULL bookings table (including phone numbers and
// remarks) for the committee's admin page. Gated by a shared
// password rather than individual logins — good enough for a small
// committee, not a substitute for real per-user auth.
//
// Required environment variables (in addition to SUPABASE_URL /
// SUPABASE_SERVICE_ROLE_KEY, see _supabase.js):
//   ADMIN_PASSWORD — shared password checked against the
//                    X-Admin-Password header sent by admin-prayers.html
// ============================================================
const { supabaseClient } = require("./_supabase");

exports.handler = async (event) => {
  const suppliedPassword = event.headers["x-admin-password"] || event.headers["X-Admin-Password"] || "";
  if (!process.env.ADMIN_PASSWORD || suppliedPassword !== process.env.ADMIN_PASSWORD) {
    return { statusCode: 401, body: JSON.stringify({ error: "Incorrect password." }) };
  }

  const supabase = supabaseClient();
  if (!supabase) {
    return { statusCode: 500, body: JSON.stringify({ error: "Database is not configured yet." }) };
  }

  try {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .order("date", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw error;

    const bookings = (data || []).map((b) => ({
      timestamp: b.created_at,
      bookingId: b.booking_id,
      prayerId: b.prayer_id,
      prayerName: b.prayer_name,
      date: b.date,
      role: b.role,
      name: b.name,
      phone: b.phone,
      participantCount: b.participant_count,
      notes: b.notes,
      status: b.status
    }));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      body: JSON.stringify({ bookings })
    };
  } catch (err) {
    console.error("Fetching admin prayer bookings failed:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Could not load bookings." }) };
  }
};
