// ============================================================
// _sheets-auth.js — shared helper, NOT a Netlify Function itself
// (filenames starting with "_" are ignored by Netlify's function
// router). Builds an authenticated Google Sheets client from the
// same service-account env vars used across every sheet-backed
// function in this project.
// ============================================================
const { google } = require("googleapis");

function getPrivateKey() {
  if (process.env.GOOGLE_PRIVATE_KEY_B64) {
    return Buffer.from(process.env.GOOGLE_PRIVATE_KEY_B64, "base64").toString("utf8");
  }
  if (process.env.GOOGLE_PRIVATE_KEY) {
    return process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n");
  }
  return null;
}

// scope: "readonly" or "readwrite"
function sheetsClient(scope) {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = getPrivateKey();
  if (!email || !key) return null;

  const scopeUrl = scope === "readwrite"
    ? "https://www.googleapis.com/auth/spreadsheets"
    : "https://www.googleapis.com/auth/spreadsheets.readonly";

  const auth = new google.auth.JWT(email, null, key, [scopeUrl]);
  return google.sheets({ version: "v4", auth });
}

module.exports = { sheetsClient };
