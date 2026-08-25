// ============================================================
// check-membership.js — Netlify Function (public, read-only)
//
// Looks up a single member by Membership No. in the Supabase
// "members" table (added by the /cms Membership tab). Only the
// matched record — or a 404 if there's no match — is returned to
// the visitor; the full member list is never sent to the client.
//
// Public contract: GET ?membershipNo=M-0231 (was previously
// ?nric=XXXXXX-XX-XXXX). Switched from NRIC to Membership No. as the
// public search key because NRIC is a sensitive government ID
// number — it is never accepted as a query param and never included
// in the response below, even though it's still stored in the
// database for the committee's own records (visible only in
// /cms.html's Membership tab, which is password-gated).
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

exports.handler = async (event) => {
  const membershipNo = (event.queryStringParameters && event.queryStringParameters.membershipNo || "").trim();

  if (!membershipNo) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Please enter a Membership No." })
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
      .select("name, membership_no, membership_type, status")
      .ilike("membership_no", membershipNo)
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
        membershipNo: data.membership_no || membershipNo,
        membershipType: data.membership_type || "",
        status: data.status || "Active"
      })
    };
  } catch (err) {
    console.error("Membership lookup failed:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Lookup failed." }) };
  }
};
