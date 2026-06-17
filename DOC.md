# DOC.md — how to run & maintain faizahmed.in

A practical guide for future-me. This is the Astro site for **`faizahmed.in`**
(profile + blog), deployed on Cloudflare Pages. The old **`blog.faizahmed.in/*`**
URLs now **301-redirect to `faizahmed.in/*`** (set up as a Cloudflare Redirect Rule),
so there's a single canonical host.

- **Stack:** Astro 6 (Content Layer API), pnpm, Node ≥ 22.12 (`.nvmrc` = 22).
- **No client framework** — pages ship zero JS bundles (only tiny inline scripts).
- **No external CDNs for assets** — all images and the font are self-hosted.

---

## Commands

```bash
pnpm dev          # local dev at http://localhost:4321
pnpm build        # production build -> dist/
pnpm preview      # serve the production build locally
pnpm astro sync   # regenerate content types (run if the editor flags content errors)
```

Scripts:

```bash
node scripts/import-posts.mjs <export-dir>   # import a Hashnode export (one-time/bulk)
node scripts/optimize-images.mjs             # downscale covers + body images
node scripts/gen-icons.mjs                   # regenerate favicons from public/favicon.svg
```

---

## Write a new blog post

**1. Create the file:**

```
src/content/blog/<your-slug>/index.md
```

Keep the folder name = the slug for tidiness (the URL actually comes from the
`slug:` frontmatter, not the folder).

**2. Add frontmatter** (schema: `src/content.config.ts`):

```yaml
---
title: "Your Post Title"
datePublished: 2026-06-20            # any parseable date; controls feed ordering
slug: your-post-slug                 # → /your-post-slug — must be UNIQUE
cover: ./cover.jpg                   # optional, local image; delete the line if none
tags: nodejs, aws, security          # comma string OR array; lowercase kebab-case
series: my-series                    # optional — a series slug; omit if standalone
draft: false                         # true = hidden in production (still visible in dev)
---

Your markdown content starts here…
```

| Field | Required | Notes |
|---|---|---|
| `title` | yes | If it contains `"`, use single quotes or escape: `\"`. |
| `datePublished` | yes | ISO (`2026-06-20`) or the long Hashnode form both work. |
| `slug` | recommended | The public URL. **Never change a published slug** — it breaks the ranked URL. |
| `cover` | no | Local `./cover.jpg` (optimized by `optimize-images.mjs`). Omit for no cover. |
| `tags` | no | Drives tag pages, tag feeds, and tool links (see below). |
| `series` | no | A series slug (see "Add a series"). |
| `draft` | no | Defaults to `false`. |
| `cuid` | no | Hashnode artifact; ignore for new posts. |

**3. Images (self-hosted — never hot-link a CDN):**

- **Cover:** drop `cover.jpg` in the post folder, set `cover: ./cover.jpg`.
- **Body images:** put them in the folder, reference `![alt](./image-1.png)`.
- After adding images, run `node scripts/optimize-images.mjs` (downscales covers to
  ≤1600px `cover.jpg` and resizes body images in place).

**4. Preview & build:**

```bash
pnpm dev      # check it at localhost:4321
pnpm build    # verify the production build is clean
```

The post then appears automatically in: the home feed (latest 4), `/archive`, the
RSS feed, the sitemap, the ⌘K search index, and each of its tag pages.

---

## Add a series

**Minimum** — just set `series: my-series` on the post(s). Everything derives from
posts automatically: the `/series/my-series` page, its RSS feed
(`/series/my-series/rss.xml`), the header **Series** dropdown, and the breadcrumb.
The dropdown will show a humanized title (`My Series`).

**Recommended** — give it a proper title + description by adding an entry to `SERIES`
in `src/consts.ts`:

```ts
export const SERIES = [
  // …existing…
  {
    title: "My Series",        // shown in the dropdown + series page heading
    slug: "my-series",         // MUST match the `series:` value on the posts
    description: "One-line summary of the series.",
  },
];
```

Dropdown order is by post count (most posts first) — not manually controlled.

---

## Tags

