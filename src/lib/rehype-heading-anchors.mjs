import { visit } from "unist-util-visit";
import GithubSlugger from "github-slugger";

// Appends a clickable "#" anchor to each h2–h4 so readers can link to / scroll
// to a section. Reuses the heading's existing slug id (added by Astro); falls
// back to generating one with the same slugger Astro uses, so the ids always
// match the table-of-contents links built from post.render()'s `headings`.
const HEADINGS = new Set(["h2", "h3", "h4"]);

function textOf(node) {
  if (node.type === "text") return node.value;
  if (Array.isArray(node.children)) return node.children.map(textOf).join("");
  return "";
}

export function rehypeHeadingAnchors() {
  return (tree) => {
    const slugger = new GithubSlugger();
    visit(tree, "element", (node) => {
      if (!HEADINGS.has(node.tagName)) return;
      node.properties = node.properties || {};
      let id = node.properties.id;
      if (!id) {
        id = slugger.slug(textOf(node));
        node.properties.id = id;
      }
      node.properties.className = [
        ...(Array.isArray(node.properties.className)
          ? node.properties.className
          : []),
        "heading",
      ];
      // No text child — the "#" glyph is drawn via CSS (.heading-anchor::before)
      // so it never leaks into the heading text that Astro extracts for the TOC.
      node.children.push({
        type: "element",
        tagName: "a",
        properties: {
          href: `#${id}`,
          className: ["heading-anchor"],
          ariaHidden: "true",
          tabIndex: -1,
        },
        children: [],
      });
    });
  };
}
