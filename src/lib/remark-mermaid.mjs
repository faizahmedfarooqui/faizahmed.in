import { visit } from "unist-util-visit";

// Converts ```mermaid fenced code blocks into a raw <pre class="mermaid"> node
// BEFORE syntax highlighting runs, so Shiki leaves them alone. The actual
// rendering happens client-side via mermaid.js (see BaseLayout.astro).
export function remarkMermaid() {
  return (tree) => {
    visit(tree, "code", (node, index, parent) => {
      if (!parent || node.lang !== "mermaid") return;
      const escaped = node.value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      parent.children[index] = {
        type: "html",
        value: `<pre class="mermaid">${escaped}</pre>`,
      };
    });
  };
}
