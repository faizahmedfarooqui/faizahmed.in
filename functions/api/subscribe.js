// Cloudflare Pages Function: POST /api/subscribe
// Adds a subscriber as a Resend contact and sends a welcome email with a
// working unsubscribe link (HMAC token + List-Unsubscribe headers, RFC 8058).
//
// Abuse hardening:
//   - honeypot field ("company"): if filled, silently no-op (likely a bot)
//   - Cloudflare Turnstile: verified when TURNSTILE_SECRET_KEY is set
//   - welcome email is skipped for already-existing contacts (anti-harassment)
//
// Required env (Cloudflare Pages -> Settings -> Environment variables; secrets):
//   RESEND_API_KEY       Full-access key (managing contacts needs more than send-only)
//   UNSUBSCRIBE_SECRET   any long random string, used to sign unsubscribe links
// Optional:
//   TURNSTILE_SECRET_KEY when set, a valid Turnstile token is required
//   NEWSLETTER_FROM      defaults to "Faiz Ahmed Farooqui <newsletter@faizahmed.in>"

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

async function turnstileOk(token, secret, ip) {
  if (!token) return false;
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret, response: token, remoteip: ip || "" }),
  }).catch(() => null);
  if (!res) return false;
  const out = await res.json().catch(() => ({ success: false }));
  return out.success === true;
}

// Best-effort welcome email for brand-new subscribers, with an unsubscribe link.
async function sendWelcome({ email, name, headers, from, origin, unsubscribeSecret }) {
  let unsubUrl = null;
  if (unsubscribeSecret) {
    const token = await signEmail(email, unsubscribeSecret);
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

    // Honeypot: real users never fill this. Pretend success, do nothing.
    if (String(payload?.company || "").trim() !== "") {
      return json({ message: "You're subscribed. Check your inbox." });
    }

    const email = String(payload?.email || "").trim().toLowerCase();
    const name = String(payload?.name || "").trim().slice(0, 100);

    if (!EMAIL_RE.test(email)) {
      return json({ error: "Please enter a valid email address." }, 400);
    }

    // Bot check (only enforced once the secret is configured).
    if (env.TURNSTILE_SECRET_KEY) {
      const ok = await turnstileOk(
        String(payload?.turnstileToken || ""),
        env.TURNSTILE_SECRET_KEY,
        request.headers.get("CF-Connecting-IP"),
      );
      if (!ok) return json({ error: "Bot check failed. Please try again." }, 400);
    }

    const headers = {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    };
    const from = env.NEWSLETTER_FROM || "Faiz Ahmed Farooqui <newsletter@faizahmed.in>";

    // Create the contact. 409/422 means already-exists.
    const addRes = await fetch("https://api.resend.com/contacts", {
      method: "POST",
      headers,
      body: JSON.stringify({ email, first_name: name || undefined, unsubscribed: false }),
    });

    const alreadyExisted = addRes.status === 409 || addRes.status === 422;
    if (!addRes.ok && !alreadyExisted) {
      console.log(`subscribe: resend /contacts -> ${addRes.status}`); // status only, no PII
      return json({ error: "Could not subscribe right now. Please try again." }, 500);
    }

    if (!alreadyExisted) {
      await sendWelcome({
        email,
        name,
        headers,
        from,
        origin: new URL(request.url).origin,
        unsubscribeSecret: env.UNSUBSCRIBE_SECRET,
      });
    }

    return json({
      message: alreadyExisted
        ? "You're already subscribed."
        : "You're subscribed. Check your inbox.",
    });
  } catch {
    return json({ error: "Subscription failed unexpectedly. Please try again." }, 500);
  }
}
