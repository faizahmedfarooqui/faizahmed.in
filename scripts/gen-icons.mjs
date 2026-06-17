#!/usr/bin/env node
// Rasterize public/favicon.svg into the PNG icon set referenced by BaseHead and
// site.webmanifest. Run after changing favicon.svg.
//
//   node scripts/gen-icons.mjs

import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const PUBLIC = path.resolve("public");
const svg = await fs.readFile(path.join(PUBLIC, "favicon.svg"));

// name -> pixel size
const ICONS = {
  "favicon-32.png": 32,
  "apple-touch-icon.png": 180, // iOS home-screen
  "icon-192.png": 192, // PWA manifest
  "icon-512.png": 512, // PWA manifest / splash
};

for (const [name, size] of Object.entries(ICONS)) {
  // High density so the vector rasterizes crisply at the target size.
  await sharp(svg, { density: 512 })
    .resize(size, size)
    .png()
    .toFile(path.join(PUBLIC, name));
  console.log(`✓ ${name} (${size}x${size})`);
}

console.log("\nDone.");
