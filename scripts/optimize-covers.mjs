#!/usr/bin/env node
// One-time pass: downscale + recompress every post cover so the self-hosted
// originals aren't multi-MB. Covers are decorative photos, so a 1600px-wide
// JPEG at q82 is plenty and is what gets emitted/optimized by Astro.
//
//   node scripts/optimize-covers.mjs
//
// For each src/content/blog/<slug>/cover.<ext>: resize to <=1600px wide, write
// cover.jpg, delete the old file if the extension changed, and rewrite the
// `cover:` frontmatter to ./cover.jpg.

import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve("src/content/blog");
const MAX_WIDTH = 1600;

const dirs = await fs.readdir(ROOT, { withFileTypes: true });
let optimized = 0;
let before = 0;
let after = 0;

for (const d of dirs) {
  if (!d.isDirectory()) continue;
  const dir = path.join(ROOT, d.name);
  const files = await fs.readdir(dir);
  const cover = files.find((f) => /^cover\.(png|jpe?g|webp)$/i.test(f));
  if (!cover) continue;

  const srcPath = path.join(dir, cover);
  const outPath = path.join(dir, "cover.jpg");
  const srcStat = await fs.stat(srcPath);
  before += srcStat.size;

  const buf = await sharp(srcPath)
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
  await fs.writeFile(outPath, buf);
  after += buf.length;

  if (cover !== "cover.jpg") await fs.unlink(srcPath);

  // Point the frontmatter at the (possibly renamed) cover.jpg.
  const mdPath = path.join(dir, "index.md");
  const md = await fs.readFile(mdPath, "utf-8");
  const fixed = md.replace(/^cover:\s*\.\/cover\.(png|jpe?g|webp)\s*$/m, "cover: ./cover.jpg");
  if (fixed !== md) await fs.writeFile(mdPath, fixed);

  optimized += 1;
  console.log(`✓ ${d.name}  ${(srcStat.size / 1024).toFixed(0)}KB → ${(buf.length / 1024).toFixed(0)}KB`);
}

console.log(
  `\nOptimized ${optimized} covers: ${(before / 1e6).toFixed(1)}MB → ${(after / 1e6).toFixed(1)}MB`,
);
