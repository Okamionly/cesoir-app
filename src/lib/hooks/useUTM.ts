"use client";

/**
 * useUTM — expose the current user's first-touch UTM tuple.
 *
 * Wave 15 · CFO 10/10 (2026-04-23). Pairs with `src/lib/analytics.ts` and
 * migration 023_profile_utm_tracking.sql.
 *
 * Behaviour:
 *  - On mount: ensures `captureFirstVisit()` has run for this browser.
 *  - Returns the stored UTM tuple + inferred acquisition channel.
 *  - Re-reads when the window regains focus (handles multi-tab cases where
 *    another tab wrote first).
 */

import { useCallback, useEffect, useState } from "react";
import {
  captureFirstVisit,
  getStoredUtm,
  inferChannel,
  type AcquisitionChannel,
  type UTMData,
} from "@/lib/analytics";

export interface UseUTMValue {
  utm: UTMData | null;
  channel: AcquisitionChannel;
  refresh: () => void;
}

export function useUTM(): UseUTMValue {
  const [utm, setUtm] = useState<UTMData | null>(null);

  const refresh = useCallback(() => {
    // captureFirstVisit is idempotent — only the first call writes.
    const fresh = captureFirstVisit() ?? getStoredUtm();
    setUtm(fresh);
  }, []);

  useEffect(() => {
    refresh();

    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("visibilitychange", onVisibility);

    const onStorage = (e: StorageEvent) => {
      if (e.key === "cesoir_utm") refresh();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("storage", onStorage);
    };
  }, [refresh]);

  return {
    utm,
    channel: inferChannel(utm ?? {}),
    refresh,
  };
}
