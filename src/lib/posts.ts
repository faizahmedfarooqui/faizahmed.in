import { getCollection, type CollectionEntry } from "astro:content";
import readingTime from "reading-time";

export type Post = CollectionEntry<"blog">;

// The public URL slug. Prefer explicit `slug` frontmatter (the SEO-ranked
// Hashnode slug); fall back to the entry folder name.
export function postSlug(post: Post): string {
  return post.data.slug ?? post.slug;
}

// All published posts, newest first.
export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection(
    "blog",
    ({ data }) => import.meta.env.PROD ? !data.draft : true,
  );
  return posts.sort(
    (a, b) => b.data.datePublished.valueOf() - a.data.datePublished.valueOf(),
  );
}

export function readMinutes(body: string): number {
  return Math.max(1, Math.round(readingTime(body).minutes));
}

export function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
