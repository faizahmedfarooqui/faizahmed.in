import { defineCollection, z } from "astro:content";

// Matches the Hashnode export frontmatter. `series` sits below `tags` and is
// null when the post belongs to no series (per the content process convention).
// `datePublished` arrives as a JS Date string (e.g.
// "Mon Jun 13 2022 09:14:14 GMT+0000 ...") and is coerced to a Date.
const blog = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    datePublished: z.coerce.date(),
    cuid: z.string().optional(),
    slug: z.string().optional(),
    cover: z.string().url().optional().nullable(),
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
