// ============================================================
// check-membership.js — Netlify Function
//
// Looks up a single member by NRIC in a private Google Sheet,
// using a Google service account (server-side credentials that
// never reach the browser). Only the matched record — or a
// 404 if there's no match — is returned to the visitor. The
// full member list is never sent to the client.
//
// Required environment variables (set in Netlify dashboard,
// Site settings → Environment variables):
//   GOOGLE_SERVICE_ACCOUNT_EMAIL  — the service account's email
//   GOOGLE_PRIVATE_KEY            — the service account's private key
//                                    (paste with real newlines; this
//                                    file handles the \n-escaped form
//                                    too, in case Netlify's UI collapses
//                                    it into one line)
//   MEMBERSHIP_SHEET_ID           — the Google Sheet ID (from its URL)
//   MEMBERSHIP_SHEET_TAB          — optional, defaults to "Members"
//
// Expected sheet columns (header row, any order, exact names):
//   Name | NRIC | Membership No. | Membership Type (Life/Ordinary)
//
// Setup (one-time):
//   1. In Google Cloud Console, create a service account and
//      enable the Google Sheets API for the project.
//   2. Create a JSON key for the service account.
//   3. Share the Membership Google Sheet with the service
//      account's email address (Viewer access is enough).
//   4. In Netlify, set the four environment variables above
//      using values from the JSON key + the sheet's URL.
// ============================================================

const { google } = require("googleapis");

const NRIC_PATTERN = /^\d{6}-\d{2}-\d{4}$/;

exports.handler = async (event) => {
  const nric = (event.queryStringParameters && event.queryStringParameters.nric || "").trim();

  if (!NRIC_PATTERN.test(nric)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid NRIC format. Expected XXXXXX-XX-XXXX." })
    };
  }

  const {
    GOOGLE_SERVICE_ACCOUNT_EMAIL,
    GOOGLE_PRIVATE_KEY,
    GOOGLE_PRIVATE_KEY_B64,
    MEMBERSHIP_SHEET_ID,
    MEMBERSHIP_SHEET_TAB
  } = process.env;

  if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !(GOOGLE_PRIVATE_KEY || GOOGLE_PRIVATE_KEY_B64) || !MEMBERSHIP_SHEET_ID) {
    console.error("Missing required environment variables for membership lookup.");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Membership check is not configured yet." })
    };
  }

  try {
    // Netlify's env var UI can corrupt PEM line breaks/quotes on paste.
    // Support a base64-encoded key (recommended, set via
    // GOOGLE_PRIVATE_KEY_B64) as well as the raw PEM value, to sidestep
    // that entirely.
    let privateKey;
    if (process.env.GOOGLE_PRIVATE_KEY_B64) {
      privateKey = Buffer.from(process.env.GOOGLE_PRIVATE_KEY_B64, "base64").toString("utf8");
    } else {
      privateKey = GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n");
    }

    const auth = new google.auth.JWT(
      GOOGLE_SERVICE_ACCOUNT_EMAIL,
      null,
      privateKey,
      ["https://www.googleapis.com/auth/spreadsheets.readonly"]
    );

    const sheets = google.sheets({ version: "v4", auth });
    const tab = MEMBERSHIP_SHEET_TAB || "Members";

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: MEMBERSHIP_SHEET_ID,
      range: `${tab}!A:Z`
    });

    const rows = res.data.values || [];
    if (rows.length < 2) {
      return { statusCode: 404, body: JSON.stringify({ error: "No members found." }) };
    }

    const header = rows[0].map((h) => (h || "").trim().toLowerCase());
    const nameIdx = header.indexOf("name");
    const nricIdx = header.indexOf("nric");
    const noIdx = header.findIndex((h) => h.startsWith("membership no"));
    const typeIdx = header.findIndex((h) => h.startsWith("membership type"));

    if (nameIdx === -1 || nricIdx === -1 || noIdx === -1 || typeIdx === -1) {
      console.error("Membership sheet is missing one or more expected columns.", header);
      return { statusCode: 500, body: JSON.stringify({ error: "Membership sheet is misconfigured." }) };
    }

    const match = rows.slice(1).find((row) => (row[nricIdx] || "").trim() === nric);

    if (!match) {
      console.error(
        "No match. Searched nric:", JSON.stringify(nric),
        "| tab used:", tab,
        "| sheet NRIC values:", JSON.stringify(rows.slice(1).map((r) => r[nricIdx]))
      );
      return { statusCode: 404, body: JSON.stringify({ error: "No membership record found." }) };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      body: JSON.stringify({
        name: match[nameIdx] || "",
        nric: match[nricIdx] || nric,
        membershipNo: match[noIdx] || "",
        membershipType: match[typeIdx] || ""
      })
    };
  } catch (err) {
    console.error("Membership lookup failed:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Lookup failed." }) };
  }
};
