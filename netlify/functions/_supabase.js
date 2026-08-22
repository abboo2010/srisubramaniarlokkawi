// ============================================================
// _supabase.js — shared helper, NOT a Netlify Function itself
// (filenames starting with "_" are ignored by Netlify's function
// router). Builds a Supabase client using the service_role key —
// server-side only, full read/write access, bypasses Row Level
// Security. NEVER send this key to the browser; every function in
// this project that uses it is the only thing allowed to touch
// these tables — the browser always goes through a function.
//
// Required environment variables (Netlify dashboard, Site settings
// → Environment variables):
//   SUPABASE_URL              — Project URL (Project Settings → API)
//   SUPABASE_SERVICE_ROLE_KEY — the "service_role" secret key
//                                (Project Settings → API) — NOT the
//                                "anon public" key.
// ============================================================
const { createClient } = require("@supabase/supabase-js");

function supabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

module.exports = { supabaseClient };
