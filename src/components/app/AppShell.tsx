"use client";

import { useIsMobile } from "@/lib/hooks/useIsMobile";
import { useAccessibility } from "@/components/ui/ReducedMotion";

/**
 * AppShell — transforms the (app) + (auth) route groups from "mobile-first
 * centered content" into a true desktop **app-like experience**: a phone-sized
 * frame floats in the middle of an ambient gradient background, matching the
 * aesthetic of Linear's desktop app or Instagram's desktop shell.
 *
 * Behaviour:
 *   - Mobile (< 768px): passthrough — no frame, no ambient, full-bleed.
 *   - Desktop (>= 768px): ambient gradient + frame at 440px with dramatic
 *     shadow and rounded corners.
 *
 * The landing page (`/`) is NOT wrapped — it has its own cinematic design.
 *
 * Reduced-motion respect: ambient blobs are rendered as static blurs (no
 * pulse/float animation), so `prefers-reduced-motion` users get the same
 * look without motion cost. If we add any animation later, gate it behind
 * `useAccessibility().reducedMotion`.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  // Touched for future-proofing: if we ever animate the ambient blobs, we'll
  // need to know reduced-motion preference here. For now we read it so the
  // hook stays wired and we don't regress the contract.
  const { reducedMotion } = useAccessibility();

  if (isMobile) {
    // Mobile experience untouched — children render as-is.
    return <>{children}</>;
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-bg-card via-bg to-bg-card overflow-hidden">
      {/* Ambient blobs — purely decorative, pointer-events none so they don't
          intercept clicks. Reduced-motion users get the same static blobs;
          no animation attached yet. */}
      {!reducedMotion && (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 -left-24 h-[28rem] w-[28rem] rounded-full bg-accent/10 blur-[120px]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 -right-24 h-[28rem] w-[28rem] rounded-full bg-accent-2/10 blur-[120px]"
          />
        </>
      )}

      {/* Phone frame — 440px, centered, elevated shadow, rounded corners on
          desktop only (md:). The frame is `relative` so its descendants can
          clamp to it via `absolute`/`fixed` with transforms. */}
      <div
        data-app-shell-frame="true"
        className="relative mx-auto max-w-[440px] min-h-screen bg-bg md:my-6 md:min-h-[calc(100vh-48px)] md:rounded-[44px] md:overflow-hidden md:border md:border-border md:shadow-[0_40px_80px_-20px_rgba(17,17,17,0.25),0_0_0_1px_rgba(139,92,246,0.05)]"
      >
        {children}
      </div>
    </div>
  );
}
