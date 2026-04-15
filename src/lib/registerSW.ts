/**
 * Service Worker registration utility.
 *
 * Call once on app load (e.g. in a top-level client component or layout effect).
 * Returns the ServiceWorkerRegistration on success, or null if unsupported / failed.
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined") return null;

  if (!("serviceWorker" in navigator)) {
    console.warn("[SW] Service workers non supportes par ce navigateur.");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });

    console.log("[SW] Enregistre avec succes :", registration.scope);

    // Listen for updates
    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener("statechange", () => {
        if (
          newWorker.state === "installed" &&
          navigator.serviceWorker.controller
        ) {
          // New version available — prompt or auto-activate
          console.log("[SW] Nouvelle version disponible.");
          newWorker.postMessage({ type: "SKIP_WAITING" });
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
    console.error("[SW] Echec de l'enregistrement :", error);
    return null;
  }
}
