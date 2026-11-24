/* Astro_Fly service worker: caches the app shell and static assets so the app
   opens fast and still shows something useful on a weak connection. */
const VERSION = "astrofly-v1"
const SHELL = ["/", "/drones", "/bookings", "/chat", "/icons/icon-192.png", "/manifest.webmanifest"]

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()))
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)
  if (request.method !== "GET" || url.origin !== self.location.origin) return
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/admin")) return

  // Static assets: cache first
  if (/\/_next\/static\/|\/drones\/.*\.webp$|\/icons\/|\/models\//.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            const copy = res.clone()
            caches.open(VERSION).then((c) => c.put(request, copy))
            return res
          }),
      ),
    )
    return
  }

  // Pages: network first, fall back to cache
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone()
          caches.open(VERSION).then((c) => c.put(request, copy))
          return res
        })
        .catch(() => caches.match(request).then((hit) => hit || caches.match("/"))),
    )
  }
})
