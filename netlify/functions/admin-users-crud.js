// ============================================================
// admin-users-crud.js — Netlify Function (master accounts only)
//
// Manage committee-member admin logins: create, edit access flags,
// reset a forgotten password, or remove an account. Every action
// requires the caller's own token to belong to an active master
// account (see _admin-auth.js) — a non-master admin gets a plain 403
// even if they somehow guess this endpoint's shape.
//
// Safety rule enforced on every action that could remove master
// status, deactivate, or delete a row: this can never leave the site
// with ZERO active master accounts. Losing the last master would mean
// nobody could ever create or fix an admin login again without
// direct database access — so that state is refused outright with a
// clear error, rather than allowed and discovered the hard way later.
//
// GET  ?action=list                       — every account (no password hashes)
// POST { action: "create", username, password, accessCms, accessPrayers, isMaster }
// POST { action: "update", id, accessCms, accessPrayers, isMaster, active }
// POST { action: "resetPassword", id, newPassword }
// POST { action: "delete", id }
//
// Required environment variables: SUPABASE_URL,
// SUPABASE_SERVICE_ROLE_KEY, ADMIN_JWT_SECRET (see _admin-auth.js).
// ============================================================
const bcrypt = require("bcryptjs");
const { supabaseClient } = require("./_supabase");
const { requireAdmin } = require("./_admin-auth");

const PUBLIC_COLUMNS = "id, username, is_master, access_cms, access_prayers, active, created_at, last_login_at";

async function countOtherActiveMasters(supabase, excludeId) {
  let query = supabase
    .from("admin_users")
    .select("id", { count: "exact", head: true })
    .eq("is_master", true)
    .eq("active", true);
  if (excludeId != null) query = query.neq("id", excludeId);
  const { count, error } = await query;
  if (error) throw error;
  return count || 0;
}

exports.handler = async (event) => {
  const supabase = supabaseClient();
  if (!supabase) {
    return { statusCode: 500, body: JSON.stringify({ error: "Database is not configured yet." }) };
  }

  const auth = await requireAdmin(supabase, event, { need: "master" });
  if (!auth.ok) {
    return { statusCode: auth.statusCode, body: JSON.stringify({ error: auth.error }) };
  }

  if (event.httpMethod === "GET") {
    const { data, error } = await supabase
      .from("admin_users")
      .select(PUBLIC_COLUMNS)
      .order("created_at", { ascending: true });
    if (error) {
      console.error("admin-users-crud list failed:", error);
      return { statusCode: 500, body: JSON.stringify({ error: "Could not load admin accounts." }) };
    }
    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ users: data }) };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed." }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body." }) };
  }

  try {
    if (body.action === "create") {
      const username = String(body.username || "").trim().toLowerCase();
      const password = String(body.password || "");
      if (!username || username.length < 3) {
        return { statusCode: 400, body: JSON.stringify({ error: "Username must be at least 3 characters." }) };
      }
      if (!/^[a-z0-9._-]+$/.test(username)) {
        return { statusCode: 400, body: JSON.stringify({ error: "Username can only contain letters, numbers, dots, dashes and underscores." }) };
      }
      if (password.length < 6) {
        return { statusCode: 400, body: JSON.stringify({ error: "Password must be at least 6 characters." }) };
      }

      const { data: dupe } = await supabase.from("admin_users").select("id").eq("username", username).maybeSingle();
      if (dupe) {
        return { statusCode: 409, body: JSON.stringify({ error: "That username is already taken." }) };
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const { data: created, error } = await supabase
        .from("admin_users")
        .insert({
          username, password_hash: passwordHash,
          is_master: !!body.isMaster,
          access_cms: body.accessCms !== false,
          access_prayers: body.accessPrayers !== false,
          active: true
        })
        .select(PUBLIC_COLUMNS)
        .single();
      if (error) throw error;
      return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user: created }) };
    }

    if (body.action === "update") {
      const id = Number(body.id);
      if (!id) return { statusCode: 400, body: JSON.stringify({ error: "Missing account id." }) };

      const { data: row, error: rowErr } = await supabase.from("admin_users").select("id, is_master, active").eq("id", id).maybeSingle();
      if (rowErr) throw rowErr;
      if (!row) return { statusCode: 404, body: JSON.stringify({ error: "Account not found." }) };

      const nextIsMaster = body.isMaster !== undefined ? !!body.isMaster : row.is_master;
      const nextActive = body.active !== undefined ? !!body.active : row.active;
      const losingMasterOrActive = (row.is_master && !nextIsMaster) || (row.active && !nextActive);
      if (losingMasterOrActive) {
        const others = await countOtherActiveMasters(supabase, id);
        if (others === 0) {
          return { statusCode: 400, body: JSON.stringify({ error: "You can't remove master access or disable the only active master account. Create or promote another master first." }) };
        }
      }

      const patch = {};
      if (body.accessCms !== undefined) patch.access_cms = !!body.accessCms;
      if (body.accessPrayers !== undefined) patch.access_prayers = !!body.accessPrayers;
      if (body.isMaster !== undefined) patch.is_master = !!body.isMaster;
      if (body.active !== undefined) patch.active = !!body.active;

      const { data: updated, error } = await supabase.from("admin_users").update(patch).eq("id", id).select(PUBLIC_COLUMNS).single();
      if (error) throw error;
      return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user: updated }) };
    }

    if (body.action === "resetPassword") {
      const id = Number(body.id);
      const newPassword = String(body.newPassword || "");
      if (!id) return { statusCode: 400, body: JSON.stringify({ error: "Missing account id." }) };
      if (newPassword.length < 6) return { statusCode: 400, body: JSON.stringify({ error: "Password must be at least 6 characters." }) };

      const passwordHash = await bcrypt.hash(newPassword, 10);
      const { error } = await supabase.from("admin_users").update({ password_hash: passwordHash }).eq("id", id);
      if (error) throw error;
      return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ok: true }) };
    }

    if (body.action === "delete") {
      const id = Number(body.id);
      if (!id) return { statusCode: 400, body: JSON.stringify({ error: "Missing account id." }) };

      const { data: row, error: rowErr } = await supabase.from("admin_users").select("id, is_master, active").eq("id", id).maybeSingle();
      if (rowErr) throw rowErr;
      if (!row) return { statusCode: 404, body: JSON.stringify({ error: "Account not found." }) };

      if (row.is_master && row.active) {
        const others = await countOtherActiveMasters(supabase, id);
        if (others === 0) {
          return { statusCode: 400, body: JSON.stringify({ error: "You can't delete the only active master account. Create or promote another master first." }) };
        }
      }

      const { error } = await supabase.from("admin_users").delete().eq("id", id);
      if (error) throw error;
      return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 400, body: JSON.stringify({ error: "Unknown action." }) };
  } catch (err) {
    console.error("admin-users-crud failed:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Request failed. Please try again." }) };
  }
};
