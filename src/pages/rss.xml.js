import rss from "@astrojs/rss";
import { getPosts, postSlug } from "../lib/posts";
import { CANONICAL_ORIGIN, SITE_TITLE, SITE_DESCRIPTION } from "../consts";

export async function GET() {
  const posts = await getPosts();
  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    // Feed items link to the canonical (SEO-ranked) blog host.
    site: CANONICAL_ORIGIN,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.datePublished,
      link: `/${postSlug(post)}`,
      categories: post.data.tags,
    })),
  });
}
