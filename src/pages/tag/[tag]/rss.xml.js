import rss from "@astrojs/rss";
import { getPosts, postSlug } from "../../../lib/posts";
import { CANONICAL_ORIGIN, SITE_TITLE } from "../../../consts";

// Per-tag feed at /tag/<tag>/rss.xml — mirrors the tag page set.
export async function getStaticPaths() {
  const posts = await getPosts();
  const tags = new Set();
  for (const p of posts) for (const t of p.data.tags) tags.add(t);
  return [...tags].map((tag) => ({ params: { tag } }));
}

export async function GET({ params }) {
  const { tag } = params;
  const posts = (await getPosts()).filter((p) => p.data.tags.includes(tag));
  return rss({
    title: `#${tag} · ${SITE_TITLE}`,
    description: `Posts tagged ${tag}.`,
    site: CANONICAL_ORIGIN,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.datePublished,
      link: `/${postSlug(post)}`,
      categories: post.data.tags,
    })),
  });
}
