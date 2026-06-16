#!/usr/bin/env node
// Import Hashnode-exported markdown into src/content/blog.
//
//   node scripts/import-posts.mjs <source-dir>
//
// For each .md in <source-dir> it:
//   1. Reads frontmatter + body.
//   2. Strips the trailing "About Me" block.
//   3. Ensures a `series:` field exists (defaults to null if missing).
//   4. Downloads EVERY remote image (the `cover` and all inline body images,
//      regardless of host — Hashnode CDN, Unsplash, S3, anywhere) into the post
//      folder and rewrites the references to local relative paths, so the site
//      depends on no external image host. The cover is saved as `cover.<ext>`;
//      body images as `image-<n>.<ext>`.
//   5. Writes to src/content/blog/<slug>/index.md (colocated images alongside).
//
// Re-running is safe: existing post folders are overwritten.

import fs from "node:fs/promises";
import path from "node:path";

const SRC = process.argv[2];
const OUT = path.resolve("src/content/blog");

if (!SRC) {
  console.error("Usage: node scripts/import-posts.mjs <source-dir>");
  process.exit(1);
}

const isRemote = (url) => /^https?:\/\//.test(url);

function parseFrontmatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { fm: {}, fmRaw: "", body: raw };
  const fm = {};
  for (const line of m[1].split("\n")) {
    const i = line.indexOf(":");
    if (i === -1) continue;
    fm[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { fm, fmRaw: m[1], body: m[2] };
}

function stripAboutMe(body) {
  // Removes a trailing "# About Me ..." section (and anything after it).
  return body.replace(/\n#+\s*About Me[\s\S]*$/i, "\n").trimEnd() + "\n";
}

async function download(url, destDir, name) {
  // Some CDNs reject requests without a browser-like User-Agent.
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; post-importer/1.0)" },
  });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.mkdir(destDir, { recursive: true });
  await fs.writeFile(path.join(destDir, name), buf);
}

function extOf(url) {
  const clean = url.split("?")[0];
  const e = path.extname(clean);
  return e && e.length <= 5 ? e : ".jpg";
}

async function processFile(file) {
  const raw = await fs.readFile(file, "utf-8");
  const { fm, fmRaw, body } = parseFrontmatter(raw);
  const slug = (fm.slug || path.basename(file, ".md")).replace(/['"]/g, "");
  const destDir = path.join(OUT, slug);
  await fs.mkdir(destDir, { recursive: true });

  let cleaned = stripAboutMe(body);
  let newFm = fmRaw;

  // Hashnode emits images as `![alt](url align="center")`; the trailing
  // attribute is not valid CommonMark and corrupts the URL. Drop anything
  // after the URL (first whitespace) inside the image parentheses.
  cleaned = cleaned.replace(
    /(!\[[^\]]*\]\()(\S+)\s+[^)]*(\))/g,
    "$1$2$3",
  );

  // Ensure series field exists.
  if (!/^series:/m.test(newFm)) newFm += "\nseries: null";

  // Hashnode titles are double-quoted but may contain raw inner double quotes
  // (e.g. `title: "How much do you know "Traefik" proxy?"`), which is invalid
  // YAML. Escape inner quotes so the frontmatter parses.
  newFm = newFm.replace(/^(title:\s*)"(.*)"[ \t]*$/m, (_, pre, inner) => {
    return `${pre}"${inner.replace(/\\?"/g, '\\"')}"`;
  });

  // Download the cover into the post folder and rewrite the `cover:` field to a
  // local path so nothing depends on an external image host. Astro's content
  // pipeline (image() schema) resolves and optimizes it from there.
  const coverMatch = newFm.match(/^cover:\s*(.+)$/m);
  if (coverMatch && isRemote(coverMatch[1].trim())) {
    const coverUrl = coverMatch[1].trim();
    const name = `cover${extOf(coverUrl)}`;
    try {
      await download(coverUrl, destDir, name);
      newFm = newFm.split(coverUrl).join(`./${name}`);
      console.log(`  ↓ ${name}  (${slug})`);
    } catch (e) {
      console.warn(`  ! cover failed ${coverUrl}: ${e.message}`);
    }
  }

  // Download every inline body image (any host) and localize it.
  const urls = new Set();
  for (const m of cleaned.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)) urls.add(m[1]);

  let imgIndex = 0;
  for (const url of urls) {
    if (!isRemote(url)) continue; // already local / data URI
    imgIndex += 1;
    const name = `image-${imgIndex}${extOf(url)}`;
    try {
      await download(url, destDir, name);
      cleaned = cleaned.split(url).join(`./${name}`);
      console.log(`  ↓ ${name}  (${slug})`);
    } catch (e) {
      console.warn(`  ! failed ${url}: ${e.message}`);
    }
  }

  const output = `---\n${newFm}\n---\n\n${cleaned.trimStart()}`;
  await fs.writeFile(path.join(destDir, "index.md"), output);
  console.log(`✓ ${slug}`);
}

const entries = await fs.readdir(SRC, { withFileTypes: true });
const files = entries
  .filter(
    (e) =>
      e.isFile() &&
      e.name.endsWith(".md") &&
      e.name.toLowerCase() !== "readme.md",
  )
  .map((e) => path.join(SRC, e.name));

console.log(`Importing ${files.length} posts → ${OUT}\n`);
for (const f of files) await processFile(f);
console.log("\nDone.");
