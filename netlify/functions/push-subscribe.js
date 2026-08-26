// ============================================================
// push-subscribe.js — Netlify Function (public, no password)
//
// Called from script.js when a visitor taps the bell button in the
// top bar to turn notifications on or off on their own device. This
// is intentionally public (like the rest of the site's read-side) —
// it only ever stores/removes an anonymous browser push endpoint,
// never anything personal, and there's nothing here an attacker
// could do beyond adding/removing a subscription they already
// control on their own device.
//
// Request body:
//   Subscribe:   { endpoint: "...", keys: { p256dh: "...", auth: "..." } }
//                (this is exactly what PushSubscription.toJSON() gives you)
//   Unsubscribe: { action: "unsubscribe", endpoint: "..." }
//
// Required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
// ============================================================
const { supabaseClient } = require("./_supabase");

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

  const supabase = supabaseClient();
  if (!supabase) {
    return { statusCode: 500, body: JSON.stringify({ error: "Database is not configured yet." }) };
  }

  if (body.action === "unsubscribe") {
    const endpoint = String(body.endpoint || "");
    if (!endpoint) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing endpoint." }) };
    }
    const { error } = await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
    if (error) {
      console.error("push-subscribe unsubscribe failed:", error);
      return { statusCode: 500, body: JSON.stringify({ error: "Could not unsubscribe." }) };
    }
    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ok: true }) };
  }

  const endpoint = String(body.endpoint || "");
  const p256dh = body.keys && body.keys.p256dh;
  const auth = body.keys && body.keys.auth;
  if (!endpoint || !p256dh || !auth) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing/invalid subscription." }) };
  }

  const { error } = await supabase
    .from("push_subscriptions")
    .upsert({ endpoint, p256dh, auth }, { onConflict: "endpoint" });

  if (error) {
    console.error("push-subscribe save failed:", error);
    return { statusCode: 500, body: JSON.stringify({ error: "Could not save subscription." }) };
  }

  return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ok: true }) };
};
