// ============================================================
// register-prayer.js — Netlify Function
//
// Handles a devotee's Annual Prayers registration: Ubayakarar
// (Ubayam sponsor), Annathanam sponsor, or Participant. Delegates
// the actual write to the register_prayer() Postgres function
// (see supabase/schema.sql), which locks the prayer row, re-checks
// the role is still open, and inserts the booking — all in one
// transaction, so two devotees submitting for the same exclusive
// slot within moments of each other cannot both "win" it.
//
// Annathanam sponsorship is reserve-only: this function never
// collects payment for it. Payment for Ubayakarar (and any paid
// participant slot) stays the existing manual DuitNow QR / bank
// transfer + WhatsApp proof flow already used for Sevas — this
// function just reserves the slot and returns a reference code.
//
// Required environment variables: SUPABASE_URL,
// SUPABASE_SERVICE_ROLE_KEY (see netlify/functions/_supabase.js).
// ============================================================
const { supabaseClient } = require("./_supabase");

const VALID_ROLES = ["ubayakarar", "annathanam", "participant"];

const ERROR_MESSAGES = {
  PRAYER_NOT_FOUND: { code: 404, message: "Pooja/prayer not found." },
  PRAYER_OVER: { code: 409, message: "This pooja has already taken place. Registration is closed." },
  ROLE_TAKEN: { code: 409, message: "Sorry — someone just reserved this slot. Please choose another pooja or role." },
  PARTICIPANT_NOT_ENABLED: { code: 409, message: "Participant registration is not open for this pooja." },
  INVALID_ROLE: { code: 400, message: "Invalid registration role." }
};

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed." }) };
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
  const participantCount = Math.max(1, parseInt(body.participantCount, 10) || 1);

  if (!prayerId || !VALID_ROLES.includes(role) || !name || !phone) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing or invalid fields." }) };
  }
  if (phone.replace(/\D/g, "").length < 7) {
    return { statusCode: 400, body: JSON.stringify({ error: "Please enter a valid phone / WhatsApp number." }) };
  }

  const supabase = supabaseClient();
  if (!supabase) {
    console.error("Missing SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY for prayer registration.");
    return { statusCode: 500, body: JSON.stringify({ error: "Registration is not configured yet. Please contact the temple committee directly." }) };
  }

  try {
    const { data, error } = await supabase.rpc("register_prayer", {
      p_prayer_id: prayerId,
      p_role: role,
      p_name: name,
      p_phone: phone,
      p_participant_count: participantCount,
      p_notes: notes
    });

    if (error) {
      const known = ERROR_MESSAGES[error.message];
      if (known) {
        return { statusCode: known.code, body: JSON.stringify({ error: known.message }) };
      }
      throw error;
    }

    const result = Array.isArray(data) ? data[0] : data;
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      body: JSON.stringify({
        reference: result.booking_id,
        role,
        status: result.status,
        fee: result.fee
      })
    };
  } catch (err) {
    console.error("Prayer registration failed:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Registration failed. Please try again in a moment." }) };
  }
};
