"use client";

import { useEffect, useState } from "react";

/**
 * Detects whether the primary input is a fine pointer (mouse / trackpad)
 * vs a coarse pointer (touch). Returns `false` during SSR and initial
 * hydration to stay touch-friendly by default.
 *
 * Used to gate hover-only cinematic effects (3D tilt, sibling-shrink,
 * cursor-follow glow) that feel wrong on touch devices.
 */
export function usePointerFine(): boolean {
  const [fine, setFine] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(pointer: fine)");
    const update = () => setFine(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);
  return fine;
}

export default usePointerFine;
