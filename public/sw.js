// Keeps the app on the phone so it opens with no network.
// Change VERSION whenever a file in /public/app or index.html changes.
const VERSION = "jw-2026-11-13-6";
const FILES = ["/", "/app/app.css", "/app/main.js", "/app/store.js", "/app/logic.js", "/app/pdf.js", "/manifest.webmanifest", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(VERSION)
      .then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: "reload" }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin || url.pathname.startsWith("/api/")) return;
  // Every page is the same app; the part after # picks the screen.
  const key = req.mode === "navigate" ? "/" : url.pathname;
  e.respondWith(
    caches.open(VERSION).then((c) =>
      c.match(key).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok && FILES.includes(key)) c.put(key, res.clone());
            return res;
          }),
      ),
    ),
  );
});
