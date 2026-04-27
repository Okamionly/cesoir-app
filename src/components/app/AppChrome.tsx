"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import BottomNav from "@/components/app/BottomNav";
import SOSButton from "@/components/app/SOSButton";
import { FABMenu } from "@/components/app/FABMenu";
import { GlobalSearch } from "@/components/ui/GlobalSearch";
import Tour from "@/components/onboarding/Tour";
import { TOUR_SIGNUP_TS_KEY } from "@/lib/useTour";

/**
 * AppChrome — gates the floating app UI (bottom nav, FAB, SOS, global
 * search, onboarding tour) on the authenticated state.
 *
 * QA 2026-04-19 caught: BottomNav was leaking on public pages (/about,
 * /cgu, /privacy, /why-free) because they sit inside the (app) route
 * group and inherit the layout. Anonymous visitors saw nav items they
 * couldn't use. This wrapper hides them when no user is present.
 *
 * 2026-04-27 — added <GlobalSearch />: a single floating search button
 * mounted globally so the user can jump to any profile / event / venue
 * from anywhere in the app. The same auth gate applies (search needs
 * the session to call `nearby_profiles`), and we additionally suppress
 * it on the auth flows below as a defensive measure even though those
 * routes live in the (auth) group and shouldn't normally render this
 * tree.
 *
 * 2026-04-27 — mounted <Tour />: first-time onboarding spotlight tour
 * that runs once per browser, anchored to the current authenticated
 * session. Self-gated via localStorage (`cesoir-tour-completed`) and
 * the analytics `first_swipe` flag — the component decides whether to
 * fire and is a no-op otherwise. We stamp `cesoir-signup-ts` on first
 * mount with a user so future analytics can compute time-to-activation.
 *
 * Loading state: render nothing (avoids flashing the nav before auth
 * hydration finishes).
 */

// Routes where the chrome must not render even if a user is somehow
// signed-in (e.g. mid-onboarding redirect, deep-link back to /landing).
// Match by prefix so nested routes (/login/foo) inherit the suppression.
const SUPPRESSED_PREFIXES = [
  "/login",
  "/signup-quick",
  "/register",
  "/landing",
];

function isSuppressed(pathname: string | null): boolean {
  if (!pathname) return false;
  return SUPPRESSED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export default function AppChrome() {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  // Stamp first-session timestamp so the tour can anchor "post-signup"
  // detection. We only write it once — subsequent sessions keep the
  // original stamp and the Tour relies on the completion flag instead.
  useEffect(() => {
    if (!user) return;
    try {
      if (!localStorage.getItem(TOUR_SIGNUP_TS_KEY)) {
        localStorage.setItem(TOUR_SIGNUP_TS_KEY, String(Date.now()));
      }
    } catch {
      // Storage unavailable (Safari Private Mode, embedded webview) —
      // tour will still work, it just won't be anchored to a timestamp.
    }
  }, [user]);

  if (loading) return null;
  if (!user) return null;
  if (isSuppressed(pathname)) return null;

  return (
    <>
      {/* BottomNav partout (user choice 2026-04-20) — pattern mobile-first */}
      <FABMenu />
      <BottomNav />
      <SOSButton />
      <GlobalSearch />
      {/* First-time onboarding overlay — self-gated via localStorage. */}
      <Tour />
    </>
  );
}
