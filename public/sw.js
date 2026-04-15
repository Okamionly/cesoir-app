// ---------- CeSoir Service Worker ----------

const CACHE_NAME = "cesoir-v1";
const OFFLINE_QUEUE_STORE = "cesoir-offline-sync";

// Critical assets to pre-cache during install
const PRECACHE_ASSETS = [
  "/",
  "/browse",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
];

// Patterns that should use network-first strategy (API calls, dynamic data)
const NETWORK_FIRST_PATTERNS = [
  /\/api\//,
  /supabase\.co/,
  /\/auth\//,
];

// ---------- Install ----------

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ---------- Activate ----------

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ---------- Fetch (Cache Strategy) ----------

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip chrome-extension and other non-http(s) requests
  if (!request.url.startsWith("http")) return;

  // Network-first for API and dynamic content
  const isNetworkFirst = NETWORK_FIRST_PATTERNS.some((pattern) =>
    pattern.test(request.url)
  );

  if (isNetworkFirst) {
    event.respondWith(networkFirst(request));
  } else {
    // Cache-first for static assets
    event.respondWith(cacheFirst(request));
  }
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Return offline fallback for navigation requests
    if (request.mode === "navigate") {
      const fallback = await caches.match("/");
      if (fallback) return fallback;
    }
    return new Response("Hors connexion", {
      status: 503,
      statusText: "Service Unavailable",
    });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    return new Response(
      JSON.stringify({ error: "Hors connexion" }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// ---------- Push Notifications ----------

self.addEventListener("push", (event) => {
  let data = {
    title: "CeSoir",
    body: "Tu as une nouvelle notification",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    url: "/browse",
    tag: "cesoir-default",
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch {
      // Fallback: use text as body
      data.body = event.data.text() || data.body;
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || "/icon-192.png",
    badge: data.badge || "/icon-192.png",
    tag: data.tag || "cesoir-default",
    renotify: true,
    vibrate: [100, 50, 100],
    data: {
      url: data.url || "/browse",
    },
    actions: [],
  };

  // Add contextual actions based on notification type
  if (data.tag === "cesoir-match") {
    options.actions = [
      { action: "view", title: "Voir le profil" },
      { action: "message", title: "Envoyer un message" },
    ];
  } else if (data.tag === "cesoir-message") {
    options.actions = [
      { action: "reply", title: "Repondre" },
    ];
  } else if (data.tag === "cesoir-plan") {
    options.actions = [
      { action: "view", title: "Voir le plan" },
    ];
  }

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// ---------- Notification Click ----------

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const notifData = event.notification.data || {};
  let targetUrl = notifData.url || "/browse";

  // Handle action buttons
  if (event.action === "message" || event.action === "reply") {
    targetUrl = notifData.chatUrl || "/chat";
  } else if (event.action === "view") {
    targetUrl = notifData.profileUrl || notifData.url || "/browse";
  }

  // Focus existing window or open new one
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Try to focus an existing CeSoir tab
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.focus();
          client.navigate(targetUrl);
          return;
        }
      }
      // No existing tab found — open a new one
      return self.clients.openWindow(targetUrl);
    })
  );
});

// ---------- Background Sync ----------

self.addEventListener("sync", (event) => {
  if (event.tag === OFFLINE_QUEUE_STORE) {
    event.waitUntil(processOfflineQueue());
  }
});

async function processOfflineQueue() {
  // Attempt to read queued actions from the cache
  // The main thread stores them in localStorage, but SW can only use Cache API / IndexedDB
  // We broadcast to the main thread to trigger a sync
  const clients = await self.clients.matchAll({ type: "window" });
  for (const client of clients) {
    client.postMessage({
      type: "SYNC_OFFLINE_QUEUE",
    });
  }
}

// ---------- Message Handler ----------

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
