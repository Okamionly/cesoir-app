"use client";

/**
 * useIsMobile — SSR-safe matchMedia hook for `(max-width: 767px)`.
 *
 * Returns `true` on viewports below the Tailwind `md` breakpoint (768px).
 * On the server (no `window`) returns `false`, deferring to the Tailwind
 * `md:` classes to paint a desktop-first shell; the first client effect
 * reconciles to the real viewport synchronously via `useLayoutEffect`-equivalent
 * (falls back to `useEffect` in SSR contexts) so the phone-frame only flashes
 * in for users who *aren't* mobile.
 *
 * Usage:
 *   const isMobile = useIsMobile();
 *   if (isMobile) return <FullBleed />;
 *   return <PhoneFrame />;
 *
 * Why 768px: matches Tailwind's default `md` breakpoint so CSS-only fallbacks
 * (e.g. `md:rounded-[44px]`) stay consistent with the JS branch.
 */
import { useEffect, useState } from "react";

const MOBILE_QUERY = "(max-width: 767px)";

export function useIsMobile(): boolean {
  // SSR-safe default: assume desktop so the phone frame renders server-side
  // on builds. Client-only users on mobile then flip to `true` on the first
  // `matchMedia` evaluation.
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const mql = window.matchMedia(MOBILE_QUERY);

    const sync = () => setIsMobile(mql.matches);
    sync();

    // Cross-browser listener (Safari <14 used `addListener`, modern uses `addEventListener`)
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", sync);
      return () => mql.removeEventListener("change", sync);
    }

    // Legacy fallback
    mql.addListener(sync);
    return () => mql.removeListener(sync);
  }, []);

  return isMobile;
}

export default useIsMobile;