- Lowercase kebab-case (`api-gateway`, `nodejs`). Comma string or YAML array.
- Each tag gets a page (`/tag/<tag>`) and a feed (`/tag/<tag>/rss.xml`) automatically.
- **Tool/competency linking:** items on `/uses` and the About "Core competencies"
  block carry an optional `tag`. When a tag has at least one post, that item becomes
  an internal link to `/tag/<tag>`; otherwise it's plain text. So as you tag more
  posts, more tools "light up" with no code change. (See `USES`/`COMPETENCIES` in
  `consts.ts` and `src/components/TechLink.astro`.)

---

## Edit site content — it all lives in `src/consts.ts`

**Edit content here, not in components.**

| Const | Drives |
|---|---|
| `AUTHOR` | Name, bio, and the profile links (GitHub, LinkedIn, Website, Resume). |
| `EXPERIENCE` | "Where I work" rail in the homepage hero. |
| `SERIES` | Header dropdown titles/descriptions. |
| `FEATURED_REPOS` | "Featured work" on home + "Open source" on About. |
| `BOLT_VIDEOS` | The `/bolt` video series. |
| `USES` | The `/uses` page (`{ label, tag? }` items). |
| `COMPETENCIES` | About "Core competencies" (`{ label, tag? }` items). |
| `NOW` | The `/now` page — **keep `updated` + items fresh.** |
| `CAREER_START` | `yearsOfExperience()` — experience is computed, never hardcoded. |

**Open TODOs to fill in:** `USES` has `TODO:` placeholders for editor/terminal/OS,
and `/now` content should be refreshed periodically.

**Resume:** the Resume link points to `/resume.pdf` — keep `public/resume.pdf` current.

---

## Images, favicon, fonts

- **Covers / body images:** self-hosted in each post folder; `optimize-images.mjs`
  keeps them ≤1600px. Covers are rendered with `<Image>` and optimized to WebP.
- **Favicon:** edit `public/favicon.svg`, then run `node scripts/gen-icons.mjs` to
  regenerate the PNG set (`favicon-32`, `apple-touch-icon`, `icon-192/512`) used by
  `BaseHead` and `public/site.webmanifest`.
- **Font:** Ubuntu Mono, self-hosted via `@fontsource/ubuntu-mono` (imported in
  `BaseLayout.astro`). Do not re-add the Google Fonts `@import`.

---

## SEO (don't break these)

- **Canonical URLs** always point to `https://faizahmed.in/<path>` (`BaseHead.astro`,
  via `CANONICAL_ORIGIN`). `blog.faizahmed.in/*` 301-redirects here. Don't point
  canonical at the old `blog.` host (it would canonicalize to a redirecting URL).
- **Structured data (JSON-LD):** posts emit `BlogPosting` + `BreadcrumbList`; home
  emits `Person` + `WebSite`; `/about` emits `Person`. Pass via the `jsonLd` prop on
  `BaseLayout`.
- **Sitemap:** a single `/sitemap.xml` (custom endpoint `src/pages/sitemap.xml.js`);
  we don't use `@astrojs/sitemap`. Listed in `public/robots.txt`.
- **Feeds:** site-wide `/rss.xml` + per-series and per-tag feeds.

---

## Deploy

Cloudflare Pages builds from `main` and serves `dist/` on `faizahmed.in`. A
Cloudflare Redirect Rule 301s `blog.faizahmed.in/*` → `faizahmed.in/$1` (path +
query preserved) — keep that rule indefinitely. Pushing to `main` triggers a
production deploy.

```bash
git add -A
git commit -m "…"     # no Co-Authored-By trailer
git push origin main
```

---

## Gotchas

- Content config **must** be `src/content.config.ts` (Astro 6 rejects the old
  `src/content/config.ts` location).
- Markdown plugins are configured via `markdown.processor = unified({…})` from
  `@astrojs/markdown-remark` (Astro 6 deprecated the plain plugin arrays).
- `post.body` is `string | undefined` in the Content Layer — guard with `?? ""`.
- The importer downloads images full-size; **re-run `optimize-images.mjs` after any
  import.**
- Code fences: Shiki is case-sensitive and only knows real languages. Odd/legacy tags
  are mapped in `astro.config.mjs` `shikiConfig.langAlias` — add to it if a new one
  warns at build.
- Changing `astro.config.mjs` requires restarting `pnpm dev`.
- GitHub star counts (`src/lib/github.ts`) fetch at build (unauthenticated, 60/hr
  limit) and fall back to `fallbackStars` in `consts.ts`.
