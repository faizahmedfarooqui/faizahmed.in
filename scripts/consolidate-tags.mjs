#!/usr/bin/env node
// One-time-ish tag consolidation: rewrites the `tags:` frontmatter line in every
// post, folding duplicate/variant tags into a canonical tag (see MERGE). Safe to
// re-run. After running, regenerate /public/_redirects entries if MERGE changes
// (see scripts note / README).
import fs from "node:fs/promises";
import path from "node:path";

const BLOG = path.resolve("src/content/blog");

// old slug -> canonical slug
export const MERGE = {
  cicd: "ci-cd",
  pcidss: "pci-dss",
  webdev: "web-development",
  backendengineering: "backend-engineering",
  "backend-development": "backend-engineering",
  devtip: "devtips",
  ovs: "openvswitch",
  e2ee: "end-to-end-encryption",
  aes: "aes-encryption",
  "rsa-encryption": "rsa",
  "tls-encryption": "tls",
  "backpressure-in-nodejs": "backpressure",
  "streams-backpressure": "backpressure",
  streamingdata: "streaming",
  streamingtech: "streaming",
  "streams-in-nodejs": "streams",
  scalablearchitecture: "scalability",
  scalablesolutions: "scalability",
  "gc-pressure": "garbagecollection",
  "npm-packages": "npm",
  workspaces: "npm-workspaces",
  devsecurity: "devsecops",
  securitybestpractices: "security",
  "software-development": "software-engineering",
  queue: "queue-systems",
};

function rewriteTagsLine(line) {
  // line looks like: tags: a, b, c
  const raw = line.replace(/^tags:\s*/, "");
  const out = [];
  const seen = new Set();
  for (let t of raw.split(",")) {
    t = t.trim();
    if (!t) continue;
    const mapped = MERGE[t] ?? t;
    if (!seen.has(mapped)) {
      seen.add(mapped);
      out.push(mapped);
    }
  }
  return `tags: ${out.join(", ")}`;
}

let changed = 0;
const dirs = await fs.readdir(BLOG, { withFileTypes: true });
for (const d of dirs) {
  if (!d.isDirectory()) continue;
  const file = path.join(BLOG, d.name, "index.md");
  let content;
  try {
    content = await fs.readFile(file, "utf-8");
  } catch {
    continue;
  }
  // Only touch the first `tags:` line inside the frontmatter block.
  const lines = content.split("\n");
  let inFm = false,
    fmCount = 0,
    done = false;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === "---") {
      fmCount++;
      inFm = fmCount === 1;
      if (fmCount === 2) break;
      continue;
    }
    if (inFm && !done && /^tags:/.test(lines[i])) {
      const next = rewriteTagsLine(lines[i]);
      if (next !== lines[i]) {
        lines[i] = next;
        changed++;
      }
      done = true;
    }
  }
  await fs.writeFile(file, lines.join("\n"));
}
console.log(`Tag consolidation complete. Rewrote tags in ${changed} post(s).`);
