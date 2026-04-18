import SceneController from "@/components/landing/SceneController";

/**
 * CeSoir Landing — Single-page morphic cinematic experience.
 *
 * Everything lives inside SceneController: full viewport (h-screen),
 * no vertical scroll, mouse wheel + keyboard + touch + scrubber navigate
 * between 3 scenes. Legal links are embedded discreetly in the bottom
 * overlay of SceneController — no separate footer to avoid the dead
 * black zone below the fold.
 */
export default function LandingPage() {
  return <SceneController />;
}
