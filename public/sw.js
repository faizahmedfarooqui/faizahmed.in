// Kill-switch service worker. The old Gatsby site (gatsby-plugin-offline)
// registered a service worker at /sw.js that still controls returning visitors
// and serves the stale cached site. This replacement takes over, deletes all
// caches, unregisters itself, and reloads open tabs onto the live site.
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: "window" });
      for (const client of clients) client.navigate(client.url);
    })(),
  );
});
