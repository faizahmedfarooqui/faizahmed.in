// Cloudflare Pages Function: first-party proxy for Umami Cloud.
//
// Ad/tracker blockers (and Brave Shields) block cloud.umami.is by name, dropping
// analytics — especially for a developer audience. Serving the script and the
// beacon from our OWN domain under /u makes them first-party, so they aren't
// blocked. The browser only ever talks to faizahmed.in; this function does the
// cross-origin hop to Umami server-side (not subject to the page CSP).
//
// Routes (matched by this catch-all under /u):
//   GET  /u/script.js   -> https://cloud.umami.is/script.js   (the tracker)
//   POST /u/api/send    -> https://gateway.umami.is/api/send  (the beacon)
//
// The tracker is told to use this proxy via data-host-url="https://faizahmed.in/u"
// in BaseLayout, so it posts to /u/api/send.

const SCRIPT_URL = "https://cloud.umami.is/script.js";
const COLLECT_URL = "https://gateway.umami.is/api/send";

export async function onRequest(context) {
  const { request } = context;
  const path = new URL(request.url).pathname.replace(/^\/u/, "");

  // Serve the tracker script (cached at the edge for a day).
  if (request.method === "GET" && (path === "/script.js" || path === "/")) {
    const upstream = await fetch(SCRIPT_URL, { cf: { cacheTtl: 86400, cacheEverything: true } });
    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": "public, max-age=86400",
      },
    });
  }

  // Forward the tracking beacon, preserving the real client IP + UA so Umami can
  // still derive country/device (it can't see the visitor directly anymore).
  if (request.method === "POST" && path === "/api/send") {
    const upstream = await fetch(COLLECT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": request.headers.get("user-agent") || "",
        "X-Forwarded-For": request.headers.get("cf-connecting-ip") || "",
        "Accept-Language": request.headers.get("accept-language") || "",
      },
      body: await request.text(),
    });
    return new Response(upstream.body, {
      status: upstream.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response("Not found", { status: 404 });
}
