import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// Matches the Hashnode export frontmatter. `series` sits below `tags` and is
// null when the post belongs to no series (per the content process convention).
// `datePublished` arrives as a JS Date string (e.g.
// "Mon Jun 13 2022 09:14:14 GMT+0000 ...") and is coerced to a Date.
const blog = defineCollection({
  // Content Layer API (Astro 6): each post is <slug>/index.md under the base.
  // The public URL still comes from the `slug` frontmatter (see postSlug()),
  // not the generated entry id.
  loader: glob({ pattern: "**/index.md", base: "./src/content/blog" }),
  // `image()` resolves the cover from a local path colocated with the post
  // (./cover.<ext>, downloaded by scripts/import-posts.mjs) and lets Astro
  // optimize it. Covers are self-hosted — no external image host.
  schema: ({ image }) =>
    z.object({
    title: z.string(),
    datePublished: z.coerce.date(),
    cuid: z.string().optional(),
    slug: z.string().optional(),
    // Optional hand-written SEO meta description. Falls back to excerpt(body).
    description: z.string().optional(),
    cover: image().optional().nullable(),
    tags: z
      .union([z.string(), z.array(z.string())])
      .optional()
      .transform((t) =>
        t == null
          ? []
          : Array.isArray(t)
            ? t
            : t.split(",").map((s) => s.trim()).filter(Boolean),
      ),
    series: z.string().nullable().optional().default(null),
    draft: z.boolean().optional().default(false),
  }),
});

export const collections = { blog };
