// ============================================================
// cms-push-send.js — Netlify Function (password-gated)
//
// Sends a push notification to every device that has enabled
// notifications on the site, triggered from the "Push Notifications"
// tab in cms.html. Uses the Web Push protocol (VAPID) via the
// "web-push" package — no third-party push service or extra cost,
// this talks directly to Apple/Google/Mozilla's own push servers.
//
// Request body: { title: "...", body: "...", url: "./index.html" }
//   (url is optional — where the app opens/focuses to when the
//   notification is tapped; defaults to the home screen.)
//
// Any subscription the push service reports as gone (the visitor
// uninstalled the app, cleared the browser, revoked permission, etc.
// — HTTP 404/410 from the push service) is removed automatically, so
// the subscriber count on the CMS stays accurate over time.
//
// Required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
// ADMIN_PASSWORD (all already set for the rest of the CMS), plus three
// new ones for this feature: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY,
// VAPID_SUBJECT (a "mailto:someone@example.com" contact address the
// push services may use to reach you if something's wrong — it is
// never shown to visitors).
// ============================================================
const webpush = require("web-push");
const { supabaseClient } = require("./_supabase");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST" && event.httpMethod !== "GET") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed." }) };
  }

  const suppliedPassword = event.headers["x-admin-password"] || event.headers["X-Admin-Password"] || "";
  if (!process.env.ADMIN_PASSWORD || suppliedPassword !== process.env.ADMIN_PASSWORD) {
    return { statusCode: 401, body: JSON.stringify({ error: "Incorrect password." }) };
  }

  const supabase = supabaseClient();
  if (!supabase) {
    return { statusCode: 500, body: JSON.stringify({ error: "Database is not configured yet." }) };
  }

  // GET is used by the CMS just to show "X devices subscribed" — no send.
  if (event.httpMethod === "GET") {
    const { count, error } = await supabase
      .from("push_subscriptions")
      .select("id", { count: "exact", head: true });
    if (error) {
      console.error("cms-push-send count failed:", error);
      return { statusCode: 500, body: JSON.stringify({ error: "Could not load subscriber count." }) };
    }
    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ok: true, count: count || 0 }) };
  }

  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY || !process.env.VAPID_SUBJECT) {
    return { statusCode: 500, body: JSON.stringify({ error: "Push notifications are not configured yet (missing VAPID keys)." }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body." }) };
  }

  const title = String(body.title || "").trim();
  const message = String(body.body || "").trim();
  const url = String(body.url || "./index.html").trim() || "./index.html";
  if (!title || !message) {
    return { statusCode: 400, body: JSON.stringify({ error: "Title and message are both required." }) };
  }

  webpush.setVapidDetails(process.env.VAPID_SUBJECT, process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);

  const { data: subs, error: loadError } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth");
  if (loadError) {
    console.error("cms-push-send load failed:", loadError);
    return { statusCode: 500, body: JSON.stringify({ error: "Could not load subscribers." }) };
  }

  if (!subs || !subs.length) {
    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ok: true, sent: 0, failed: 0, total: 0 }) };
  }

  const payload = JSON.stringify({ title, body: message, url });
  const deadEndpoints = [];
  let sent = 0, failed = 0;

  await Promise.all(subs.map(async (row) => {
    const subscription = { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } };
    try {
      await webpush.sendNotification(subscription, payload);
      sent++;
    } catch (err) {
      failed++;
      if (err && (err.statusCode === 404 || err.statusCode === 410)) {
        deadEndpoints.push(row.endpoint);
      } else {
        console.error("Push send failed for one subscriber:", err && err.message);
      }
    }
  }));

  if (deadEndpoints.length) {
    await supabase.from("push_subscriptions").delete().in("endpoint", deadEndpoints);
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ok: true, sent, failed, total: subs.length, removed: deadEndpoints.length })
  };
};
