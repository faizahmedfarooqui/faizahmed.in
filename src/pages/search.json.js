import { getPosts, postSlug } from "../lib/posts";

// Static search index, built once and served as JSON. Works in dev and prod
// (unlike Pagefind, which only indexes after a full build).
export async function GET() {
  const posts = await getPosts();
  const data = posts.map((p) => ({
    title: p.data.title,
    url: `/${postSlug(p)}`,
    tags: p.data.tags,
    series: p.data.series,
    date: p.data.datePublished.toISOString(),
    excerpt: p.body
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/[#>*`_\[\]()!|-]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 220),
  }));
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
}
