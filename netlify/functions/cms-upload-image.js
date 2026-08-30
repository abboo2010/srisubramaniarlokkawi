// ============================================================
// cms-upload-image.js — Netlify Function (password-gated)
//
// Uploads one image (Hero Banner background, a Gallery photo, or a
// Deity photo) to the public "temple-media" Supabase Storage bucket
// and returns its public URL, which the CMS then saves onto the
// relevant row via cms-crud.js. Runs entirely server-side with the
// service_role key — the browser never gets storage write access.
//
// Request body: { folder: "hero" | "gallery" | "deities",
//                  filename: "my-photo.jpg",
//                  dataUrl: "data:image/jpeg;base64,...." }
//
// Netlify's synchronous functions cap the request body around 6MB,
// and base64 inflates a file's size by about a third, so this
// rejects anything that would decode to more than ~4MB — cms.html
// resizes/compresses photos in the browser before sending them, so
// in normal use this limit is rarely hit.
//
// Gated by an individual admin login with Content (/cms.html) access
// — see netlify/functions/_admin-auth.js — rather than the old shared
// ADMIN_PASSWORD.
//
// Required environment variables: SUPABASE_URL,
// SUPABASE_SERVICE_ROLE_KEY, ADMIN_JWT_SECRET (see _admin-auth.js).
// ============================================================
const { supabaseClient } = require("./_supabase");
const { requireAdmin } = require("./_admin-auth");

const ALLOWED_FOLDERS = ["hero", "gallery", "deities"];
const MAX_BYTES = 4 * 1024 * 1024;

function safeFilename(name) {
  const base = String(name || "photo").replace(/[^a-zA-Z0-9._-]/g, "-").slice(-80);
  return base || "photo";
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed." }) };
  }

  const supabase = supabaseClient();
  if (!supabase) {
    return { statusCode: 500, body: JSON.stringify({ error: "Database is not configured yet." }) };
  }
  const auth = await requireAdmin(supabase, event, { need: "cms" });
  if (!auth.ok) {
    return { statusCode: auth.statusCode, body: JSON.stringify({ error: auth.error }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body." }) };
  }

  const folder = ALLOWED_FOLDERS.includes(body.folder) ? body.folder : null;
  const match = /^data:([^;]+);base64,(.*)$/.exec(body.dataUrl || "");
  if (!folder || !match) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing/invalid folder or image data." }) };
  }

  const contentType = match[1];
  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length > MAX_BYTES) {
    return { statusCode: 400, body: JSON.stringify({ error: "Image is too large (max ~4MB). Please resize and try again." }) };
  }

  const path = `${folder}/${Date.now()}-${safeFilename(body.filename)}`;

  try {
    const { error: uploadError } = await supabase.storage.from("temple-media").upload(path, buffer, { contentType, upsert: true });
    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("temple-media").getPublicUrl(path);
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true, url: data.publicUrl })
    };
  } catch (err) {
    console.error("Image upload failed:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Upload failed." }) };
  }
};
