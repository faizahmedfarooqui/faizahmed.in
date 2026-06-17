import rss from "@astrojs/rss";
import { getPosts, postSlug } from "../../../lib/posts";
import { CANONICAL_ORIGIN, SITE_TITLE, SERIES } from "../../../consts";

// Per-series feed at /series/<slug>/rss.xml — mirrors the series page set.
export async function getStaticPaths() {
  const posts = await getPosts();
  const slugs = new Set();
  for (const p of posts) if (p.data.series) slugs.add(p.data.series);
  for (const s of SERIES) slugs.add(s.slug);
  return [...slugs].map((series) => ({ params: { series } }));
}

export async function GET({ params }) {
  const { series } = params;
  const posts = (await getPosts()).filter((p) => p.data.series === series);
  const title = SERIES.find((s) => s.slug === series)?.title ?? series;
  return rss({
    title: `${title} · ${SITE_TITLE}`,
    description: `Posts in the ${title} series.`,
    site: CANONICAL_ORIGIN,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.datePublished,
      link: `/${postSlug(post)}`,
      categories: post.data.tags,
    })),
  });
}
