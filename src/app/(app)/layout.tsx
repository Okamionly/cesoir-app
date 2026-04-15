import { Suspense } from "react";
import BottomNav from "@/components/app/BottomNav";
import SOSButton from "@/components/app/SOSButton";
import { FABMenu } from "@/components/app/FABMenu";
import OfflineBanner from "@/components/app/OfflineBanner";
import SeasonalOverlay from "@/components/app/SeasonalOverlay";
import SeasonalBanner from "@/components/app/SeasonalBanner";
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
              <Suspense fallback={null}>
                <SeasonalBanner />
              </Suspense>
              <main id="main-content" className="pb-safe">
                <ErrorBoundary>
                  <PageTransition>{children}</PageTransition>
                </ErrorBoundary>
              </main>
              <FABMenu />
              <BottomNav />
              <SOSButton />
              <Suspense fallback={null}>
                <SeasonalOverlay />
              </Suspense>
            </div>
          </ToastProvider>
        </AccessibilityProvider>
      </DarkModeProvider>
    </AuthProvider>
  );
}
