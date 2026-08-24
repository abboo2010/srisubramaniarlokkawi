// ============================================================
// register-friday-annathanam.js — Netlify Function (public)
//
// Handles a devotee self-registering as sponsor for one Friday's
// weekly Annathanam. Delegates to register_friday_annathanam() (see
// supabase/friday-annathanam-function.sql), which locks the row,
// re-checks it's still open, and claims it — all in one transaction,
// same race-safety register_prayer() already gives the annual
// prayers. Payment itself still happens the existing manual way
// (DuitNow QR / bank transfer + WhatsApp proof) — this function only
// reserves the week and returns a reference; the committee marks it
// paid afterward via the admin tab.
//
// Required environment variables: SUPABASE_URL,
// SUPABASE_SERVICE_ROLE_KEY (see netlify/functions/_supabase.js).
// ============================================================
const { supabaseClient } = require("./_supabase");

const ERROR_MESSAGES = {
  DATE_NOT_FOUND: { code: 404, message: "That Friday is not on the schedule." },
  DATE_OVER: { code: 409, message: "That Friday has already passed." },
  DATE_SKIPPED: { code: 409, message: "There is no Annathanam on that Friday." },
  DATE_TAKEN: { code: 409, message: "Sorry — someone just sponsored this Friday. Please choose another." }
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

  const fridayDate = (body.date || "").trim();
  const name = (body.name || "").trim();
  const phone = (body.phone || "").trim();

  if (!fridayDate || !name || !phone) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing or invalid fields." }) };
  }
  if (phone.replace(/\D/g, "").length < 7) {
    return { statusCode: 400, body: JSON.stringify({ error: "Please enter a valid phone / WhatsApp number." }) };
  }

  const supabase = supabaseClient();
  if (!supabase) {
    console.error("Missing SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY for Friday Annathanam registration.");
    return { statusCode: 500, body: JSON.stringify({ error: "Registration is not configured yet. Please contact the temple committee directly." }) };
  }

  try {
    const { data, error } = await supabase.rpc("register_friday_annathanam", {
      p_date: fridayDate,
      p_name: name,
      p_phone: phone
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
        reference: "FA-" + result.fa_date,
        date: result.fa_date,
        fee: result.fee
      })
    };
  } catch (err) {
    console.error("Friday Annathanam registration failed:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Registration failed. Please try again in a moment." }) };
  }
};
