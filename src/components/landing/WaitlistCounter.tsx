"use client";

/**
 * WaitlistCounter — social-proof counter shown on the landing (Wave 15).
 *
 * Fetches /api/waitlist (cached 60s, falls back to 0 on error). Animates
 * the number in when it comes back. Positioned as a floating chip so the
 * landing owner can drop it anywhere. Auto-hides if the count is < 10 to
 * avoid showing a sad "3 Montpelliérains" number at boot.
 */

import { useEffect, useState } from "react";
import { m, AnimatePresence } from "motion/react";

export default function WaitlistCounter() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch("/api/waitlist", { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((body: { signedUp?: number } | null) => {
        if (body && typeof body.signedUp === "number") {
          setCount(body.signedUp);
        }
      })
      .catch(() => {
        // silent — show nothing rather than "unavailable"
      });
    return () => ctrl.abort();
  }, []);

  // Hide below 10 — lonely numbers hurt.
  if (count === null || count < 10) return null;

  return (
    <AnimatePresence>
      <m.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-3 py-1.5 text-xs backdrop-blur-md"
      >
        <span
          aria-hidden
          className="h-1.5 w-1.5 rounded-full animate-pulse"
          style={{ background: "#00FF88" }}
        />
        <span className="text-white/80 font-medium">
          <strong className="text-white">{count.toLocaleString("fr-FR")}</strong>
          {" "}Montpelliérain{count > 1 ? "s" : ""} sur la waitlist
        </span>
      </m.div>
    </AnimatePresence>
  );
}
