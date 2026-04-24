"use client";

/**
 * /matches — list of mutual matches (patrol #10, 2026-04-24).
 *
 * Previously 404 — the route was referenced by BottomNav and FAB actions
 * but the page component was never created. Patrol navigator caught it.
 *
 * Approach: reuse `useConversations` (already returns mutual matches with
 * the peer profile + last message preview) and render a grid of avatar
 * tiles that each link to `/chat/[conversationId]`. Keeps the layout
 * light — /chat (full conversation thread list) remains the richer view.
 *
 * Empty state ships with a clear CTA back to `/browse` so a fresh user
 * never dead-ends here.
 */

import Link from "next/link";
import Image from "next/image";
import { m } from "motion/react";
import { useConversations } from "@/lib/useConversations";
import type { ConversationPreview } from "@/lib/useConversations";
import { MODES, type ModeKey } from "@/lib/modes";
import { springs } from "@/lib/motion-design";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";

function avatarColor(mode: string | null): string {
  if (!mode || !(mode in MODES)) return "var(--color-accent)";
  return MODES[mode as ModeKey].color;
}

function MatchTile({ convo }: { convo: ConversationPreview }) {
  const color = avatarColor(convo.mode);
  return (
    <m.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springs.snap}
      className="flex flex-col items-center gap-2"
    >
      <Link
        href={`/chat/${convo.id}`}
        className="group relative block w-full"
        aria-label={`Ouvrir le chat avec ${convo.peer.name}`}
      >
        <div className="aspect-square w-full rounded-2xl overflow-hidden ring-1 ring-border bg-card transition-shadow group-hover:shadow-lg">
          {convo.peer.avatar_url ? (
            <Image
              src={convo.peer.avatar_url}
              alt={convo.peer.name}
              width={160}
              height={160}
              className="w-full h-full object-cover"
              sizes="(max-width: 440px) 45vw, 180px"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-4xl font-bold text-white"
              style={{ background: color }}
              aria-hidden="true"
            >
              {convo.peer.name[0]}
            </div>
          )}
        </div>
      </Link>
      <span className="text-sm font-medium truncate w-full text-center">
        {convo.peer.name}
      </span>
    </m.div>
  );
}

export default function MatchesPage() {
  const { conversations, loading } = useConversations();

  return (
    <div className="min-h-screen bg-bg pb-20">
      <PageHeader title="Mes matches" backHref="/feed" />

      <div className="px-4 pt-4">
        {loading && (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square rounded-2xl bg-card animate-pulse"
                aria-hidden="true"
              />
            ))}
          </div>
        )}

        {!loading && conversations.length === 0 && (
          <div className="pt-8">
            <EmptyState
              emoji="💫"
              title="Aucun match pour l'instant"
              subtitle="Commence à swiper pour rencontrer des profils autour de toi ce soir."
              actionLabel="Découvrir"
              actionHref="/browse"
            />
          </div>
        )}

        {!loading && conversations.length > 0 && (
          <div className="grid grid-cols-2 gap-3" role="list">
            {conversations.map((convo) => (
              <div key={convo.id} role="listitem">
                <MatchTile convo={convo} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
