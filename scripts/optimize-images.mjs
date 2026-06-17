#!/usr/bin/env node
// Downscale + recompress post images so neither the emitted originals nor the
// Astro-generated derivatives are oversized. Covers are normalized to a 1600px
// cover.jpg; post-body images are resized in place (format kept, since markdown
// references them by name) and only rewritten when that actually saves bytes.
//
//   node scripts/optimize-images.mjs

import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve("src/content/blog");
const MAX_WIDTH = 1600;

const COVER_RE = /^cover\.(png|jpe?g|webp)$/i;
const BODY_RE = /^image-\d+\.(png|jpe?g|webp)$/i;

function recompress(pipeline, ext) {
  if (/png/i.test(ext)) return pipeline.png({ compressionLevel: 9 });
  if (/webp/i.test(ext)) return pipeline.webp({ quality: 82 });
  return pipeline.jpeg({ quality: 82, mozjpeg: true });
}

const dirs = await fs.readdir(ROOT, { withFileTypes: true });
let coverBefore = 0, coverAfter = 0, bodyCount = 0, bodyBefore = 0, bodyAfter = 0;

for (const d of dirs) {
  if (!d.isDirectory()) continue;
  const dir = path.join(ROOT, d.name);
  const files = await fs.readdir(dir);

  // --- Cover: always a <=1600px cover.jpg, frontmatter pointed at it. ---
  const cover = files.find((f) => COVER_RE.test(f));
  if (cover) {
    const src = path.join(dir, cover);
    coverBefore += (await fs.stat(src)).size;
    const buf = await sharp(src)
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();
    await fs.writeFile(path.join(dir, "cover.jpg"), buf);
    coverAfter += buf.length;
    if (cover !== "cover.jpg") await fs.unlink(src);
    const mdPath = path.join(dir, "index.md");
    const md = await fs.readFile(mdPath, "utf-8");
    const fixed = md.replace(/^cover:\s*\.\/cover\.(png|jpe?g|webp)\s*$/m, "cover: ./cover.jpg");
    if (fixed !== md) await fs.writeFile(mdPath, fixed);
  }

  // --- Body images: resize in place, keep name/format, keep only if smaller. ---
  for (const f of files.filter((f) => BODY_RE.test(f))) {
    const src = path.join(dir, f);
    const orig = (await fs.stat(src)).size;
    const ext = path.extname(f);
    const buf = await recompress(
      sharp(src).resize({ width: MAX_WIDTH, withoutEnlargement: true }),
      ext,
    ).toBuffer();
    bodyCount += 1;
    bodyBefore += orig;
    if (buf.length < orig) {
      await fs.writeFile(src, buf);
      bodyAfter += buf.length;
    } else {
      bodyAfter += orig; // keep the original; it was already smaller
    }
  }
}

const mb = (n) => (n / 1e6).toFixed(1);
console.log(`Covers: ${mb(coverBefore)}MB -> ${mb(coverAfter)}MB`);
console.log(`Body images (${bodyCount}): ${mb(bodyBefore)}MB -> ${mb(bodyAfter)}MB`);
