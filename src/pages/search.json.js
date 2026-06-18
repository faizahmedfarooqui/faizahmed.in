import { getPosts, postSlug } from "../lib/posts";

// Static search index, built once and served as JSON. Works in dev and prod
// (unlike Pagefind, which only indexes after a full build).

// Non-post destinations that should also be reachable from the ⌘K palette.
// Tags drive matching (e.g. "feed" → RSS); `date` is unused for these.
const PAGES = [
  {
    title: "About",
    url: "/about",
    tags: ["about", "profile", "bio", "resume", "experience"],
    series: null,
    date: "",
    excerpt: "About Faiz Ahmed Farooqui — background, experience, and skills.",
  },
  {
    title: "Uses",
    url: "/uses",
    tags: ["uses", "tools", "stack", "setup", "gear"],
    series: null,
    date: "",
    excerpt: "The languages, tools, cloud, and infrastructure I work with.",
  },
  {
    title: "Now",
    url: "/now",
    tags: ["now", "current", "focus"],
    series: null,
    date: "",
    excerpt: "What I'm focused on right now.",
  },
  {
    title: "Privacy",
    url: "/privacy",
    tags: ["privacy", "cookies", "gdpr", "data"],
    series: null,
    date: "",
    excerpt: "How this site handles data: cookieless analytics, no tracking.",
  },
  {
    title: "RSS Feed",
    url: "/rss.xml",
    tags: ["rss", "feed", "subscribe", "atom"],
    series: null,
    date: "",
    excerpt: "Subscribe to new posts via the RSS feed.",
  },
  {
    title: "Sitemap",
    url: "/sitemap.xml",
    tags: ["sitemap", "seo", "index"],
    series: null,
    date: "",
    excerpt: "XML sitemap listing every page on the site.",
  },
];

export async function GET() {
  const posts = await getPosts();
  const data = posts.map((p) => ({
    title: p.data.title,
    url: `/${postSlug(p)}`,
    tags: p.data.tags,
    series: p.data.series,
    date: p.data.datePublished.toISOString(),
    excerpt: (p.body ?? "")
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/[#>*`_\[\]()!|-]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 220),
  }));
  return new Response(JSON.stringify([...PAGES, ...data]), {
    headers: { "Content-Type": "application/json" },
  });
}
