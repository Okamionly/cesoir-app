// ---------- CeSoir Service Worker ----------
//
// Cache naming strategy (QA 2026-04-20):
// - Old SW hardcoded CACHE_NAME = "cesoir-v1" → users stayed on stale builds
//   forever after a Vercel deploy (SW would keep serving the cached HTML/JS
//   from the previous release). Cache never busted.
// - New strategy: the main thread posts a VERSION message at register time
//   carrying NEXT_PUBLIC_APP_VERSION (build SHA or timestamp). The SW uses
//   that as the cache bucket suffix (cesoir-<version>) and drops every other
//   bucket on activate. Fallback to "cesoir-v0" if no version is posted yet,
//   so the first fetch after install still works.
// - Registration URL is also /sw.js?v=<version> so the browser byte-diffs the
//   worker on each deploy and triggers the updatefound path automatically.
//
// Privacy hardening (RGPD, QA 2026-04-20):
// - Supabase REST/Storage/Realtime responses are NEVER cached. Previously any
//   `supabase.co` URL went through networkFirst and got stored in CacheStorage,
//   which meant user B logging in on the same device could read user A's
//   photos/messages from the cache. Now we bypass the SW entirely for those.
// - The main thread wipes all caches on logout (see AuthContext.signOut).

let RUNTIME_VERSION = "v0";
let CACHE_NAME = "cesoir-v0";

// Critical assets to pre-cache during install.
// NOTE: "/" is intentionally omitted — caching the landing page masks auth
// redirects (logged-out user sees logged-in snapshot). We cache the offline
// fallback instead.
const PRECACHE_ASSETS = [
  "/offline",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
];

// Patterns that MUST bypass the SW entirely — never read, never write cache.
// Supabase auth/storage/rest leak PII across sessions if cached.
const BYPASS_PATTERNS = [
  /supabase\.co/,
  /\/auth\//,
];

// Patterns that use network-first (stale fallback only if network dies).
const NETWORK_FIRST_PATTERNS = [
  /\/api\//,
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

  // Hard bypass — never touch cache for Supabase/auth (PII boundary)
  const isBypass = BYPASS_PATTERNS.some((pattern) =>
    pattern.test(request.url)
  );
  if (isBypass) return; // let the browser fetch natively, SW stays out

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
    // Return dedicated offline fallback for navigation requests
    if (request.mode === "navigate") {
      const fallback = await caches.match("/offline");
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

const OFFLINE_QUEUE_STORE = "cesoir-offline-sync";

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
  if (!event.data) return;

  if (event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }

  // VERSION message: the main thread posts this right after registration with
  // the current build ID. We adopt it as the cache bucket name so every new
  // deploy creates a fresh bucket and the old one gets GC'd on activate.
  if (event.data.type === "VERSION" && typeof event.data.version === "string") {
    const newVersion = event.data.version;
    if (newVersion && newVersion !== RUNTIME_VERSION) {
      RUNTIME_VERSION = newVersion;
      CACHE_NAME = `cesoir-${newVersion}`;
      // Re-precache into the new bucket and drop older ones. We don't await
      // here — postMessage handlers can't respond to waitUntil, but the
      // install/activate cycle of the next worker will clean up stragglers.
      caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS)).catch(() => {
        // Offline or precache URL 404 — ignore, cache will fill opportunistically
      });
      caches.keys().then((keys) => {
        keys
          .filter((key) => key !== CACHE_NAME && key.startsWith("cesoir-"))
          .forEach((key) => caches.delete(key));
      });
    }
    return;
  }

  // WIPE_CACHES: triggered on logout. Clears every cache bucket so the next
  // user on the device can't see the previous session's photos/messages via
  // CacheStorage.
  if (event.data.type === "WIPE_CACHES") {
    event.waitUntil?.(
      caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
    );
    return;
  }
});
