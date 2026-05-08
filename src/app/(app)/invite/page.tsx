/**
 * /invite — public invite landing page (W2-7).
 *
 * Dual purpose:
 *  1. Authenticated users: launch share sheet directly / see leaderboard
 *  2. Unauthenticated: nudge to sign up (conversion funnel)
 *
 * This is a server component for SEO. Client interactivity (share + auth)
 * is isolated in <InviteClientSection>.
 */

import type { Metadata } from "next";
import InviteClientSection from "./InviteClientSection";

export const metadata: Metadata = {
  title: "Invite tes amis sur CeSoir — gagne des roses",
  description:
    "Partage ton code invite CeSoir et gagne 5 roses pour chaque ami qui s'inscrit. Plus tu invites, plus tu matches.",
  openGraph: {
    title: "Invite tes amis sur CeSoir",
    description: "5 roses pour toi et ton ami a chaque inscription. Rejoins CeSoir ce soir.",
    locale: "fr_FR",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function InvitePage() {
  return (
    <main id="main-content" role="main" className="min-h-screen bg-bg pb-24">
      <InviteClientSection />
    </main>
  );
}
