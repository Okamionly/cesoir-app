"use client";

// ========================================
// Speed Dating — stub (2026-04-20 mock cleanup)
// ========================================
//
// The full virtual speed-dating flow (rounds + timer + mutual likes) lived
// here as a pure prototype driven by in-memory mock partners. The backend
// for matching, video rooms, and mutual-like reveal is not yet wired up, so
// we render a premium EmptyState until the real-time speed-dating service
// ships. See roadmap entry "speed-dating: realtime matching" for status.

import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";

export default function SpeedDatingPage() {
  return (
    <div className="min-h-screen bg-bg pb-28">
      <PageHeader
        title="Speed Dating Virtuel"
        icon={<span className="text-lg" aria-hidden="true">{"\uD83D\uDC95"}</span>}
      />
      <EmptyState
        emoji={"\u23F1\uFE0F"}
        title="Speed dating bientot disponible"
        subtitle="On finalise le matching en temps reel et les salons video. En attendant, explore les profils autour de toi."
        actionLabel="Explorer les profils"
        actionHref="/browse"
      />
    </div>
  );
}
