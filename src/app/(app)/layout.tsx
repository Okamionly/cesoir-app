import { Suspense } from "react";
import AppChrome from "@/components/app/AppChrome";
import OfflineBanner from "@/components/app/OfflineBanner";
import PageLoader from "@/components/app/PageLoader";
import { DarkModeProvider } from "@/components/ui/DarkModeProvider";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
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
        </AccessibilityProvider>
      </DarkModeProvider>
    </AuthProvider>
  );
}
