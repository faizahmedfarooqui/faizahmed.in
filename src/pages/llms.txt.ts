import { getPosts, postSlug, excerpt } from "../lib/posts";
import { CANONICAL_ORIGIN, SITE_TITLE, SERIES, yearsOfExperience } from "../consts";

// llms.txt (https://llmstxt.org) — a curated, plain-text map of the site for
// LLMs / AI answer engines. Generated at build so it tracks new posts.
export async function GET() {
  const posts = await getPosts();
  const exp = yearsOfExperience();
  const u = (path: string) => `${CANONICAL_ORIGIN}${path}`;

  // All series that have posts, with curated title/description where available.
  const seriesCounts = new Map<string, number>();
  for (const p of posts) {
    if (p.data.series) seriesCounts.set(p.data.series, (seriesCounts.get(p.data.series) ?? 0) + 1);
  }
  const humanize = (s: string) =>
    s.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const lines: string[] = [];
  lines.push(`# ${SITE_TITLE}`);
  lines.push("");
  lines.push(
    `> Principal Backend Engineer in Bangalore, India with ${exp}+ years designing and scaling cloud-native, multi-tenant systems across fintech, healthcare, and SaaS. This is his technical blog and profile, covering Node.js, backend architecture, distributed systems, cloud (AWS, OpenStack), encryption, and security.`,
  );
  lines.push("");

  lines.push("## Pages");
  lines.push(`- [About](${u("/about")}): Background, experience, core competencies, and open-source work.`);
  lines.push(`- [Uses](${u("/uses")}): Languages, tools, cloud, and infrastructure used day to day.`);
  lines.push(`- [Now](${u("/now")}): What he's currently focused on.`);
  lines.push(`- [Bolt.SH](${u("/bolt")}): An OpenStack-powered IaaS data center he designed and built at GeekyAnts, with a walkthrough video series.`);
  lines.push(`- [Articles](${u("/archive")}): Complete index of every post, grouped by year.`);
  lines.push("");

  if (seriesCounts.size) {
    lines.push("## Series");
    for (const [slug, count] of [...seriesCounts.entries()].sort((a, b) => b[1] - a[1])) {
      const meta = SERIES.find((s) => s.slug === slug);
      const title = meta?.title ?? humanize(slug);
      const desc = meta?.description ?? `${count} ${count === 1 ? "post" : "posts"}.`;
      lines.push(`- [${title}](${u(`/series/${slug}`)}): ${desc}`);
    }
    lines.push("");
  }

  lines.push("## Posts");
  for (const p of posts) {
    lines.push(`- [${p.data.title}](${u(`/${postSlug(p)}`)}): ${excerpt(p.body ?? "", 140)}`);
  }
  lines.push("");

  lines.push("## Optional");
  lines.push(`- [RSS feed](${u("/rss.xml")}): Subscribe to new posts.`);
  lines.push(`- [Sitemap](${u("/sitemap.xml")}): All indexed URLs.`);
  lines.push("");

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
