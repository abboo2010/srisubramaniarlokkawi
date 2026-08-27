// ============================================================
// prayers-list.js — Netlify Function (public, read-only)
//
// Returns the full, live Annual Prayers schedule from Supabase —
// this is now the primary source for the "Prayers & Registration"
// screen (the bundled content/annual-prayers.json in this repo is
// kept only as an offline fallback in case Supabase is unreachable
// or not configured yet). Also returns the Annathanam caterer list,
// a public-safe list of registered participants per pooja (name +
// head-count only — never phone number), and — same privacy level
// as the sponsor name itself, which is already public — each
// Ubayakarar/Annathanam booking's reference code and status, so the
// public prayer detail view can show "Reference: AP-..." and (for
// Ubayakarar, the only one of the two the site ever collects payment
// for) a Paid/Not Paid indicator next to the Ubayam Fee.
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
      body: JSON.stringify({ configured: false, prayers: null, caterers: null, participants: {}, sponsorBookings: {} })
    };
  }

  try {
    const [{ data: prayerRows, error: prayerErr }, { data: catererRows, error: catererErr }, { data: participantRows, error: participantErr }, { data: sponsorRows, error: sponsorErr }] =
      await Promise.all([
        supabase.from("prayers").select("*").order("date", { ascending: true }),
        supabase.from("caterers").select("*").order("sort_order", { ascending: true }),
        supabase.from("bookings").select("prayer_id, name, participant_count").eq("role", "participant").neq("status", "Cancelled"),
        supabase.from("bookings").select("prayer_id, role, booking_id, status, created_at")
          .in("role", ["ubayakarar", "annathanam"]).neq("status", "Cancelled")
          .order("created_at", { ascending: false })
      ]);

    if (prayerErr) throw prayerErr;
    if (catererErr) throw catererErr;
    if (participantErr) throw participantErr;
    if (sponsorErr) throw sponsorErr;

    const prayers = (prayerRows || []).map((p) => ({
      id: p.id,
      ref: p.ref,
      date: p.date,
      name: p.name,
      category: p.category || "annual",
      poojaType: p.pooja_type || null,
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

    // id is included so admin-prayers.html's Edit/Delete caterer buttons have
    // something to target — without it every caterer collides on the same
    // "undefined" id once loaded, so Edit always opens the first caterer in
    // the list (never the one actually clicked) and Delete can't find a real
    // row to remove. Harmless to expose publicly — it's just an internal
    // sequence number, same as a prayer's own "p1"/"p46" id already is.
    const caterers = (catererRows || []).map((c) => ({ id: c.id, name: c.name, contact: c.contact, phone: c.phone }));

    const participants = {};
    (participantRows || []).forEach((r) => {
      if (!participants[r.prayer_id]) participants[r.prayer_id] = [];
      participants[r.prayer_id].push({ name: r.name, participantCount: r.participant_count });
    });

    // sponsorRows is ordered newest-first, so the first row seen for a
    // given (prayer_id, role) pair is the current one — later rows would
    // only exist from a since-cancelled-and-rebooked slot, which we skip.
    const sponsorBookings = {};
    (sponsorRows || []).forEach((r) => {
      if (!sponsorBookings[r.prayer_id]) sponsorBookings[r.prayer_id] = {};
      if (!sponsorBookings[r.prayer_id][r.role]) {
        sponsorBookings[r.prayer_id][r.role] = { reference: r.booking_id, status: r.status };
      }
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      body: JSON.stringify({ configured: true, prayers, caterers, participants, sponsorBookings })
    };
  } catch (err) {
    console.error("Fetching prayers list failed:", err);
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ configured: false, prayers: null, caterers: null, participants: {}, sponsorBookings: {} })
    };
  }
};
