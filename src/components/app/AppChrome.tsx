"use client";

import { useAuth } from "@/context/AuthContext";
import BottomNav from "@/components/app/BottomNav";
import SOSButton from "@/components/app/SOSButton";
import { FABMenu } from "@/components/app/FABMenu";

/**
 * AppChrome — gates the floating app UI (bottom nav, FAB, SOS) on the
 * authenticated state.
 *
 * QA 2026-04-19 caught: BottomNav was leaking on public pages (/about,
 * /cgu, /privacy, /why-free) because they sit inside the (app) route
 * group and inherit the layout. Anonymous visitors saw nav items they
 * couldn't use. This wrapper hides them when no user is present.
 *
 * Loading state: render nothing (avoids flashing the nav before auth
 * hydration finishes).
 */
export default function AppChrome() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return null;

  return (
    <>
      {/* BottomNav partout (user choice 2026-04-20) — pattern mobile-first */}
      <FABMenu />
      <BottomNav />
      <SOSButton />
    </>
  );
}
