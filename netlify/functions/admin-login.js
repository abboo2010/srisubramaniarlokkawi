// ============================================================
// admin-login.js — Netlify Function (public — this IS the login gate)
//
// Verifies a committee member's username + password against
// admin_users and returns a signed session token (see
// _admin-auth.js) plus that account's current access flags, so
// cms.html / admin-prayers.html know which sections to show.
//
// ---------- One-time bootstrap of the first master account ----------
// The very first time this runs against a fresh admin_users table
// (0 rows — the migration creates the table empty, it doesn't know
// Ravi's chosen password), there is no account to check a login
// against yet. In that one case only, a login is accepted if the
// submitted password matches the existing ADMIN_PASSWORD environment
// variable (the same shared password every admin page used before
// this feature existed) — whatever username is typed becomes the
// first account, created as a master with full access. This means
// Ravi doesn't need any separate setup step to avoid losing access:
// he just logs in once with a username of his choosing and his
// existing admin password.
//
// Once that first row exists, this fallback is gone for good —
// every login after that must match a real admin_users row, and
// ADMIN_PASSWORD is never checked again (it can be left in Netlify
// harmlessly, or removed whenever convenient).
//
// Required environment variables: SUPABASE_URL,
// SUPABASE_SERVICE_ROLE_KEY, ADMIN_JWT_SECRET (see _admin-auth.js).
// ADMIN_PASSWORD is only consulted for the one-time bootstrap above.
// ============================================================
const bcrypt = require("bcryptjs");
const { supabaseClient } = require("./_supabase");
const { signAdminToken } = require("./_admin-auth");

const GENERIC_ERROR = "Incorrect username or password.";

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

  // Usernames are always lowercased — both here and when a master
  // creates an account (admin-users-crud.js) — so a login is a plain
  // exact match, no case-insensitive LIKE-pattern matching needed
  // (which would also require escaping any literal % or _ a username
  // might contain).
  const username = (body.username || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (!username || !password) {
    return { statusCode: 400, body: JSON.stringify({ error: "Please enter a username and password." }) };
  }

  const supabase = supabaseClient();
  if (!supabase) {
    return { statusCode: 500, body: JSON.stringify({ error: "Database is not configured yet." }) };
  }
  if (!process.env.ADMIN_JWT_SECRET) {
    return { statusCode: 500, body: JSON.stringify({ error: "Admin login is not configured yet (missing ADMIN_JWT_SECRET)." }) };
  }

  try {
    const { data: existing, error: lookupErr } = await supabase
      .from("admin_users")
      .select("id, username, password_hash, is_master, access_cms, access_prayers, active")
      .eq("username", username)
      .maybeSingle();
    if (lookupErr) throw lookupErr;

    if (existing) {
      if (!existing.active) {
        return { statusCode: 401, body: JSON.stringify({ error: "This account has been disabled. Please contact the site administrator." }) };
      }
      const match = await bcrypt.compare(password, existing.password_hash);
      if (!match) {
        return { statusCode: 401, body: JSON.stringify({ error: GENERIC_ERROR }) };
      }
      await supabase.from("admin_users").update({ last_login_at: new Date().toISOString() }).eq("id", existing.id);
      const token = signAdminToken(existing);
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
        body: JSON.stringify({
          token, username: existing.username, isMaster: existing.is_master,
          accessCms: existing.access_cms, accessPrayers: existing.access_prayers
        })
      };
    }

    // No matching account — the only other possibility is the
    // one-time bootstrap case described in the file header.
    const { count, error: countErr } = await supabase
      .from("admin_users")
      .select("id", { count: "exact", head: true });
    if (countErr) throw countErr;

    const canBootstrap = (count || 0) === 0 && !!process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD;
    if (!canBootstrap) {
      return { statusCode: 401, body: JSON.stringify({ error: GENERIC_ERROR }) };
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const { data: created, error: insertErr } = await supabase
      .from("admin_users")
      .insert({
        username, password_hash: passwordHash,
        is_master: true, access_cms: true, access_prayers: true, active: true,
        last_login_at: new Date().toISOString()
      })
      .select("id, username, is_master, access_cms, access_prayers")
      .single();
    if (insertErr) throw insertErr;

    const token = signAdminToken(created);
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      body: JSON.stringify({
        token, username: created.username, isMaster: true,
        accessCms: true, accessPrayers: true, bootstrapped: true
      })
    };
  } catch (err) {
    console.error("admin-login failed:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Login failed. Please try again in a moment." }) };
  }
};
