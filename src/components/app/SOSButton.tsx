"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSafety } from "@/lib/useSafety";

/**
 * SOSButton — stealth triple-tap SOS trigger.
 *
 * Safety design: the SOS must be INVISIBLE to an aggressor standing nearby.
 * - No fullscreen red overlay
 * - No countdown visible on screen
 * - Activation feedback: short haptic pattern only
 * - Confirmation feedback: small toast bottom-right that auto-dismisses in 2s
 * - Background dispatch via useSafety.triggerSOS() fires silently
 *
 * Trigger: triple-tap any element with [data-logo-moon] within 600ms.
 * The fallback `target.textContent === "☾"` also fires for safety.
 */
export default function SOSButton() {
  const { triggerSOS } = useSafety();
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firedRef = useRef(false);

  // Triple-tap detection on any moon logo element
  useEffect(() => {
    let tapCount = 0;
    let tapTimer: ReturnType<typeof setTimeout> | null = null;

    function handleTap(e: Event) {
      const target = e.target as HTMLElement;
      const isMoonLogo =
        target.closest("[data-logo-moon]") !== null ||
        target.textContent?.trim() === "☾"; // ☾ character

      if (!isMoonLogo) return;

      tapCount++;
      if (tapTimer) clearTimeout(tapTimer);

      if (tapCount >= 3) {
        tapCount = 0;
        activateSOS();
      }

      tapTimer = setTimeout(() => {
        tapCount = 0;
      }, 600);
    }

    document.addEventListener("click", handleTap);
    document.addEventListener("touchend", handleTap);

    return () => {
      document.removeEventListener("click", handleTap);
      document.removeEventListener("touchend", handleTap);
      if (tapTimer) clearTimeout(tapTimer);
    };
    // activateSOS is stable (ref-based) — intentionally omitted from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activateSOS = useCallback(() => {
    // Idempotent: only fire once per component lifetime (prevents double-tap race)
    if (firedRef.current) return;
    firedRef.current = true;

    // 1. Haptic feedback — short pattern, stealth on screen
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([200, 100, 200]);
    }

    // 2. Silent background dispatch — no await, fire and forget
    void triggerSOS();

    // 3. Small dismissible toast — bottom-right, minimal footprint
    setToastVisible(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastVisible(false);
      // Reset so SOS can be re-triggered if needed
      firedRef.current = false;
    }, 2000);
  }, [triggerSOS]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  if (!toastVisible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-20 right-4 z-[900] px-4 py-2 rounded-full bg-black/80 text-white text-xs font-semibold shadow-lg pointer-events-none select-none"
      style={{ backdropFilter: "blur(8px)" }}
    >
      SOS envoyé
    </div>
  );
}
