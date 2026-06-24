// Cloudflare Pages Function: POST /api/subscribe
// Adds a subscriber as a Resend contact and sends a welcome email.
//
// Resend now stores contacts at the account level (POST /contacts); the older
// per-audience endpoint and "Audiences" are deprecated in favour of Segments,
// so no audience ID is needed.
//
// Required env (Cloudflare Pages -> Settings -> Environment variables; set the
// API key as a SECRET, never in the repo):
//   RESEND_API_KEY   e.g. re_********
// Optional:
//   NEWSLETTER_FROM  defaults to "Faiz Ahmed Farooqui <newsletter@faizahmed.in>"
//
// Only onRequestPost is exported: non-POST methods get an automatic 405 from the
// Pages runtime, and every code path returns a Response so the function can never
// fall through to a Cloudflare 502.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

// Minimal escape so a subscriber-supplied name can't inject markup into the email.
const esc = (s) =>
  s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]),
  );

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

    // 1) Create the contact. A duplicate (already subscribed) is fine; treat the
    //    common "already exists" statuses as success so re-subscribing is harmless.
    const addRes = await fetch("https://api.resend.com/contacts", {
      method: "POST",
      headers,
      body: JSON.stringify({
        email,
        first_name: name || undefined,
        unsubscribed: false,
      }),
    });

    if (!addRes.ok && addRes.status !== 409 && addRes.status !== 422) {
      // Log Resend's exact response so the failure is visible in real-time logs.
      // (Avoid status 502/504 here: Cloudflare's edge replaces those with its own
      // error page, masking this JSON body.)
      const detail = await addRes.text().catch(() => "");
      console.log(`subscribe: resend /contacts -> ${addRes.status} ${detail}`.slice(0, 500));
      return json({ error: "Could not subscribe right now. Please try again." }, 500);
    }

    // 2) Send a welcome email. Best-effort: a failure here should not fail the
    //    subscribe, since the contact is already saved.
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers,
      body: JSON.stringify({
        from,
        to: email,
        subject: "You're subscribed to faizahmed.in",
        html: `<p>Hi ${name ? esc(name) : "there"},</p>
<p>Thanks for subscribing. You'll get an email when I publish a new post on
<a href="https://faizahmed.in">faizahmed.in</a>, and nothing else.</p>
<p>If this wasn't you, you can safely ignore this email.</p>`,
      }),
    }).catch(() => {});

    return json({ message: "You're subscribed. Check your inbox." });
  } catch {
    // Never crash into a Cloudflare 502; return a readable error instead.
    return json({ error: "Subscription failed unexpectedly. Please try again." }, 500);
  }
}
