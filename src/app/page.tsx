import SceneController from "@/components/landing/SceneController";
import LazyMotionProvider from "@/components/ui/LazyMotionProvider";

/**
 * CeSoir Landing — Single-page morphic cinematic experience.
 *
 * Everything lives inside SceneController: full viewport (h-screen),
 * no vertical scroll, mouse wheel + keyboard + touch + scrubber navigate
 * between 3 scenes. Legal links are embedded discreetly in the bottom
 * overlay of SceneController — no separate footer to avoid the dead
 * black zone below the fold.
 *
 * The <main id="main-content"> wrapper anchors the layout skip-link and
 * satisfies WCAG 1.3.1 / 2.4.1. SceneController also emits its own h1
 * inside scene 0 (SSR-painted, no initial-hidden state) so Chrome has
 * a real LCP candidate and screen readers get heading structure.
 *
 * Bundle optimization (2026-04-19):
 *   LazyMotionProvider wraps SceneController so motion feature code
 *   (domMax: animation + drag + layout + pan, ~25KB) loads in a deferred
 *   chunk instead of blocking the landing entry bundle.
 */
export default function LandingPage() {
  return (
    <main id="main-content" role="main">
      <LazyMotionProvider>
        <SceneController />
      </LazyMotionProvider>
    </main>
  );
}
