"use client";

import { useEffect } from "react";
import { registerServiceWorker } from "@/lib/registerSW";

/**
 * Mounts once at the root layout to register the PWA service worker.
 *
 * QA 2026-04-19 caught: src/lib/registerSW.ts existed but was never
 * imported anywhere → the PWA was installable but had no offline cache
 * (the sw.js precache list was unused).
 *
 * Only registers in production by default — in dev, Turbopack/HMR
 * conflicts with SW caching produce confusing stale-asset bugs. Set
 * NEXT_PUBLIC_FORCE_SW=true to test SW behavior in dev.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const force = process.env.NEXT_PUBLIC_FORCE_SW === "true";
    if (process.env.NODE_ENV !== "production" && !force) {
      return;
    }

    registerServiceWorker().catch((err) => {
      console.error("[SW] register failed", err);
    });
  }, []);

  return null;
}
