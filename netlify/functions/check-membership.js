// ============================================================
// check-membership.js — Netlify Function (public, read-only)
//
// Looks up a single member by NRIC in the Supabase "members" table
// (added by the /cms Membership tab). Only the matched record — or
// a 404 if there's no match — is returned to the visitor; the full
// member list is never sent to the client. Same public contract as
// before (GET ?nric=XXXXXX-XX-XXXX), so index.html's Membership
// Status screen needed no changes.
//
// This replaces the earlier Google Sheets version (a private
// "Members" sheet read via a Google service account) — that sheet
// is no longer read anywhere; committee members now manage the
// member list entirely through /cms.html's Membership tab, which
// uses cms-members.js.
//
// Required environment variables (same as every other Supabase
// function in this project — see _supabase.js):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// ============================================================
const { supabaseClient } = require("./_supabase");

const NRIC_PATTERN = /^\d{6}-\d{2}-\d{4}$/;

exports.handler = async (event) => {
  const nric = (event.queryStringParameters && event.queryStringParameters.nric || "").trim();

  if (!NRIC_PATTERN.test(nric)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid NRIC format. Expected XXXXXX-XX-XXXX." })
    };
  }

  const supabase = supabaseClient();
  if (!supabase) {
    console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY for membership lookup.");
    return { statusCode: 500, body: JSON.stringify({ error: "Membership check is not configured yet." }) };
  }

  try {
    const { data, error } = await supabase
      .from("members")
      .select("name, nric, membership_no, membership_type")
      .eq("nric", nric)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return { statusCode: 404, body: JSON.stringify({ error: "No membership record found." }) };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      body: JSON.stringify({
        name: data.name || "",
        nric: data.nric || nric,
        membershipNo: data.membership_no || "",
        membershipType: data.membership_type || ""
      })
    };
  } catch (err) {
    console.error("Membership lookup failed:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Lookup failed." }) };
  }
};
