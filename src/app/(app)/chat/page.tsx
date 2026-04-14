"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useConversations } from "@/lib/useChat";
import type { ConversationWithPeer } from "@/lib/useChat";
import { MODES } from "@/lib/modes";
import type { ModeKey } from "@/lib/modes";
import SparkTimer from "@/components/chat/SparkTimer";

// Mock matched-at times for demo (each convo matched at different times)
const MOCK_MATCHED_AT: Record<string, string> = {
  "1": new Date(Date.now() - 3600 * 1000).toISOString(),      // 1h ago
  "2": new Date(Date.now() - 5400 * 1000).toISOString(),      // 1h30 ago
  "3": new Date(Date.now() - 6800 * 1000).toISOString(),      // ~1h53 ago
  "4": new Date(Date.now() - 1200 * 1000).toISOString(),      // 20min ago
};

// ---------- Mock data (fallback when not logged in) ----------

const mockChats: ConversationWithPeer[] = [
  { id: "1", peer: { id: "m1", name: "Sarah", avatar_url: null, is_online: true }, lastMessage: "Super ! On se retrouve a 20h au resto ?", lastMessageAt: new Date().toISOString(), unreadCount: 2, mode: "solo-diner" },
  { id: "2", peer: { id: "m2", name: "Claire", avatar_url: null, is_online: true }, lastMessage: "Rex est trop content ! A tout a l'heure", lastMessageAt: new Date().toISOString(), unreadCount: 1, mode: "dog-date" },
  { id: "3", peer: { id: "m3", name: "Marta", avatar_url: null, is_online: false }, lastMessage: "Perfecto ! Hablamos en espanol et francais", lastMessageAt: new Date().toISOString(), unreadCount: 0, mode: "langue" },
  { id: "4", peer: { id: "m4", name: "Thomas", avatar_url: null, is_online: false }, lastMessage: "J'ai pris les places, RDV devant le cinema", lastMessageAt: new Date().toISOString(), unreadCount: 0, mode: "plus-one" },
];

// ---------- Helpers ----------

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) {
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) {
    return d.toLocaleDateString("fr-FR", { weekday: "short" });
  }
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function getModeInfo(mode: string | null) {
  if (!mode || !(mode in MODES)) return null;
  return MODES[mode as ModeKey];
}

function getAvatarColor(mode: string | null): string {
  const info = getModeInfo(mode);
  return info?.color ?? "#8B5CF6";
}

// ---------- Sub-components ----------

function ConversationRow({ convo }: { convo: ConversationWithPeer }) {
  const modeInfo = getModeInfo(convo.mode);
  const hasUnread = convo.unreadCount > 0;
  const avatarColor = getAvatarColor(convo.mode);

  return (
    <Link
      href={`/chat/${convo.id}`}
      role="listitem"
      className="flex items-center gap-3.5 px-4 py-3.5 active:bg-bg-card transition-colors cursor-pointer border-b border-border/50"
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        {convo.peer.avatar_url ? (
          <img
            src={convo.peer.avatar_url}
            alt={convo.peer.name}
            className="w-14 h-14 rounded-full object-cover"
          />
        ) : (
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-white"
            style={{ background: avatarColor }}
          >
            {convo.peer.name[0]}
          </div>
        )}
        {convo.peer.is_online && (
          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-safe border-2 border-bg" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className={`text-[15px] ${hasUnread ? "font-bold text-text" : "font-semibold text-text"}`}>
            {convo.peer.name}
          </span>
          <div className="flex items-center gap-1.5">
            {MOCK_MATCHED_AT[convo.id] && (
              <SparkTimer matchedAt={MOCK_MATCHED_AT[convo.id]} compact />
            )}
            <span className={`text-[11px] ${hasUnread ? "text-accent font-semibold" : "text-text-muted"}`}>
              {formatTime(convo.lastMessageAt)}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className={`text-[13px] truncate ${hasUnread ? "text-text font-medium" : "text-text-muted"}`}>
            {convo.lastMessage ?? "Aucun message"}
          </p>
          {hasUnread && (
            <span className="shrink-0 w-5 h-5 gradient-bg rounded-full flex items-center justify-center text-[10px] font-bold text-white">
              {convo.unreadCount}
            </span>
          )}
        </div>
        {modeInfo && (
          <span className="text-[10px] text-text-muted mt-0.5">
            {modeInfo.icon} {modeInfo.name}
          </span>
        )}
      </div>
    </Link>
  );
}

function MatchBubble({ convo }: { convo: ConversationWithPeer }) {
  const avatarColor = getAvatarColor(convo.mode);

  return (
    <Link
      href={`/chat/${convo.id}`}
      className="shrink-0 flex flex-col items-center gap-1.5 cursor-pointer"
      role="listitem"
    >
      <div className="relative">
        {convo.peer.avatar_url ? (
          <img
            src={convo.peer.avatar_url}
            alt={convo.peer.name}
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
  const { user } = useAuth();
  const { conversations: realConversations, loading } = useConversations(user?.id);

  // fallback to mock data when not logged in
  const conversations = user && realConversations.length > 0 ? realConversations : mockChats;
  const withUnread = conversations.filter((c) => c.unreadCount > 0);
  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-bg/95 backdrop-blur-md border-b border-border px-4 pt-2 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg text-accent" aria-hidden="true">&#9790;</span>
            <span className="text-base font-bold">Messages</span>
          </div>
          <div className="flex items-center gap-1.5">
            {totalUnread > 0 && (
              <>
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" aria-hidden="true" />
                <span className="text-[11px] text-accent font-semibold">
                  {totalUnread} nouveau{totalUnread > 1 ? "x" : ""}
                </span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Loading state */}
      {user && loading && (
        <div className="flex justify-center items-center py-12">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
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
            {/* Empty slots */}
            {withUnread.length < 4 &&
              Array.from({ length: Math.max(0, 3 - withUnread.length) }).map((_, i) => (
                <div key={`empty-${i}`} className="shrink-0 flex flex-col items-center gap-1.5 opacity-30" aria-hidden="true">
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-border flex items-center justify-center text-xl text-text-muted">?</div>
                  <span className="text-[11px] font-semibold text-text-muted">...</span>
                </div>
              ))}
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
      <div role="list" aria-label="Conversations">
        <p className="text-[10px] text-text-muted uppercase tracking-widest font-semibold px-4 pt-4 pb-2">Conversations</p>
        {conversations.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="w-16 h-16 rounded-full gradient-bg-subtle border border-accent/20 flex items-center justify-center mb-4">
              <span className="text-2xl">💬</span>
            </div>
            <p className="text-sm text-text-muted">Aucune conversation</p>
            <p className="text-xs text-text-muted mt-1">Explore les profils et envoie un message !</p>
          </div>
        )}
        {conversations.map((convo) => (
          <ConversationRow key={convo.id} convo={convo} />
        ))}
      </div>
    </div>
  );
}
