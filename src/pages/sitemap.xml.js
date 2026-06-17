import { getPosts, postSlug } from "../lib/posts";
import { SERIES, CANONICAL_ORIGIN } from "../consts";

// A single sitemap.xml (not the sitemap-index.xml + sitemap-0.xml split that
// @astrojs/sitemap produces). The site is well under the 50k-URL limit, so one
// file is simpler and is what crawlers expect at /sitemap.xml. URLs use the
// CANONICAL origin (faizahmed.in) to match `<link rel="canonical">`.
export async function GET() {
  const posts = await getPosts();

  // loc -> optional YYYY-MM-DD lastmod. Set keeps it de-duplicated.
  const entries = new Map();
  const add = (path, lastmod) => entries.set(path, lastmod ?? entries.get(path));

  for (const p of ["/", "/about", "/uses", "/now", "/archive", "/bolt"]) add(p);

  for (const post of posts) {
    add(`/${postSlug(post)}`, post.data.datePublished.toISOString().slice(0, 10));
  }

  const series = new Set(SERIES.map((s) => s.slug));
  const tags = new Set();
  for (const post of posts) {
    if (post.data.series) series.add(post.data.series);
    for (const t of post.data.tags) tags.add(t);
  }
  for (const s of series) add(`/series/${encodeURIComponent(s)}`);
  for (const t of tags) add(`/tag/${encodeURIComponent(t)}`);

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...entries]
    .map(([loc, lastmod]) => {
      const tag = lastmod ? `<lastmod>${lastmod}</lastmod>` : "";
      return `  <url><loc>${CANONICAL_ORIGIN}${loc}</loc>${tag}</url>`;
    })
    .join("\n")}
</urlset>
`;

  return new Response(body, {
    headers: { "Content-Type": "application/xml" },
  });
}
