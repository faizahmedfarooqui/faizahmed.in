import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { remarkMermaid } from "./src/lib/remark-mermaid.mjs";
import { rehypeExternalLinks } from "./src/lib/rehype-external-links.mjs";
import { SITE_ORIGIN } from "./src/consts.ts";

// https://astro.build/config
export default defineConfig({
  site: SITE_ORIGIN,
  trailingSlash: "ignore",
  integrations: [sitemap()],
  markdown: {
    remarkPlugins: [remarkMermaid],
    rehypePlugins: [rehypeExternalLinks],
    shikiConfig: {
      // Dual themes: Shiki emits CSS vars so code adapts to light/dark.
      themes: {
        light: "github-light",
        dark: "github-dark",
      },
      wrap: true,
    },
  },
});
