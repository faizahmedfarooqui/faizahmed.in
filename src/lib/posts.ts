import { getCollection, type CollectionEntry } from "astro:content";
import readingTime from "reading-time";

export type Post = CollectionEntry<"blog">;

// The public URL slug. Prefer explicit `slug` frontmatter (the SEO-ranked
// Hashnode slug); fall back to the entry id. Every post sets `slug`, so the
// fallback effectively never runs.
export function postSlug(post: Post): string {
  return post.data.slug ?? post.id;
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

// Plain-text excerpt from markdown body: drop code fences, images, and markdown
// punctuation (keeping link text). Adds an ellipsis when truncated.
export function excerpt(body: string, max = 200): string {
  const text = body
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#>*`_~|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? text.slice(0, max).trimEnd() + "…" : text;
}

export function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
