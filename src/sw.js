import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { registerRoute, NavigationRoute } from "workbox-routing";
import { NetworkFirst } from "workbox-strategies";
import { createHandlerBoundToURL } from "workbox-precaching";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// SPA fallback
const handler = createHandlerBoundToURL("/fransk-app/index.html");
const navigationRoute = new NavigationRoute(handler, {
  denylist: [/^\/__/, /\/[^/?]+\.[^/]+$/],
});
registerRoute(navigationRoute);

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload;
  try { payload = event.data.json(); } catch { payload = { title: "L'Atelier", body: event.data.text() }; }

  const { title = "L'Atelier", body = "", icon, badge, data } = payload;
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: icon || "/fransk-app/icon-192.png",
      badge: badge || "/fransk-app/icon-192.png",
      data,
      vibrate: [100, 50, 100],
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes("/fransk-app/") && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow("/fransk-app/");
    })
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});
