const CACHE_NAME = "mgmt-os-v1";
const STATIC_ASSETS = [
  "/",
  "/dashboard",
  "/index.html",
];

// Install: cache core shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first, fallback to cache
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (event.request.url.includes("firebase") || event.request.url.includes("googleapis")) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match("/index.html")))
  );
});

// Push notifications
self.addEventListener("push", (event) => {
  const data = event.data?.json() || {};
  const title = data.title || "Breakthrough Management OS";
  const options = {
    body: data.body || "You have a new notification.",
    icon: "https://via.placeholder.com/192/3b82f6/ffffff?text=B",
    badge: "https://via.placeholder.com/72/3b82f6/ffffff?text=B",
    data: { url: data.url || "/dashboard" },
    tag: data.tag || "mgmt-os-notification",
    requireInteraction: data.urgent || false,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click: open app
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/dashboard";
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus();
        }
      }
      return clients.openWindow(targetUrl);
    })
  );
});
