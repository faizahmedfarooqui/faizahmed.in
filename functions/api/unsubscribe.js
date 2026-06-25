// Cloudflare Pages Function: /api/unsubscribe?email=<email>&token=<hmac>
//
// GET  -> a confirmation page with a one-click button (avoids link-prefetchers
//         accidentally unsubscribing someone).
// POST -> performs the unsubscribe (used by both the confirm button and the
//         RFC 8058 List-Unsubscribe one-click header), marks the Resend contact
//         unsubscribed, returns 200.
//
// The token is HMAC-SHA256(email) so only links we generated are valid.
//
// Required env: RESEND_API_KEY (full access), UNSUBSCRIBE_SECRET (any long random string).

const enc = new TextEncoder();

async function signEmail(email, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(email.toLowerCase()));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function tokenValid(email, token, secret) {
  if (!email || !token) return false;
  const expected = await signEmail(email, secret);
  // constant-ish time compare
  if (expected.length !== token.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ token.charCodeAt(i);
  return diff === 0;
}

async function markUnsubscribed(email, env) {
  const res = await fetch(`https://api.resend.com/contacts/${encodeURIComponent(email)}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ unsubscribed: true }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.log(`unsubscribe: resend PATCH -> ${res.status} ${detail}`.slice(0, 300));
  }
  return res.ok;
}

function page(title, body, status = 200) {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${title} · faizahmed.in</title>
<style>
  body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0f1115;color:#e6e8ea;
       font-family:'Ubuntu Mono',ui-monospace,monospace;padding:1.5rem}
  .card{max-width:30rem;text-align:center}
  h1{font-size:1.4rem;margin:0 0 .6rem}
  p{color:#a0a4ab;line-height:1.5}
  a,button{color:#0f1115;background:#1d9e75;border:none;border-radius:8px;padding:.6rem 1rem;
           font:inherit;font-weight:700;cursor:pointer;text-decoration:none;display:inline-block;margin-top:1rem}
  .muted{background:none;color:#5dcaa5;padding:0;font-weight:400}
</style></head><body><div class="card">${body}</div></body></html>`;
  return new Response(html, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const email = (url.searchParams.get("email") || "").trim().toLowerCase();
  const token = url.searchParams.get("token") || "";

  if (!env.UNSUBSCRIBE_SECRET || !env.RESEND_API_KEY) {
    return page("Unavailable", "<h1>Unsubscribe is not configured</h1><p>Please email me to be removed.</p>", 500);
  }
  if (!(await tokenValid(email, token, env.UNSUBSCRIBE_SECRET))) {
    return page("Invalid link", "<h1>This unsubscribe link is invalid</h1><p>It may be malformed. Email me and I'll remove you.</p>", 400);
  }

  // Confirm via a POST button so prefetchers can't unsubscribe by merely loading the URL.
  return page(
    "Unsubscribe",
    `<h1>Unsubscribe from faizahmed.in?</h1>
     <p>You'll stop getting new-post emails. This can't be undone from here, but you can always resubscribe.</p>
     <form method="POST"><button type="submit">Confirm unsubscribe</button></form>`,
  );
}

export async function onRequestPost({ request, env }) {
  const url = new URL(request.url);
  const email = (url.searchParams.get("email") || "").trim().toLowerCase();
  const token = url.searchParams.get("token") || "";

  if (
    env.UNSUBSCRIBE_SECRET &&
    env.RESEND_API_KEY &&
    (await tokenValid(email, token, env.UNSUBSCRIBE_SECRET))
  ) {
    await markUnsubscribed(email, env);
  }
  // Always 200 for one-click clients (and don't reveal token validity).
  return page("Unsubscribed", "<h1>You're unsubscribed</h1><p>You won't receive any more emails from faizahmed.in.</p>");
}
