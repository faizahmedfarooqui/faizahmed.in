#!/usr/bin/env node
// Import Hashnode-exported markdown into src/content/blog.
//
//   node scripts/import-posts.mjs <source-dir>
//
// For each .md in <source-dir> it:
//   1. Reads frontmatter + body.
//   2. Strips the trailing "About Me" block.
//   3. Ensures a `series:` field exists (defaults to null if missing).
//   4. Downloads images hosted on cdn.hashnode.com that are NOT Unsplash
//      (path contains /image/upload/ but not /image/unsplash/) into the post
//      folder and rewrites their URLs to local relative paths. Unsplash images
//      are left hot-linked.
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

const isUnsplash = (url) => url.includes("/image/unsplash/");
const isHashnodeUpload = (url) =>
  url.startsWith("https://cdn.hashnode.com/") &&
  url.includes("/image/upload/") &&
  !isUnsplash(url);

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
  const res = await fetch(url);
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

  // Ensure series field exists.
  if (!/^series:/m.test(newFm)) newFm += "\nseries: null";

  // Collect candidate image URLs: cover + inline markdown images.
  const urls = new Set();
  const coverMatch = newFm.match(/^cover:\s*(.+)$/m);
  if (coverMatch) urls.add(coverMatch[1].trim());
  for (const m of cleaned.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)) urls.add(m[1]);

  let imgIndex = 0;
  for (const url of urls) {
    if (!isHashnodeUpload(url)) continue; // skip Unsplash + everything external
    imgIndex += 1;
    const name = `image-${imgIndex}${extOf(url)}`;
    try {
      await download(url, destDir, name);
      const local = `./${name}`;
      newFm = newFm.split(url).join(local);
      cleaned = cleaned.split(url).join(local);
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
  .filter((e) => e.isFile() && e.name.endsWith(".md"))
  .map((e) => path.join(SRC, e.name));

console.log(`Importing ${files.length} posts → ${OUT}\n`);
for (const f of files) await processFile(f);
console.log("\nDone.");
