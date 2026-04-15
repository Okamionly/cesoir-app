import { Suspense } from "react";
import BottomNav from "@/components/app/BottomNav";
import SOSButton from "@/components/app/SOSButton";
import { FABMenu } from "@/components/app/FABMenu";
import OfflineBanner from "@/components/app/OfflineBanner";
import PageLoader from "@/components/app/PageLoader";
import { DarkModeProvider } from "@/components/ui/DarkModeProvider";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { ToastProvider } from "@/components/ui/Toast";
import { AccessibilityProvider } from "@/components/ui/ReducedMotion";
import { AuthProvider } from "@/context/AuthContext";
import PageTransition from "@/components/ui/PageTransition";

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
              <FABMenu />
              <BottomNav />
              <SOSButton />
            </div>
          </ToastProvider>
        </AccessibilityProvider>
      </DarkModeProvider>
    </AuthProvider>
  );
}
