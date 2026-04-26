"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { m } from "motion/react";
import { useConversations } from "@/lib/useConversations";
import type { ConversationPreview } from "@/lib/useConversations";
import { MODES } from "@/lib/modes";
import type { ModeKey } from "@/lib/modes";
import { springs } from "@/lib/motion-design";
import { FlashNoteReceived } from "@/components/chat/FlashNote";
import PageHeader from "@/components/ui/PageHeader";
import { ConversationRow } from "@/components/messages/ConversationRow";
import { EmptyConversations } from "@/components/messages/EmptyConversations";

// Flash notes and new-match IDs come from backend hooks — empty until wired.
// TODO: wire to useFlashNotes() + backend "new_match" flag on conversations.
const FLASH_NOTES: Array<{ id: string; senderName: string; message: string; time: string }> = [];
const NEW_MATCH_IDS: Set<string> = new Set();

// ---------- Helpers ----------

function getModeInfo(mode: string | null) {
  if (!mode || !(mode in MODES)) return null;
  return MODES[mode as ModeKey];
}

function getAvatarColor(mode: string | null): string {
  const info = getModeInfo(mode);
  return info?.color ?? "var(--color-accent)";
}

// ---------- Sub-components ----------

function MatchBubble({ convo }: { convo: ConversationPreview }) {
  const avatarColor = getAvatarColor(convo.mode);

  return (
    <Link
      href={`/chat/${convo.id}`}
      className="shrink-0 flex flex-col items-center gap-1.5 cursor-pointer"
      role="listitem"
    >
      <div className="relative">
        {convo.peer.avatar_url ? (
          <Image
            src={convo.peer.avatar_url}
            alt={convo.peer.name}
            width={64}
            height={64}
            className="w-16 h-16 rounded-full object-cover ring-2 ring-accent ring-offset-2 ring-offset-bg"
          />
        ) : (
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white ring-2 ring-accent ring-offset-2 ring-offset-bg"
            style={{ background: avatarColor }}
          >
            {convo.peer.name[0]}
          </div>
        )}
        {convo.peer.is_online && (
          <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-safe border-2 border-bg" aria-label="En ligne" />
        )}
        {convo.unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 gradient-bg rounded-full flex items-center justify-center text-[10px] font-bold text-white">
            {convo.unreadCount}
          </div>
        )}
      </div>
      <span className="text-[11px] font-semibold text-text">{convo.peer.name}</span>
    </Link>
  );
}

// ---------- Main page ----------

