// Cloudflare Pages Function: POST /api/subscribe
// Adds a subscriber as a Resend contact and sends a welcome email with a
// working unsubscribe link (HMAC token + List-Unsubscribe headers, RFC 8058).
//
// Required env (Cloudflare Pages -> Settings -> Environment variables; secrets):
//   RESEND_API_KEY      Full-access key (managing contacts needs more than send-only)
//   UNSUBSCRIBE_SECRET  any long random string, used to sign unsubscribe links
// Optional:
//   NEWSLETTER_FROM     defaults to "Faiz Ahmed Farooqui <newsletter@faizahmed.in>"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const enc = new TextEncoder();

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const esc = (s) =>
  s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]),
  );

async function signEmail(email, secret) {
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(email.toLowerCase()));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function onRequestPost({ request, env }) {
  try {
    if (!env.RESEND_API_KEY) {
      return json({ error: "Newsletter is not configured." }, 500);
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return json({ error: "Invalid request." }, 400);
    }

    const email = String(payload?.email || "").trim().toLowerCase();
    const name = String(payload?.name || "").trim().slice(0, 100);

    if (!EMAIL_RE.test(email)) {
      return json({ error: "Please enter a valid email address." }, 400);
    }

    const headers = {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    };
    const from = env.NEWSLETTER_FROM || "Faiz Ahmed Farooqui <newsletter@faizahmed.in>";

    // 1) Create the contact. 409/422 means already-exists -> treat as success.
    const addRes = await fetch("https://api.resend.com/contacts", {
      method: "POST",
      headers,
      body: JSON.stringify({ email, first_name: name || undefined, unsubscribed: false }),
    });

    if (!addRes.ok && addRes.status !== 409 && addRes.status !== 422) {
      // Status only, no PII, no body. (Not 502/504: Cloudflare masks those.)
      console.log(`subscribe: resend /contacts -> ${addRes.status}`);
      return json({ error: "Could not subscribe right now. Please try again." }, 500);
    }

    // 2) Welcome email with an unsubscribe link (best-effort; never fails subscribe).
    let unsubUrl = null;
    if (env.UNSUBSCRIBE_SECRET) {
      const origin = new URL(request.url).origin;
      const token = await signEmail(email, env.UNSUBSCRIBE_SECRET);
      unsubUrl = `${origin}/api/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`;
    }

    const emailBody = {
      from,
      to: email,
      subject: "You're subscribed to faizahmed.in",
      html: `<p>Hi ${name ? esc(name) : "there"},</p>
<p>Thanks for subscribing. You'll get an email when I publish a new post on
<a href="https://faizahmed.in">faizahmed.in</a>, and nothing else.</p>
<p>If this wasn't you, you can safely ignore this email.</p>${
        unsubUrl
          ? `\n<p style="color:#888;font-size:12px">Don't want these? <a href="${unsubUrl}">Unsubscribe</a>.</p>`
          : ""
      }`,
    };
    if (unsubUrl) {
      emailBody.headers = {
        "List-Unsubscribe": `<${unsubUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      };
    }

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers,
      body: JSON.stringify(emailBody),
    }).catch(() => {});

    return json({ message: "You're subscribed. Check your inbox." });
  } catch {
    return json({ error: "Subscription failed unexpectedly. Please try again." }, 500);
  }
}
