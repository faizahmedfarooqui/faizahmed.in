# faizahmed.in

Astro site that hosts the profile + all blog posts, replacing Hashnode. Built to
serve the same content on both `faizahmed.in` and `blog.faizahmed.in` so the
SEO-ranked post URLs (`blog.faizahmed.in/<slug>`) keep working with a `200`, not
a redirect.

## Commands

```bash
npm install
npm run dev      # local dev (note: ⌘K search needs a full build)
npm run build    # astro build + pagefind search index
npm run preview  # preview the production build
```

## Importing posts from the Hashnode export

The content process drops Hashnode-exported `.md` files somewhere. Bring them in:

```bash
node scripts/import-posts.mjs /path/to/hashnode-export
```

This strips the repeated "About Me" footer, ensures a `series:` field exists,
downloads your own uploaded images (cdn.hashnode.com `/image/upload/`) into each
post folder, and leaves Unsplash images hot-linked.

## Content model

Posts live in `src/content/blog/<slug>/index.md`, colocated with their images.
Frontmatter (see `src/content/config.ts`):

```yaml
title: "..."
datePublished: Mon Jun 13 2022 09:14:14 GMT+0000 (Coordinated Universal Time)
slug: my-post-slug          # becomes /my-post-slug (the SEO URL)
cover: https://...           # optional
tags: a, b, c, d
series: encryption           # or null
```

## How SEO is preserved

- Every page sets `<link rel="canonical">` to `https://blog.faizahmed.in/<path>`
  (see `src/components/BaseHead.astro`), so search engines keep crediting the
  ranked URL even though `faizahmed.in/<slug>` serves identical content.
- `sitemap-index.xml` (via `@astrojs/sitemap`), `rss.xml`, and an allow-all
  `robots.txt` are generated on build.
- Open Graph + Twitter card tags per page.

## Cloudflare Pages — two domains, one project

1. Connect this repo to a Cloudflare Pages project.
   Build command: `npm run build`  ·  Output dir: `dist`.
2. In the project's **Custom domains**, add BOTH `faizahmed.in` and
   `blog.faizahmed.in`. Both serve the same build — no redirect between them.
3. Remove the old Hashnode CNAME for `blog.faizahmed.in` and point it at the
   Pages project. Keep the existing `faizahmed.in` DNS pointed at Pages too.

## Features

- Ubuntu Mono, auto + manual light/dark toggle.
- ⌘K / Ctrl+K search (Pagefind, built into the production output).
- Series + tag pages, archive, read-time.
- Shiki code highlighting + client-side Mermaid diagrams.
- GA4 (`G-3SZKBFTZH7`), production-only.
