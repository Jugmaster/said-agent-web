// Atcha ships no service worker. This file exists so browsers that still hold
// the old SAID Agent worker (same origin) fetch it, run it, and let go: it
// unregisters itself, drops every cache, and reloads the open tabs so nothing
// stale is served again.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      } catch {}
      try { await self.registration.unregister(); } catch {}
      try {
        const clients = await self.clients.matchAll({ type: "window" });
        for (const c of clients) c.navigate(c.url);
      } catch {}
    })(),
  );
});
