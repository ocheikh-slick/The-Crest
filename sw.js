const VERSION = "crest-8c6320094a";
const PRECACHE = ["./", "index.html", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png", "img/logo_color.png", "img/logo_white.png", "img/hero_poster.jpg", "img/gate.jpg", "img/villa_front.jpg", "img/boulevard.jpg", "img/aerial.jpg", "img/solar.jpg"];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.pathname.endsWith(".mp4")) return; // video streams straight from the network
  if (req.mode === "navigate") {
    // pages: try the network first so updates show, fall back to the saved copy offline
    e.respondWith(fetch(req).then((res) => {
      const copy = res.clone(); caches.open(VERSION).then((c) => c.put("index.html", copy)); return res;
    }).catch(() => caches.match("index.html")));
    return;
  }
  const sameOrigin = url.origin === self.location.origin;
  const fonts = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!sameOrigin && !fonts) return;
  // images, icons, fonts: serve the saved copy instantly, refresh it in the background
  e.respondWith(caches.open(VERSION).then((c) => c.match(req).then((hit) => {
    const net = fetch(req).then((res) => { if (res && (res.ok || res.type === "opaque")) c.put(req, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  })));
});
