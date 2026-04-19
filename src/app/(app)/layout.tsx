import { Suspense } from "react";
import { MotionConfig } from "motion/react";
import AppChrome from "@/components/app/AppChrome";
import OfflineBanner from "@/components/app/OfflineBanner";
import PageLoader from "@/components/app/PageLoader";
import { DarkModeProvider } from "@/components/ui/DarkModeProvider";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import LazyMotionProvider from "@/components/ui/LazyMotionProvider";
import { ToastProvider } from "@/components/ui/Toast";
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
            MotionConfig reducedMotion="never" — bug report 2026-04-19:
            motion/react's default useReducedMotion detection was returning
            true for some users (OS prefers-reduced-motion), and the
            `initial="hidden" animate="visible"` variants pattern was
            staying stuck at the hidden state (opacity:0) on /profile,
            /settings, /safety, /profile/edit, /profile/privacy,
            /modes/solo-diner.

            We disable motion/react's own reduced-motion detection here
            and rely on:
              1. globals.css `@media (prefers-reduced-motion: reduce)`
                 clamp on transition-duration (0.01ms) and animation-
                 duration for visual concerns
              2. AccessibilityProvider body class `.cesoir-reduced-motion`
                 that applies the same clamp via !important
            This way motion/react always applies the animate state
            (opacity:1), and CSS keeps the accessibility contract.
          */}
          <MotionConfig reducedMotion="never">
            <LazyMotionProvider>
              <ToastProvider>
                <div className="min-h-screen bg-bg">
                  <OfflineBanner />
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
                </div>
              </ToastProvider>
            </LazyMotionProvider>
          </MotionConfig>
        </AccessibilityProvider>
      </DarkModeProvider>
    </AuthProvider>
  );
}
