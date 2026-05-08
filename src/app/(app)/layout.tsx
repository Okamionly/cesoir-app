import { Suspense } from "react";
import { MotionConfig } from "motion/react";
import AppChrome from "@/components/app/AppChrome";
import AppShell from "@/components/app/AppShell";
import GamificationToasts from "@/components/app/GamificationToasts";
import KeyboardShortcuts from "@/components/app/KeyboardShortcuts";
import OfflineBanner from "@/components/app/OfflineBanner";
import PageLoader from "@/components/app/PageLoader";
import InstallPromptBanner from "@/components/pwa/InstallPromptBanner";
import { DarkModeProvider } from "@/components/ui/DarkModeProvider";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { LazyMotionMaxProvider } from "@/components/ui/LazyMotionProvider";
import { ToastProvider } from "@/components/ui/Toast";
import LiveRegion from "@/components/ui/LiveRegion";
import { AccessibilityProvider } from "@/components/ui/ReducedMotion";
import { AuthProvider } from "@/context/AuthContext";
import PageTransition from "@/components/ui/PageTransition";

/**
 * AppLayout — providers + chrome for the (app) route group.
 *
 * Audit 2026-04-19 (QA sprint 5 regression): this layout had the bottom
 * nav + FAB + SOS imported directly, which leaked on anonymous public
 * pages (/about, /cgu, /privacy, /why-free) that live in the same route
 * group. `AppChrome` wraps those floating elements and gates them on
 * `useAuth().user` — nothing renders pre-login.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DarkModeProvider>
        <AccessibilityProvider>
          {/*
            MotionConfig reducedMotion="user" — WCAG 2.3.3 fix 2026-05-07:
            Previous value was "never" (bug fix 2026-04-19) because motion/react's
            useReducedMotion() returned true and stuck opacity:0 on some pages.

            Root cause of the 2026-04-19 bug: those pages used initial="hidden"
            without a fallback `layout` or explicit `initial={false}` guard.
            The real fix is at the component level (don't rely on motion JS for
            initial state — rely on CSS). The CSS @media (prefers-reduced-motion)
            already clamps durations to 0.01ms so animations are imperceptible.

            With "user": components that call useReducedMotion() now correctly
            get the OS setting, enabling JS-level branching (skip animations,
            disable 3D tilt, etc.). The CSS layer remains as a safety net.
            The stuck-opacity issue is handled by:
              1. AccessibilityProvider's `.cesoir-reduced-motion` class
              2. globals.css @media (prefers-reduced-motion) clamping
            Both set transition-duration/animation-duration to 0.01ms so the
            "hidden → visible" transition completes in 0.01ms = instant.
          */}
          <MotionConfig reducedMotion="user">
            <LazyMotionMaxProvider>
              <ToastProvider>
                {/*
                  AppShell wraps children in a phone-frame on desktop (>=768px)
                  and passes through untouched on mobile. Keeps the long-standing
                  min-h-screen + bg-bg contract but the visual container is now
                  the frame, and the outer gradient provides ambient depth.
                */}
                <AppShell>
                  <OfflineBanner />
                  {/*
                    InstallPromptBanner self-gates on pathname === "/browse"
                    and engagement signals (>= 2 min + >= 3 swipes), so
                    mounting it here is safe — it renders nothing on every
                    other route. Sits above the OfflineBanner z-index when
                    both happen to be visible (rare).
                  */}
                  <InstallPromptBanner />
                  <main id="main-content" className="pb-safe">
                    <ErrorBoundary>
                      <PageTransition>
                        <Suspense fallback={<PageLoader />}>
                          {children}
                        </Suspense>
                      </PageTransition>
                    </ErrorBoundary>
                  </main>
                  <AppChrome />
                </AppShell>
                {/*
                  KeyboardShortcuts sits OUTSIDE AppShell so its full-viewport
                  overlay isn't clamped to 440px. It self-gates on !isMobile
                  and renders nothing otherwise.
                */}
                <KeyboardShortcuts />
                {/*
                  GamificationToasts is mounted ONCE here so level-up + badge
                  unlock notifications surface globally regardless of which
                  page the user is on. It owns its own FIFO queue and renders
                  at z = toast + 1 so it sits above the standard ToastProvider
                  but below cinematic-tier overlays (MatchCinematic = debug).
                */}
                <GamificationToasts />
                {/*
                  LiveRegion — global SR announcement singleton (a11y round 2,
                  2026-04-27). Two visually-hidden aria-live regions (polite +
                  assertive) that any component can target via
                  `announceToSR("...")`. Replaces ad-hoc aria-live attributes
                  scattered across the app.
                */}
                <LiveRegion />
              </ToastProvider>
            </LazyMotionMaxProvider>
          </MotionConfig>
        </AccessibilityProvider>
      </DarkModeProvider>
    </AuthProvider>
  );
}
