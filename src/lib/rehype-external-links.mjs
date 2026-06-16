import { visit } from "unist-util-visit";

// Any link in post content that points off-site (http/https and not a
// faizahmed.in host) opens in a new tab with safe rel attributes. Internal
// and relative links are left untouched.
export function rehypeExternalLinks() {
  return (tree) => {
    visit(tree, "element", (node) => {
      if (node.tagName !== "a") return;
      const href = node.properties?.href;
      if (typeof href !== "string") return;
      const isExternal =
        /^https?:\/\//i.test(href) && !/(^|\.)faizahmed\.in/i.test(href);
      if (isExternal) {
        node.properties.target = "_blank";
        node.properties.rel = "noopener noreferrer";
      }
    });
  };
}
