// ============================================================
// prayers-list.js — Netlify Function (public, read-only)
//
// Returns the full, live Annual Prayers schedule from Supabase —
// this is now the primary source for the "Prayers & Registration"
// screen (the bundled content/annual-prayers.json in this repo is
// kept only as an offline fallback in case Supabase is unreachable
// or not configured yet). Also returns the Annathanam caterer list,
// and a public-safe list of registered participants per pooja (name
// + head-count only — never phone number).
// ============================================================
const { supabaseClient } = require("./_supabase");

exports.handler = async () => {
  const supabase = supabaseClient();
  if (!supabase) {
    // Not configured yet — tell the frontend so it can fall back to
    // the bundled content instead of showing an empty screen.
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ configured: false, prayers: null, caterers: null, participants: {} })
    };
  }

  try {
    const [{ data: prayerRows, error: prayerErr }, { data: catererRows, error: catererErr }, { data: participantRows, error: participantErr }] =
      await Promise.all([
        supabase.from("prayers").select("*").order("date", { ascending: true }),
        supabase.from("caterers").select("*").order("sort_order", { ascending: true }),
        supabase.from("bookings").select("prayer_id, name, participant_count").eq("role", "participant").neq("status", "Cancelled")
      ]);

    if (prayerErr) throw prayerErr;
    if (catererErr) throw catererErr;
    if (participantErr) throw participantErr;

    const prayers = (prayerRows || []).map((p) => ({
      id: p.id,
      ref: p.ref,
      date: p.date,
      name: p.name,
      ubayamFee: p.ubayam_fee,
      ubayakararSponsor: p.ubayakarar_sponsor,
      ubayakararOpen: p.ubayakarar_open,
      annathanamSponsor: p.annathanam_sponsor,
      annathanamOpen: p.annathanam_open,
      participantsEnabled: p.participants_enabled,
      participantFee: p.participant_fee,
      notes: p.notes || "",
      statusOverride: p.status_override
    }));

    const caterers = (catererRows || []).map((c) => ({ name: c.name, contact: c.contact, phone: c.phone }));

    const participants = {};
    (participantRows || []).forEach((r) => {
      if (!participants[r.prayer_id]) participants[r.prayer_id] = [];
      participants[r.prayer_id].push({ name: r.name, participantCount: r.participant_count });
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      body: JSON.stringify({ configured: true, prayers, caterers, participants })
    };
  } catch (err) {
    console.error("Fetching prayers list failed:", err);
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ configured: false, prayers: null, caterers: null, participants: {} })
    };
  }
};
