---
title: "The Build Log: Rebuilding My Blog on Astro, Cloudflare Pages & Umami"
datePublished: 2026-06-20 12:00:00 GMT+0000 (Coordinated Universal Time)
slug: building-this-blog-astro-cloudflare-umami
cover: ./cover.jpg
tags: astro, cloudflare, jamstack, self-hosting, umami, view-transitions, mermaid, seo
series: null
---

I already wrote about [*why* I left Hashnode](/moving-off-hashnode-self-hosting-everything).
This is the other half: *how* the replacement actually works. Every meaningful
decision, the code behind it, and the bugs that cost me an afternoon — so future-me
(and anyone rebuilding their own site) doesn't relearn them.

The whole thing is an [Astro](https://astro.build) site in a Git repo: profile and
blog on one domain, built to static HTML, served from Cloudflare Pages, with cookieless
analytics I host myself. No platform lock-in, no CDN I don't control.

## The principles

Everything below falls out of four rules I set up front:

1. **Don't break the SEO.** My posts have ranked for years. The migration had to be lossless.
2. **Own the assets.** No hot-linking images or fonts from someone else's CDN.
3. **Ship almost no JavaScript.** Static pages, a few small scripts, nothing more.
4. **Stay free and private.** No per-seat SaaS, no cookies, no consent banner.

## Content model

Posts are Markdown files, one folder per post, images colocated:

```
src/content/blog/<slug>/index.md
```

The collection uses Astro's Content Layer with a Zod schema. The important detail is
the public URL: it comes from a `slug` frontmatter field, **not** the folder name —
because the slug has to match the old Hashnode URL exactly.

```yaml
title: "..."
datePublished: Mon Jun 13 2022 09:14:14 GMT+0000 (...)
slug: my-post-slug      # becomes /my-post-slug — the ranked URL
cover: ./cover.jpg      # local, optional
tags: a, b, c
series: encryption      # or null
```

Migration was a script. Hashnode's export gave me Markdown with their CDN image URLs;
I wrote `import-posts.mjs` to pull every post in, strip the repeated "About Me"
footer, ensure a `series:` field, and **download every remote image into the post
folder** so nothing points at `cdn.hashnode.com` anymore. A second pass,
`optimize-images.mjs`, downsizes them with `sharp`.

## Preserving SEO on the cutover

This was the part I refused to get wrong. Two pieces:

**Canonical URLs.** Every page declares its canonical on the apex host, driven by one constant:

```ts
const canonical = new URL(canonicalPath, CANONICAL_ORIGIN).href; // https://faizahmed.in/...
```

**Path-preserved redirects.** The old `blog.faizahmed.in/<slug>` URLs now `301` to
`faizahmed.in/<slug>` via a Cloudflare Redirect Rule — path preserved, so every ranked
slug maps 1:1. Because I kept posts at the root (no `/blog/` prefix) and kept the exact
slugs, the redirect is lossless and the ranking signal consolidates onto one host.

Then `sitemap.xml`, per-topic RSS feeds, JSON-LD (`BlogPosting`, `Person`, `WebSite`),
and an allow-all `robots.txt`.

## The bug that haunted returning visitors

My old Gatsby site had registered a service worker (`gatsby-plugin-offline`). That
worker was *still installed in every returning visitor's browser*, happily serving the
old cached site — even after I'd changed everything. A hard refresh doesn't help,
because the worker sits in front of the network.

The fix is a kill-switch service worker at the same path that unregisters itself:

```js
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) await caches.delete(key);
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: "window" });
    for (const c of clients) c.navigate(c.url);
  })());
});
```

Served with `Cache-Control: no-cache` so browsers always re-fetch it. On a stuck
visitor's next visit, it wipes the old caches, unregisters, and reloads them onto the
live site — no action on their end.

## Search with no backend

⌘K search is a static JSON index (`/search.json`) built at deploy time, filtered
client-side over title, tags, series, and an excerpt. No server, works in dev and prod.

The gotcha: I inject result rows with `innerHTML`, and **Astro's scoped styles don't
apply to nodes created that way** — they don't get the scoping attribute. The fix was
moving the result-row CSS into a `<style is:global>` block. (This bites you again with
any JS-generated DOM — keep it in mind.)

## Diagrams: Mermaid, and a render bug

Posts render Mermaid diagrams client-side. My first version used Mermaid's
`startOnLoad`, and diagrams silently refused to render. The cause: I import Mermaid
asynchronously, so by the time it initializes the `load` event has already fired and
`startOnLoad` never triggers. The fix is to render explicitly:

```js
const { default: mermaid } = await import(mermaidUrl);
mermaid.initialize({ startOnLoad: false, theme });
await mermaid.run({ querySelector: "pre.mermaid:not([data-processed])" });
```

I also added a full-screen **click-to-zoom** viewer (scroll/pinch to zoom, drag to
pan) because a wide sequence diagram crammed into a text column is unreadable.

## Tag hygiene

The import dragged in **220 tags across ~90 posts** — mostly single-use, plus
spelling duplicates (`ci-cd` vs `cicd`, `pci-dss` vs `pcidss`). That's a pile of thin,
near-duplicate pages search engines hate. Two fixes:

- A `consolidate-tags.mjs` script with a `MERGE` map rewrites variant spellings to one
  canonical tag, and removed slugs `301` to their canonical.
- Tag pages with fewer than 2 posts get `noindex, follow` and are dropped from the
  sitemap — still navigable, no thin-content drag.

## Analytics that actually counts

I run [Umami](https://umami.is) — cookieless, no consent banner. But there's a catch
for a developer audience: ad/tracker blockers (and Brave Shields) block known
analytics hosts by name, so a big chunk of *my* readers never get counted.

The fix is a **first-party proxy**. A Cloudflare Pages Function serves the tracker and
forwards the beacon under my own domain, so to the browser it's all `faizahmed.in`:

```js
// functions/u/[[path]].js
const SCRIPT = "https://cloud.umami.is/script.js";
const COLLECT = "https://gateway.umami.is/api/send";
export async function onRequest({ request }) {
  const path = new URL(request.url).pathname.replace(/^\/u/, "");
  if (path === "/script.js") return fetch(SCRIPT); // (cached, JS content-type)
  if (path === "/api/send")
    return fetch(COLLECT, { method: "POST", headers: { /* forward IP + UA */ }, body: await request.text() });
}
```

Because the browser only ever talks to my domain, I could also tighten the CSP back to
`connect-src 'self'`. And since I wanted to know what people click, a single delegated
handler fires a Umami event for every link — `internal-link`, `outbound-link`,
`email-link`, `tel-link` — with the URL and where it was clicked.

## View Transitions (and making scripts survive them)

I enabled Astro's View Transitions so navigation feels instant and I could show a
small loader on slow loads. The trap: with client-side navigation, scripts that attach
listeners *on load* stop working after the first navigation, because the DOM gets
swapped. The pattern that fixes it — re-initialize on every navigation, bind
document-level listeners only once:

```js
document.addEventListener("astro:page-load", () => {
  // bind listeners to the fresh elements here
});
```

`transition:persist` looked tempting for keeping the header's listeners alive, but it
**doesn't preserve script-attached listeners** on components — it cost me a round of
"why is the theme toggle dead." The `astro:page-load` re-init is the reliable way.

## The Safari afternoon: Rocket Loader

Then everything broke in Safari — toggle, search, dropdown, all dead — while Chrome was
fine. The culprit was **Cloudflare Rocket Loader**, an "optimization" that rewrites and
defers your `<script>` tags at the edge. On a modern ES-module + event setup it breaks
things, and Safari most of all. It was *also* the original reason Mermaid misbehaved.

There's no in-repo fix — Cloudflare generates the rewrite after your build — so it's a
dashboard toggle: **Speed → Optimization → Rocket Loader → Off.** Verify:

```bash
curl -s https://faizahmed.in/ | grep -c rocket-loader   # want 0
```

On a static site this lean, Rocket Loader does nothing useful and only breaks things. Off, permanently.

## GEO: optimizing for the AI engines too

SEO gets you ranked; GEO (Generative Engine Optimization) gets you *cited* by AI answer
engines. The cheapest high-leverage move is an [`llms.txt`](https://llmstxt.org) — a
curated, plain-text map of the site for LLMs. Mine is generated at build: a short bio,
the key pages, every series, and every post with a one-line description. Combined with
the allow-all `robots.txt`, clean JSON-LD, and semantic HTML, the site is easy for an
assistant to read and quote.

## What it adds up to

- Static Astro, zero UI framework, self-hosted fonts, locally-optimized images.
- One domain, lossless 301s, canonical consolidation — SEO intact.
- Cookieless, blocker-proof, free analytics I own.
- Client-side search, rendered diagrams with zoom, View Transitions + a loader.
- A tight CSP (`connect-src 'self'`), allow-all for crawlers and AI agents.

The biggest lesson? Most of my time didn't go into building features — it went into
the edge: a stale service worker, an "optimization" that broke Safari, scripts that
forgot to re-run after navigation. The platform you control is worth exactly these
afternoons.

It's all in a Git repo now. That was the whole point.
