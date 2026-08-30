// ============================================================
// _admin-auth.js — shared helper, NOT a Netlify Function itself
// (filenames starting with "_" are ignored by Netlify's function
// router, same as _supabase.js and _rate-limit.js).
//
// Individual committee-member admin accounts, replacing the old
// single shared ADMIN_PASSWORD checked against every request.
// Accounts live in the admin_users table (see
// supabase/add-admin-users.sql) — each has its own username +
// bcrypt-hashed password, an "active" flag, an "is_master" flag
// (only a master can create/edit/delete other accounts), and two
// independent access flags: access_cms (/cms.html) and
// access_prayers (/admin-prayers.html) — so a committee member can be
// given just the one admin page they actually need.
//
// Flow:
//   1. admin-login.js checks username+password, returns a short-lived
//      signed JWT (just { uid, username } — no permission claims, see
//      below for why) plus the account's current flags for the UI.
//   2. Every other admin-gated function calls requireAdmin(supabase,
//      event, { need }) with need one of "cms" | "prayers" | "master".
//      It verifies the JWT, then RE-READS the account row from the
//      database on every single call — deliberately not trusting
//      flags baked into the token — so if a master disables someone
//      or changes what they can access, it takes effect on that
//      person's very next request, not whenever their token happens
//      to expire.
//
// Required environment variable: ADMIN_JWT_SECRET — a long random
// string used to sign/verify tokens. Without it every admin function
// fails closed (nobody can log in) rather than silently accepting
// unsigned tokens.
// ============================================================
const jwt = require("jsonwebtoken");

const TOKEN_TTL = "12h";

function signAdminToken(adminUserRow) {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) throw new Error("ADMIN_JWT_SECRET is not set.");
  // Deliberately minimal payload — uid/username only. Every permission
  // check re-reads the live row (see requireAdmin) rather than trusting
  // anything baked into the token itself.
  return jwt.sign({ uid: adminUserRow.id, username: adminUserRow.username }, secret, { expiresIn: TOKEN_TTL });
}

function getBearerToken(event) {
  const headers = event.headers || {};
  const raw = headers["authorization"] || headers["Authorization"] || "";
  const match = /^Bearer\s+(.+)$/i.exec(raw.trim());
  return match ? match[1] : null;
}

// need: "cms" | "prayers" | "master". "master" implies full access
// regardless of the individual access_cms/access_prayers flags — a
// master account can always reach everything.
async function requireAdmin(supabase, event, { need }) {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) {
    return { ok: false, statusCode: 500, error: "Admin login is not configured yet (missing ADMIN_JWT_SECRET)." };
  }

  const token = getBearerToken(event);
  if (!token) {
    return { ok: false, statusCode: 401, error: "Please log in again." };
  }

  let decoded;
  try {
    decoded = jwt.verify(token, secret);
  } catch (err) {
    return { ok: false, statusCode: 401, error: "Your session has expired. Please log in again." };
  }

  const { data: row, error } = await supabase
    .from("admin_users")
    .select("id, username, is_master, access_cms, access_prayers, active")
    .eq("id", decoded.uid)
    .maybeSingle();

  if (error) {
    console.error("[admin-auth] failed to load admin_users row:", error);
    return { ok: false, statusCode: 500, error: "Could not verify your login. Please try again." };
  }
  if (!row || !row.active) {
    return { ok: false, statusCode: 401, error: "This account no longer has access. Please contact the site administrator." };
  }

  const allowed = row.is_master
    || (need === "cms" && row.access_cms)
    || (need === "prayers" && row.access_prayers)
    || false;

  if (!allowed) {
    return { ok: false, statusCode: 403, error: "Your account doesn't have access to this section." };
  }

  return { ok: true, user: row };
}

module.exports = { signAdminToken, requireAdmin, getBearerToken, TOKEN_TTL };