export default function ChatPage() {
  const { conversations, loading, totalUnread, refresh } = useConversations();

  const withUnread = conversations.filter((c) => c.unreadCount > 0);
  const displayUnread = totalUnread;

  /**
   * Track which row (if any) is currently hovered so siblings can shrink.
   * null = nothing hovered.
   */
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  // Locally-archived / deleted / pinned rows — non-persistent, UI demo only.
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());

  const visibleConversations = conversations.filter((c) => !hiddenIds.has(c.id));
  const pinned = visibleConversations.filter((c) => pinnedIds.has(c.id));
  const regular = visibleConversations.filter((c) => !pinnedIds.has(c.id));

  const handleArchive = useCallback((id: string) => {
    setHiddenIds((prev) => new Set(prev).add(id));
  }, []);
  const handleDelete = useCallback((id: string) => {
    setHiddenIds((prev) => new Set(prev).add(id));
  }, []);
  const handlePin = useCallback((id: string) => {
    setPinnedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // --- Pull-to-refresh ---
  const mainRef = useRef<HTMLDivElement>(null);
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const touchStartY = useRef(0);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (refreshing) return;
    const el = mainRef.current;
    if (el && el.scrollTop > 0) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0) {
      setPullY(Math.min(delta * 0.4, 80));
    }
  }, [refreshing]);

  const onTouchEnd = useCallback(async () => {
    if (pullY > 50) {
      setRefreshing(true);
      await refresh();
      await new Promise((r) => setTimeout(r, 800));
      setRefreshing(false);
    }
    setPullY(0);
  }, [pullY, refresh]);

  return (
    <div
      ref={mainRef}
      className="min-h-screen bg-bg overflow-y-auto"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      {(pullY > 0 || refreshing) && (
        <div
          className="shrink-0 flex items-center justify-center overflow-hidden transition-all"
          style={{ height: refreshing ? 40 : pullY }}
        >
          <m.div
            className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full"
            animate={{ rotate: refreshing ? 360 : pullY * 3 }}
            transition={refreshing ? { repeat: Infinity, duration: 0.6, ease: "linear" } : { duration: 0 }}
          />
        </div>
      )}

      <PageHeader
        title="Messages"
        icon={<span className="text-lg text-accent">☾</span>}
        iconAnimation="rotate"
        actions={
          displayUnread > 0 ? (
            <m.span
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-accent/15"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={springs.elastic}
            >
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" aria-hidden="true" />
              <span className="text-[11px] text-accent font-semibold">
                {displayUnread} nouveau{displayUnread > 1 ? "x" : ""}
              </span>
            </m.span>
          ) : null
        }
      />

      {/* FlashNotes recus */}
      {FLASH_NOTES.length > 0 && (
        <div className="px-4 py-3 border-b border-border">
          <p className="text-[10px] text-text-muted uppercase tracking-widest font-semibold mb-2">
            FlashNotes recus
          </p>
          {FLASH_NOTES.map((fn) => (
            <FlashNoteReceived
              key={fn.id}
              senderName={fn.senderName}
              message={fn.message}
              time={fn.time}
              onReply={() => {
                // Navigate to chat or open compose.
              }}
            />
          ))}
        </div>
      )}

      {/* Quick-action row */}
      <div className="flex gap-2 px-4 py-3 border-b border-border">
        <Link
          href="/rooms"
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent/5 border border-accent/15 text-[13px] font-semibold text-accent hover:bg-accent/10 transition-colors tap-target"
        >
          <span aria-hidden="true">📞</span>
          Salons
        </Link>
        <Link
          href="/speed-dating"
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent/5 border border-accent/15 text-[13px] font-semibold text-accent hover:bg-accent/10 transition-colors tap-target"
        >
          <span aria-hidden="true">⚡</span>
          Speed Dating
        </Link>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="px-4 py-3 space-y-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3.5 py-3.5 animate-pulse">
              <div className="w-14 h-14 rounded-full bg-border/50 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-24 rounded bg-border/50" />
                  <div className="h-3 w-10 rounded bg-border/30" />
                </div>
                <div className="h-3 w-48 rounded bg-border/30" />
                <div className="h-2.5 w-16 rounded bg-border/20" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Matches bar */}
      {withUnread.length > 0 && (
        <div className="px-4 py-4 border-b border-border">
          <p className="text-[10px] text-text-muted uppercase tracking-widest font-semibold mb-3">Nouveaux matchs</p>
          <div className="flex gap-4 overflow-x-auto no-scrollbar" role="list" aria-label="Nouveaux matchs">
            {withUnread.map((convo) => (
              <MatchBubble key={convo.id} convo={convo} />
            ))}
            {/* 2026-04-26 fix: empty "?" placeholder slots looked like ghost
                users (UX confusion — Youssef + 2× "?" + "..."). Replaced with
                a single actionable "+" CTA that points the user to /browse to
                find more matches. Only shows when fewer than 4 new matches. */}
            {withUnread.length < 4 && (
              <Link
                href="/browse"
                className="shrink-0 flex flex-col items-center gap-1.5 group"
                aria-label="Trouve plus de matchs"
              >
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-accent/30 group-hover:border-accent/60 group-hover:bg-accent/5 flex items-center justify-center text-2xl text-accent/60 group-hover:text-accent transition-all">
                  +
                </div>
                <span className="text-[11px] font-semibold text-accent/70 group-hover:text-accent transition-colors">Trouve</span>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Icebreakers */}
      <div className="px-4 py-4 border-b border-border">
        <p className="text-[10px] text-text-muted uppercase tracking-widest font-semibold mb-3">Brise-glaces suggeres</p>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {[
            { text: "Tu recommandes quoi comme resto ce soir ?", mode: "🍽️" },
            { text: "Ton chien s'entend bien avec les autres ?", mode: "🐶" },
            { text: "On se retrouve ou pour pratiquer ?", mode: "🌐" },
            { text: "C'est quoi ton plan pour ce soir ?", mode: "⭐" },
          ].map((ice, i) => (
            <button key={i} className="shrink-0 bg-accent/5 border border-accent/15 rounded-xl px-3.5 py-2.5 text-left max-w-[200px] hover:border-accent/30 transition-colors tap-target">
              <span className="text-[10px] text-accent font-semibold block mb-1">{ice.mode} Suggestion</span>
              <span className="text-[12px] text-text-soft leading-snug">{ice.text}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat list */}
      {!loading && (
        <>
          {visibleConversations.length === 0 ? (
            <EmptyConversations />
          ) : (
            <div
              onMouseLeave={() => setHoveredId(null)}
              aria-live="polite"
            >
              {pinned.length > 0 && (
                <div role="list" aria-label="Conversations epinglees">
                  <p className="text-[10px] text-accent uppercase tracking-widest font-semibold px-4 pt-4 pb-2 flex items-center gap-1.5">
                    <span aria-hidden="true">{"\u{1F4CC}"}</span>
                    Epinglees
                  </p>
                  {pinned.map((convo, i) => (
                    <ConversationRow
                      key={convo.id}
                      convo={convo}
                      index={i}
                      isHovered={hoveredId === convo.id}
                      isAnyHovered={hoveredId !== null}
                      onHoverStart={() => setHoveredId(convo.id)}
                      onHoverEnd={() =>
                        setHoveredId((id) => (id === convo.id ? null : id))
                      }
                      onArchive={handleArchive}
                      onDelete={handleDelete}
                      onPin={handlePin}
                      matchedAt={convo.createdAt}
                      isNewMatch={NEW_MATCH_IDS.has(convo.id)}
                    />
                  ))}
                </div>
              )}

              <div role="list" aria-label="Conversations">
                <p className="text-[10px] text-text-muted uppercase tracking-widest font-semibold px-4 pt-4 pb-2">
                  Conversations
                </p>
                {regular.map((convo, i) => (
                  <ConversationRow
                    key={convo.id}
                    convo={convo}
                    index={i}
                    isHovered={hoveredId === convo.id}
                    isAnyHovered={hoveredId !== null}
                    onHoverStart={() => setHoveredId(convo.id)}
                    onHoverEnd={() =>
                      setHoveredId((id) => (id === convo.id ? null : id))
                    }
                    onArchive={handleArchive}
                    onDelete={handleDelete}
                    onPin={handlePin}
                    matchedAt={convo.createdAt}
                    isNewMatch={NEW_MATCH_IDS.has(convo.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
