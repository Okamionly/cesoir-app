import { AuthProvider } from "@/context/AuthContext";
import LazyMotionProvider from "@/components/ui/LazyMotionProvider";
import { AccessibilityProvider } from "@/components/ui/ReducedMotion";
import AppShell from "@/components/app/AppShell";

/**
 * AuthLayout — login/register/forgot-password/onboarding.
 *
 * Wraps children in the same `AppShell` as the (app) group so the desktop
 * phone-frame experience is continuous from sign-in through the authed
 * product. Mobile behaviour is unchanged (AppShell passes through).
 *
 * AccessibilityProvider is required because AppShell reads
 * `useAccessibility()` to decide whether to paint the ambient blobs.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AccessibilityProvider>
        <LazyMotionProvider>
          <AppShell>{children}</AppShell>
        </LazyMotionProvider>
      </AccessibilityProvider>
    </AuthProvider>
  );
}
