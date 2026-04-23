"use client";

/**
 * AcquisitionTracker — mounts PostHog + captures first-touch UTMs.
 *
 * Wave 15 · CFO 10/10 (2026-04-23). Mounted once, high in the tree, so any
 * inbound marketing URL (`/?utm_source=meta_ads&utm_campaign=launch_mtp`)
 * gets snapshotted into localStorage even if the user never signs up today.
 *
 * Wave 15 · CPO (V3) additionally initialises PostHog here so the 7 core-loop
 * events fire from any page. Both calls are idempotent.
 *
 * Silent — does not render anything. All downstream PostHog / Supabase wiring
 * happens in `src/lib/analytics.ts`.
 */

import { useEffect } from "react";
import { captureFirstVisit, initAnalytics } from "@/lib/analytics";

export default function AcquisitionTracker() {
  useEffect(() => {
    initAnalytics();
    captureFirstVisit();
  }, []);
  return null;
}
