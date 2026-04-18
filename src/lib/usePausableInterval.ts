"use client";

import { useEffect, useRef } from "react";

/**
 * setInterval that automatically pauses while the tab is hidden.
 *
 * Browsers already throttle background timers, but on mobile an app
 * sitting in a backgrounded tab can still burn CPU / battery. This hook
 * clears the interval on `visibilitychange` → hidden and restarts it on
 * `visible`, so the callback only fires when the user can actually see
 * the effect.
 *
 * - `delay` is in ms. Pass `null` to pause.
 * - The callback is kept in a ref so callers don't need to memoize it.
 * - SSR-safe: no-ops until mount.
 *
 * Example:
 *   usePausableInterval(() => setCurrent(c => (c + 1) % events.length), 4000);
 */
export function usePausableInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null || typeof window === "undefined") return;

    let timer: number | null = null;

    const start = () => {
      if (timer !== null) return;
      timer = window.setInterval(() => savedCallback.current(), delay);
    };

    const stop = () => {
      if (timer === null) return;
      window.clearInterval(timer);
      timer = null;
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        stop();
      } else {
        start();
      }
    };

    if (document.visibilityState === "visible") {
      start();
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      stop();
    };
  }, [delay]);
}
