// ============================================================
// admin-prayer-bookings.js — Netlify Function (password-gated)
//
// Returns the FULL bookings table (including phone numbers and
// remarks) for the committee's admin page. Gated by an individual
// admin login with Prayers & Bookings (/admin-prayers.html) access —
// see netlify/functions/_admin-auth.js — rather than the old shared
// ADMIN_PASSWORD.
//
// Required environment variables (in addition to SUPABASE_URL /
// SUPABASE_SERVICE_ROLE_KEY, see _supabase.js): ADMIN_JWT_SECRET
// (see _admin-auth.js).
// ============================================================
const { supabaseClient } = require("./_supabase");
const { requireAdmin } = require("./_admin-auth");

exports.handler = async (event) => {
  const supabase = supabaseClient();
  if (!supabase) {
    return { statusCode: 500, body: JSON.stringify({ error: "Database is not configured yet." }) };
  }
  const auth = await requireAdmin(supabase, event, { need: "prayers" });
  if (!auth.ok) {
    return { statusCode: auth.statusCode, body: JSON.stringify({ error: auth.error }) };
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
      status: b.status,
      paymentMethod: b.payment_method
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
