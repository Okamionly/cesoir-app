import { logger } from "./logger";

/**
 * Service Worker registration utility.
 *
 * Call once on app load (e.g. in a top-level client component or layout effect).
 * Returns the ServiceWorkerRegistration on success, or null if unsupported / failed.
 *
 * Cache versioning (QA 2026-04-20):
 * - We append ?v=<BUILD_VERSION> to the SW URL so the browser byte-diffs the
 *   worker on every deploy and triggers `updatefound`.
 * - We post a VERSION message right after registration so the SW uses
 *   `cesoir-<BUILD_VERSION>` as its cache bucket. Old buckets are dropped
 *   on activate — this is what actually busts the stale-HTML bug.
 *
 * BUILD_VERSION is read from NEXT_PUBLIC_APP_VERSION (set by Vercel to the
 * deploy SHA) with a session-stable fallback so local dev still busts on
 * hard reload.
 */

const BUILD_VERSION =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_APP_VERSION) ||
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA) ||
  "dev";

/**
 * Post the VERSION message to the controlling/active/installing worker.
 * Tries every slot because exactly which one is "live" depends on lifecycle.
 */
function announceVersion(registration: ServiceWorkerRegistration) {
  const workers = [
    registration.active,
    registration.waiting,
    registration.installing,
    navigator.serviceWorker.controller,
  ].filter((w): w is ServiceWorker => w !== null);

  for (const worker of workers) {
    try {
      worker.postMessage({ type: "VERSION", version: BUILD_VERSION });
    } catch {
      // postMessage on a redundant worker throws — ignore
    }
  }
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined") return null;

  if (!("serviceWorker" in navigator)) {
    logger.warn("sw_register_unsupported_browser");
    return null;
  }

  try {
    // URL query param ensures the browser treats each deploy's worker as
    // byte-different and triggers the updatefound → skipWaiting path.
    const registration = await navigator.serviceWorker.register(
      `/sw.js?v=${encodeURIComponent(BUILD_VERSION)}`,
      { scope: "/" }
    );

    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.debug("[SW] Enregistre avec succes :", registration.scope, "version", BUILD_VERSION);
    }

    // Tell the worker which version to namespace its cache under.
    announceVersion(registration);

    // Listen for updates
    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener("statechange", () => {
        if (newWorker.state === "installed") {
          // Push VERSION to the freshly installed worker so it names its
          // cache bucket correctly before it takes over.
          try {
            newWorker.postMessage({ type: "VERSION", version: BUILD_VERSION });
          } catch {
            // ignore
          }

          if (navigator.serviceWorker.controller) {
            // New version available — auto-activate
            if (process.env.NODE_ENV !== "production") {
              // eslint-disable-next-line no-console
              console.debug("[SW] Nouvelle version disponible.");
            }
            newWorker.postMessage({ type: "SKIP_WAITING" });
          }
        }
      });
    });

    // Listen for sync messages from SW
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data?.type === "SYNC_OFFLINE_QUEUE") {
        // Dispatch a custom event so the offline-queue hook can pick it up
        window.dispatchEvent(new CustomEvent("cesoir:sync-offline"));
      }
    });

    return registration;
  } catch (error) {
    logger.error("sw_register_failed", { err: String(error) });
    return null;
  }
}

/**
 * Wipe every CacheStorage bucket. Call on logout to prevent PII leaking
 * across sessions (user A's photos stuck in cache when user B logs in on
 * the same device). Also asks the SW to do its own sweep via postMessage
 * in case the caller doesn't have `caches` on `window` (older iOS PWAs).
 */
export async function wipeServiceWorkerCaches(): Promise<void> {
  if (typeof window === "undefined") return;

  // 1. Main-thread wipe (works in every modern browser including iOS 17+)
  if ("caches" in window) {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    } catch (err) {
      logger.warn("sw_cache_wipe_failed_main_thread", { err: String(err) });
    }
  }

  // 2. Belt-and-suspenders: ask the active SW to wipe too (covers the narrow
  // race where an in-flight fetch repopulates the cache right after we cleared it).
  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    try {
      navigator.serviceWorker.controller.postMessage({ type: "WIPE_CACHES" });
    } catch {
      // ignore
    }
  }
}
