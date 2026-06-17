#!/usr/bin/env node
// Ping IndexNow (Bing, Yandex, Seznam, Naver, …) for free — no Cloudflare add-on.
//
//   node scripts/indexnow.mjs                       # submit every URL in dist/sitemap.xml
//   node scripts/indexnow.mjs https://faizahmed.in/a-new-post   # submit specific URL(s)
//
// Run AFTER `pnpm build` (it reads dist/sitemap.xml) and after the new content is
// actually live, so the search engines fetch the fresh pages.

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const HOST = "faizahmed.in";
const KEY = "a97974d47d4441389c7f4eae25fa392f";
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const ENDPOINT = "https://api.indexnow.org/IndexNow";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITEMAP = resolve(__dirname, "../dist/sitemap.xml");

async function urlsFromSitemap() {
  let xml;
  try {
    xml = await readFile(SITEMAP, "utf-8");
  } catch {
    console.error(`Could not read ${SITEMAP}. Run \`pnpm build\` first.`);
    process.exit(1);
  }
  const locs = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1].trim());
  // Only URLs on our canonical host (IndexNow rejects off-host URLs with 422).
  return locs.filter((u) => {
    try { return new URL(u).host === HOST; } catch { return false; }
  });
}

async function submit(urlList) {
  if (urlList.length === 0) {
    console.log("Nothing to submit.");
    return;
  }
  // IndexNow accepts up to 10,000 URLs per request; we batch defensively.
  const BATCH = 10000;
  for (let i = 0; i < urlList.length; i += BATCH) {
    const batch = urlList.slice(i, i + BATCH);
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: HOST,
        key: KEY,
        keyLocation: KEY_LOCATION,
        urlList: batch,
      }),
    });
    const ok = res.status === 200 || res.status === 202;
    console.log(`${ok ? "✓" : "✗"} ${res.status} ${res.statusText} — submitted ${batch.length} URL(s)`);
    if (!ok) {
      const reason = {
        400: "Bad request — invalid format",
        403: "Forbidden — key not valid / not found at keyLocation",
        422: "Unprocessable — a URL doesn't belong to the host, or key mismatch",
        429: "Too many requests — slow down",
      }[res.status];
      if (reason) console.error(`   ${reason}`);
      process.exitCode = 1;
    }
  }
}

const args = process.argv.slice(2).filter((a) => a.startsWith("http"));
const urls = args.length > 0 ? args : await urlsFromSitemap();
console.log(`Submitting ${urls.length} URL(s) to IndexNow as ${HOST}…`);
await submit(urls);
