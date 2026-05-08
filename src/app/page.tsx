import type { Metadata } from "next";
import SceneController from "@/components/landing/SceneController";
import LazyMotionProvider from "@/components/ui/LazyMotionProvider";

/**
 * Landing-specific metadata — overrides the root layout defaults.
 * Optimized for social sharing (WhatsApp, Instagram DMs, Twitter/X)
 * and organic search ("rencontre Montpellier", "app dating ce soir").
 *
 * opengraph-image.tsx is auto-wired by Next.js (Edge Runtime ImageResponse) —
 * no explicit images field needed; hardcoding would override and 404.
 *
 * W2-10: Full metadata pass — keywords, canonical, OG complete, Twitter card.
 */
export const metadata: Metadata = {
  title: "CeSoir — Personne ne dine seul ce soir a Montpellier",
  description:
    "Trouve quelqu'un pour ce soir a Montpellier. Gratuit, sans abonnement. Matching en 90 secondes. 4 modes : romantique, amitie, networking, plan flash.",
  keywords: [
    "rencontre Montpellier",
    "app dating Montpellier",
    "sortir ce soir Montpellier",
    "plan ce soir",
    "dating gratuit France",
    "rencontre immedite",
    "celibataire Montpellier",
    "application rencontre gratuite",
    "plan flash",
    "matching local",
  ].join(", "),
  alternates: {
    canonical: "https://cesoir-app.vercel.app",
  },
  openGraph: {
    title: "CeSoir — Personne ne dine seul ce soir a Montpellier",
    description:
      "Gratuit. Pres de chez toi. Pour de vrai. Trouve quelqu'un en 90 secondes.",
    locale: "fr_FR",
    type: "website",
    url: "https://cesoir-app.vercel.app",
    siteName: "CeSoir",
  },
  twitter: {
    card: "summary_large_image",
    title: "CeSoir — Trouve quelqu'un pour ce soir",
    description:
      "Personne ne dine seul a Montpellier. 90 secondes pour matcher. Gratuit, toujours.",
    site: "@cesoir_app",
  },
};

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
