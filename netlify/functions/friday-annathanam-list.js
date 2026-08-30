// ============================================================
// friday-annathanam-list.js — Netlify Function (public, read-only)
//
// Returns the full Weekly Friday Pooja Annathanam schedule from the
// dedicated friday_annathanam table (see
// supabase/friday-annathanam-function.sql) — kept separate from the
// annual prayers/bookings tables, so this is its own small endpoint
// rather than being folded into prayers-list.js.
//
// sponsor_name is returned as-is — the sponsor's name is already
// shown publicly on the schedule itself, same privacy level as an
// Ubayakarar/Annathanam sponsor name elsewhere on this site.
// sponsor_phone is deliberately NEVER included here — same rule
// prayers-list.js already follows for its participants list (name +
// headcount only, never phone). The committee reads phone numbers
// from the password-gated admin-friday-annathanam-crud.js "list"
// action instead, not this public endpoint. The raw paid_date itself
// is also left out — a sponsor's own payment date isn't the public's
// business — but a plain paid/not-paid boolean IS included (as
// `paid`), the same level of detail the Prayers & Registration
// screen already shows for an Ubayakarar sponsorship's Paid/Not Paid
// pill, without exposing the actual date.
// ============================================================
const { supabaseClient } = require("./_supabase");

exports.handler = async () => {
  const supabase = supabaseClient();
  if (!supabase) {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ configured: false, weeks: null })
    };
  }

  try {
    const { data, error } = await supabase
      .from("friday_annathanam")
      .select("*")
      .order("date", { ascending: true });
    if (error) throw error;

    const weeks = (data || []).map((r) => ({
      date: r.date,
      fee: r.fee,
      sponsorName: r.sponsor_name,
      paid: !!r.paid_date,
      skipReason: r.skip_reason
      // sponsor_phone, the raw paid_date, and notes are intentionally
      // left out — see the file header for why.
    }));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      body: JSON.stringify({ configured: true, weeks })
    };
  } catch (err) {
    console.error("Fetching Friday Annathanam list failed:", err);
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ configured: false, weeks: null })
    };
  }
};
