import { visit } from "unist-util-visit";

// Each post page already has one <h1> — the title, rendered by [slug].astro.
// Many imported Hashnode posts also use `#` (h1) for their section headings,
// producing multiple <h1>s per page (bad for SEO + a11y). If a post's body
// contains any h1, demote every heading in that body by one level (h1->h2,
// h2->h3, …) so the title stays the only <h1>. Posts that already start at
// `##` have no body h1 and are left untouched — no visual change for them.
export function remarkDemoteHeadings() {
  return (tree) => {
    let hasH1 = false;
    visit(tree, "heading", (node) => {
      if (node.depth === 1) hasH1 = true;
    });
    if (!hasH1) return;
    visit(tree, "heading", (node) => {
      if (node.depth < 6) node.depth += 1;
    });
  };
}
