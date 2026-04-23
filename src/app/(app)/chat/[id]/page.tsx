"use client";

import { use, useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { m, AnimatePresence, useReducedMotion } from "motion/react";
import { chatVariants, springs } from "@/lib/motion-design";
import { useAuth } from "@/context/AuthContext";
import { useChat, useTypingIndicator, useConversationPresence } from "@/lib/useChat";
import { supabase } from "@/lib/supabase";
import type { DbProfile, DbConversation } from "@/lib/supabase";
import ErrorState from "@/components/ui/ErrorState";
import { MODES } from "@/lib/modes";
import type { ModeKey } from "@/lib/modes";
import { haptics } from "@/lib/haptics";
import { TypingIndicator as PeerTypingIndicator } from "@/components/messages/TypingIndicator";

// Chat feature components
import SparkTimer from "@/components/chat/SparkTimer";
import { VoiceRecordButton, VoiceNoteBubble } from "@/components/chat/VoiceNote";
import { ReactionWrapper, type Reaction } from "@/components/chat/EmojiReaction";
import { PlanProposalButton, PlanCard, type PlanData } from "@/components/chat/PlanProposal";
import { LocationShareButton, LocationCard } from "@/components/chat/LocationShare";
import { IceBreakerButton, GameCard, type GameData } from "@/components/chat/IceBreakerGame";
import { PlaylistShareButton, SharedPlaylist, MusicCard, EMPTY_SHARED_PLAYLIST, type SongData } from "@/components/chat/PlaylistShare";
import { PlusMenu } from "@/components/chat/PlusMenu";
import EventInviteButton from "@/components/chat/EventInviteButton";
import VibeCheck, { VibeCheckButton } from "@/components/chat/VibeCheck";
import AIWingman from "@/components/chat/AIWingman";
import QuickReact from "@/components/chat/QuickReact";
import WeMetFeedback from "@/components/app/WeMetFeedback";
import { screenMessage } from "@/lib/messageScreening";
import type { ScreeningResult } from "@/lib/messageScreening";
import { ChevronRight, ArrowLeft, Send } from "@/components/ui/lucide";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";

// ---------- Types for special messages ----------

interface SpecialMessage {
  id: string;
  type: "voice" | "plan" | "location" | "game" | "music";
  isOwn: boolean;
  createdAt: string;
  voiceDuration?: number;
  plan?: PlanData;
  lat?: number;
  lng?: number;
  game?: GameData;
  songs?: SongData[];
}

// ---------- Sub-components ----------

// Local wrappers preserve previous call sites + custom defaults.
function BackArrow({ size = 22, className = "" }: { size?: number; className?: string }) {
  return <ArrowLeft size={size} strokeWidth={1.5} className={className} aria-hidden="true" />;
}

function SendIcon({ size = 20, className = "" }: { size?: number; className?: string }) {
  return <Send size={size} strokeWidth={1.5} className={className} aria-hidden="true" />;
}

/** Single gray checkmark = delivered but unread */
function CheckSingle({ className = "" }: { className?: string }) {
  return (
    <svg width={14} height={14} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Double blue checkmark = read */
function CheckDouble({ className = "" }: { className?: string }) {
  return (
    <svg width={18} height={14} viewBox="0 0 20 16" fill="none" className={className}>
      <path d="M1.5 8.5L4.5 11.5L10.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.5 8.5L9.5 11.5L15.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Format "Vu il y a X min" from an ISO date */
function formatLastSeen(iso: string | null): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Vu a l'instant";
  if (mins < 60) return `Vu il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Vu il y a ${hours}h`;
  return `Vu il y a ${Math.floor(hours / 24)}j`;
}

function ChatBubble({ content, isOwn, time, showTail, readAt }: { content: string; isOwn: boolean; time: string; showTail: boolean; readAt?: string | null }) {
  const variants = isOwn ? chatVariants.bubbleSent : chatVariants.bubbleReceived;

  return (
    <m.div
      variants={variants}
      initial="hidden"
      animate="visible"
      style={{ transformOrigin: isOwn ? "bottom right" : "bottom left" }}
      className={`flex ${isOwn ? "justify-end" : "justify-start"} ${showTail ? "mt-3" : "mt-0.5"}`}
    >
      <div className={isOwn ? "flex flex-col items-end max-w-[78%]" : "max-w-[78%]"}>
        <div
          className={`relative w-full px-3.5 py-2.5 text-[15px] leading-relaxed ${
            isOwn
              ? "gradient-bg text-white rounded-2xl rounded-br-md"
              : "bg-bg-card text-text rounded-2xl rounded-bl-md"
          }`}
        >
          <p className="whitespace-pre-wrap break-words">{content}</p>
          <span
            className={`flex items-center justify-end gap-1 text-[10px] mt-1 ${
              isOwn ? "text-white/60" : "text-text-muted"
            }`}
          >
            {time}
            {isOwn && (
              readAt
                ? <CheckDouble className="text-accent ml-0.5" />
                : <CheckSingle className="text-white/50 ml-0.5" />
            )}
          </span>
        </div>
      </div>
    </m.div>
  );
}


// ---------- Main page ----------

export default function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: conversationId } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { messages, loading, loadingMore, hasMore, sending, sendMessage, markAsRead, loadMore } = useChat(
    conversationId,
    user?.id,
  );

  const reducedMotion = useReducedMotion();
  const [inputValue, setInputValue] = useState("");
  const [peer, setPeer] = useState<Pick<DbProfile, "id" | "name" | "avatar_url" | "is_online"> | null>(null);
  const [convoMode, setConvoMode] = useState<string | null>(null);
  const [matchedAtIso, setMatchedAtIso] = useState<string | null>(null);
  // Scroll-to-bottom FAB state
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [unreadWhileScrolledUp, setUnreadWhileScrolledUp] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const wasAtBottomRef = useRef(true);
  /**
   * Tracks conversation-metadata lookup so we can tell "still loading" from
   * "lookup finished, convo does not exist". Before this, `.eq("id", id)`
   * on an invalid UUID returned nothing and the page rendered an empty
   * chat shell silently — flagged in the E2E audit 2026-04-19.
   */
  const [conversationStatus, setConversationStatus] = useState<
    "loading" | "found" | "notfound"
  >("loading");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesTopRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Typing indicator (broadcast-based)
  const { peerTyping, sendTyping, stopTyping } = useTypingIndicator(
    conversationId,
    user?.id,
    user?.user_metadata?.name,
  );

  // Peer presence (online / last seen)
  const peerPresence = useConversationPresence(
    conversationId,
    user?.id,
    peer?.id,
  );

  // State for special messages (populated from real chat events, starts empty).
  const [specialMessages, setSpecialMessages] = useState<SpecialMessage[]>([]);
  const [reactions, setReactions] = useState<Record<string, Reaction[]>>({});
  const [playlist, setPlaylist] = useState<SongData[]>([]);

  // Vibe Check state
  const [showVibeCheck, setShowVibeCheck] = useState(false);

  // SharedPlaylist overlay state
  const [showSharedPlaylist, setShowSharedPlaylist] = useState(false);
  const [sharedPlaylistSongs, setSharedPlaylistSongs] = useState<SongData[]>(EMPTY_SHARED_PLAYLIST);

  // WeMetFeedback state — auto-detect: show if conversation has enough messages (simulating a date happened)
  const [showWeMetFeedback, setShowWeMetFeedback] = useState(false);
  const weMetDetected = messages.length >= 6; // heuristic: 6+ messages = likely met

  // Message screening state
  const [screeningResult, setScreeningResult] = useState<ScreeningResult | null>(null);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);

  // QuickReact per-message reactions (single reaction per message for QuickReact)
  const [quickReactions, setQuickReactions] = useState<Record<string, { emoji: string; byMe: boolean } | null>>({});

  // fetch conversation metadata + peer profile. Resolves to `notfound`
  // when the id is invalid (bad UUID, deleted row, or unauthorised via RLS).
  useEffect(() => {
    if (!conversationId || !user) return;

    let cancelled = false;

    (async () => {
      // Reset to loading inside the async callback — React flags a
      // synchronous setState at effect body start as a cascading render.
      setConversationStatus("loading");

      const { data: convo, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", conversationId)
        .maybeSingle();

      if (cancelled) return;

      if (error || !convo) {
        setConversationStatus("notfound");
        return;
      }

      const typed = convo as DbConversation;
      setConvoMode(typed.mode);
      setMatchedAtIso(typed.created_at ?? null);
      setConversationStatus("found");

      const peerId = typed.user_a === user.id ? typed.user_b : typed.user_a;
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, name, avatar_url, is_online")
        .eq("id", peerId)
        .maybeSingle();

      if (!cancelled && profile) setPeer(profile);
    })();

    return () => {
      cancelled = true;
    };
  }, [conversationId, user]);

  // mark messages as read when conversation opens and when new messages arrive
  useEffect(() => {
    if (conversationId && user?.id && messages.length > 0) {
      markAsRead();
    }
  }, [conversationId, user?.id, messages.length, markAsRead]);

  // Observe scroll position to toggle the scroll-to-bottom FAB
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const onScroll = () => {
      const distanceFromBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight;
      const atBottom = distanceFromBottom < 120;
      wasAtBottomRef.current = atBottom;
      setShowScrollDown(!atBottom);
      if (atBottom) {
        setUnreadWhileScrolledUp(0);
      }
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // Track previous message counts so we can derive "new messages since
  // scrolled-up" without calling setState directly in the effect body on
  // every render. The derivation runs only when the lengths actually grow.
  const lastSeenCountsRef = useRef({
    messages: messages.length,
    specials: specialMessages.length,
  });
  useEffect(() => {
    const last = lastSeenCountsRef.current;
    const grew =
      messages.length + specialMessages.length > last.messages + last.specials;
    lastSeenCountsRef.current = {
      messages: messages.length,
      specials: specialMessages.length,
    };
    if (wasAtBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({
        behavior: reducedMotion ? "auto" : "smooth",
      });
    } else if (grew) {
      // Derive via a separate microtask so this effect body stays synchronous.
      const raf = requestAnimationFrame(() => {
        setUnreadWhileScrolledUp((n) => n + 1);
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [messages, specialMessages, reducedMotion]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
    });
    setUnreadWhileScrolledUp(0);
  }, [reducedMotion]);

  const handleSend = useCallback(async () => {
    const text = inputValue.trim();
    if (!text) return;

    // Run message screening
    const result = screenMessage(text);
    if (result.severity === "block") {
      haptics.error();
      setScreeningResult(result);
      setPendingMessage(null);
      return;
    }
    if (result.severity === "warning") {
      haptics.light();
      setScreeningResult(result);
      setPendingMessage(text);
      return;
    }

    // Clean message — send directly
    haptics.medium();
    setInputValue("");
    stopTyping();
    await sendMessage(text);
    inputRef.current?.focus();
  }, [inputValue, sendMessage, stopTyping]);

  /** Confirm sending a warned message */
  const handleConfirmSend = useCallback(async () => {
    if (!pendingMessage) return;
    setInputValue("");
    setScreeningResult(null);
    setPendingMessage(null);
    stopTyping();
    await sendMessage(pendingMessage);
    inputRef.current?.focus();
  }, [pendingMessage, sendMessage, stopTyping]);

  /** Dismiss screening warning */
  const handleDismissScreening = useCallback(() => {
    setScreeningResult(null);
    setPendingMessage(null);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  // format time
  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  // resolve mode
  const modeInfo = convoMode && convoMode in MODES ? MODES[convoMode as ModeKey] : null;

  // determine avatar color from mode or fallback
  const avatarColor = modeInfo?.color ?? "var(--color-accent)";

  // ---------- Feature handlers ----------

  const handleVoiceRecord = useCallback((duration: number) => {
    setSpecialMessages((prev) => [
      ...prev,
      {
        id: `voice-${Date.now()}`,
        type: "voice",
        isOwn: true,
        createdAt: new Date().toISOString(),
        voiceDuration: duration,
      },
    ]);
  }, []);

  const handleReact = useCallback((messageId: string, emoji: string) => {
    setReactions((prev) => {
      const existing = prev[messageId] ?? [];
      const found = existing.find((r) => r.emoji === emoji);
      if (found) {
        // Toggle off if already reacted by me
        if (found.byMe) {
          const filtered = existing.filter((r) => r.emoji !== emoji);
          return { ...prev, [messageId]: filtered };
        }
        return {
          ...prev,
          [messageId]: existing.map((r) =>
            r.emoji === emoji ? { ...r, count: r.count + 1, byMe: true } : r,
          ),
        };
      }
      return {
        ...prev,
        [messageId]: [...existing, { emoji, count: 1, byMe: true }],
      };
    });
  }, []);

  const handlePlanSubmit = useCallback((plan: PlanData) => {
    setSpecialMessages((prev) => [
      ...prev,
      {
        id: `plan-${Date.now()}`,
        type: "plan",
        isOwn: true,
        createdAt: new Date().toISOString(),
        plan,
      },
    ]);
  }, []);

  const handlePlanAccept = useCallback((msgId: string) => {
    setSpecialMessages((prev) =>
      prev.map((m) =>
        m.id === msgId && m.plan
          ? { ...m, plan: { ...m.plan, status: "accepted" as const } }
          : m,
      ),
    );
  }, []);

  const handleLocationShare = useCallback((lat: number, lng: number) => {
    setSpecialMessages((prev) => [
      ...prev,
      {
        id: `loc-${Date.now()}`,
        type: "location",
        isOwn: true,
        createdAt: new Date().toISOString(),
        lat,
        lng,
      },
    ]);
  }, []);

  const handleStartGame = useCallback((game: GameData) => {
    setSpecialMessages((prev) => [
      ...prev,
      {
        id: `game-${Date.now()}`,
        type: "game",
        isOwn: true,
        createdAt: new Date().toISOString(),
        game,
      },
    ]);
  }, []);

  const handleAddSong = useCallback((song: SongData) => {
    const newPlaylist = [...playlist, song];
    setPlaylist(newPlaylist);
    setSpecialMessages((prev) => [
      ...prev,
      {
        id: `music-${Date.now()}`,
        type: "music",
        isOwn: true,
        createdAt: new Date().toISOString(),
        songs: [...newPlaylist],
      },
    ]);
  }, [playlist]);

  /** QuickReact handler for individual messages */
  const handleQuickReact = useCallback((messageId: string, emoji: string) => {
    setQuickReactions((prev) => {
      const current = prev[messageId];
      // Toggle off if same emoji
      if (current && current.emoji === emoji && current.byMe) {
        return { ...prev, [messageId]: null };
      }
      return { ...prev, [messageId]: { emoji, byMe: true } };
    });
    // Also feed into existing reaction system
    handleReact(messageId, emoji);
  }, [handleReact]);

  /** Add song to shared playlist */
  const handleSharedPlaylistAdd = useCallback((song: SongData) => {
    setSharedPlaylistSongs((prev) => [...prev, song]);
    handleAddSong(song);
  }, [handleAddSong]);

  // ---------- Merge and sort all messages ----------

  type TimelineItem =
    | { kind: "text"; msg: typeof messages[0] }
    | { kind: "special"; msg: SpecialMessage };

  const timeline: TimelineItem[] = [
    ...messages.map((msg) => ({ kind: "text" as const, msg })),
    ...specialMessages.map((msg) => ({ kind: "special" as const, msg })),
  ].sort((a, b) => {
    const timeA = a.kind === "text" ? a.msg.createdAt : a.msg.createdAt;
    const timeB = b.kind === "text" ? b.msg.createdAt : b.msg.createdAt;
    return new Date(timeA).getTime() - new Date(timeB).getTime();
  });

  // Conversation not found — render an error state instead of a silent,
  // empty chat shell. Applies to bogus ids (e.g. `/chat/1`), deleted
  // conversations, and convos the user can't see (RLS).
  if (conversationStatus === "notfound") {
    return (
      <div className="flex flex-col h-[100dvh] bg-bg">
        <PageHeader
          backHref="/chat"
          backLabel="Retour aux conversations"
          title="Conversation"
        />
        <div className="flex-1 flex items-center justify-center">
          <ErrorState
            emoji="💬"
            title="Conversation introuvable"
            description="Ce chat n'existe pas ou a ete supprime."
            onRetry={() => router.push("/chat")}
            retryLabel="Retour aux conversations"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-bg">
      <PageHeader
        backHref="/chat"
        backLabel="Retour aux conversations"
        hideTitle
        leftSlot={
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar + online pulse ring */}
            <div className="relative shrink-0">
              {peer?.avatar_url ? (
                <Image
                  src={peer.avatar_url}
                  alt={peer.name}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{ background: avatarColor }}
                >
                  {peer?.name?.[0] ?? "?"}
                </div>
              )}
              {(peerPresence.isOnline || peer?.is_online) && (
                <>
                  {!reducedMotion && (
                    <m.span
                      aria-hidden
                      className="absolute -inset-0.5 rounded-full border-2 pointer-events-none"
                      style={{ borderColor: "var(--color-safe)" }}
                      animate={{
                        scale: [1, 1.18, 1],
                        opacity: [0.75, 0, 0.75],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  )}
                  <span
                    className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-bg"
                    style={{ background: "var(--color-safe)" }}
                    aria-label="En ligne"
                  />
                </>
              )}
            </div>

            {/* Name + mode + presence */}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[15px] truncate">{peer?.name ?? "..."}</p>
              {modeInfo && (
                <p className="text-[11px] text-accent truncate">
                  {modeInfo.icon} {modeInfo.name}
                </p>
              )}
              {peerPresence.isOnline ? (
                <p className="text-[11px] text-safe">En ligne</p>
              ) : peerPresence.lastSeen ? (
                <p className="text-[11px] text-text-muted">{formatLastSeen(peerPresence.lastSeen)}</p>
              ) : !modeInfo && peer?.is_online ? (
                <p className="text-[11px] text-safe">En ligne</p>
              ) : null}
            </div>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link
              href={`/compatibility/${conversationId}`}
              className="tap-target shrink-0 w-9 h-9 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-[14px] hover:bg-accent/20 transition-colors"
              aria-label="Voir la compatibilite"
            >
              📊
            </Link>
            <VibeCheckButton onClick={() => setShowVibeCheck(true)} />
          </div>
        }
      />

      {/* Spark Timer — only once the conversation's creation timestamp is known */}
      {matchedAtIso && <SparkTimer matchedAt={matchedAtIso} />}

      {/* WeMetFeedback prompt — shows when a date likely happened */}
      {weMetDetected && !showWeMetFeedback && (
        <m.div
          className="mx-4 mt-2 mb-1"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <button
            onClick={() => setShowWeMetFeedback(true)}
            className="w-full flex items-center gap-3 py-3 px-4 rounded-xl bg-accent/5 border border-accent/15 hover:bg-accent/10 transition-colors tap-target"
          >
            <span className="text-lg" aria-hidden="true">🤝</span>
            <div className="flex-1 text-left">
              <p className="text-[13px] font-bold text-text">Vous vous etes vus ?</p>
              <p className="text-[11px] text-text-muted">Dites-nous comment ca s&apos;est passe</p>
            </div>
            <ChevronRight size={16} strokeWidth={2} className="text-accent" />
          </button>
        </m.div>
      )}

      {/* Messages area */}
      <div
        ref={scrollContainerRef}
        className="relative flex-1 overflow-y-auto px-4 py-3"
        role="log"
        aria-label="Messages"
        aria-live="polite"
        aria-relevant="additions text"
      >
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && timeline.length === 0 && (
          <EmptyState
            emoji={modeInfo?.icon ?? "💬"}
            title="Aucun message pour le moment"
            subtitle="Envoie le premier message !"
          />
        )}

        {/* Load older messages */}
        {!loading && hasMore && (
          <div className="flex justify-center py-3" ref={messagesTopRef}>
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="text-xs text-accent font-medium px-4 py-2 rounded-full border border-accent/20 bg-accent/5 hover:bg-accent/10 transition-colors disabled:opacity-50"
            >
              {loadingMore ? (
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 border border-accent border-t-transparent rounded-full animate-spin" />
                  Chargement...
                </span>
              ) : (
                "Charger les messages precedents"
              )}
            </button>
          </div>
        )}

        <AnimatePresence initial={false}>
          {timeline.map((item, i) => {
            if (item.kind === "text") {
              const msg = item.msg;
              const prevItem = timeline[i - 1];
              const prevIsOwn = prevItem
                ? prevItem.kind === "text"
                  ? prevItem.msg.isOwn
                  : prevItem.msg.isOwn
                : undefined;
              const showTail = prevIsOwn === undefined || prevIsOwn !== msg.isOwn;
              const msgReactions = reactions[msg.id] ?? [];

              return (
                <QuickReact
                  key={msg.id}
                  isOwn={msg.isOwn}
                  reaction={quickReactions[msg.id] ?? null}
                  onReact={(emoji) => handleQuickReact(msg.id, emoji)}
                >
                  <ReactionWrapper
                    isOwn={msg.isOwn}
                    reactions={msgReactions}
                    onReact={(emoji) => handleReact(msg.id, emoji)}
                  >
                    <ChatBubble
                      content={msg.content}
                      isOwn={msg.isOwn}
                      time={formatTime(msg.createdAt)}
                      showTail={showTail}
                      readAt={msg.isOwn ? msg.readAt : undefined}
                    />
                  </ReactionWrapper>
                </QuickReact>
              );
            }

            // Special messages
            const sm = item.msg;

            if (sm.type === "voice") {
              return (
                <VoiceNoteBubble
                  key={sm.id}
                  duration={sm.voiceDuration ?? 10}
                  isOwn={sm.isOwn}
                  time={formatTime(sm.createdAt)}
                />
              );
            }

            if (sm.type === "plan" && sm.plan) {
              return (
                <PlanCard
                  key={sm.id}
                  plan={sm.plan}
                  isOwn={sm.isOwn}
                  time={formatTime(sm.createdAt)}
                  onAccept={() => handlePlanAccept(sm.id)}
                  onModify={() => {}}
                />
              );
            }

            if (sm.type === "location") {
              return (
                <LocationCard
                  key={sm.id}
                  lat={sm.lat ?? 48.8566}
                  lng={sm.lng ?? 2.3522}
                  isOwn={sm.isOwn}
                  time={formatTime(sm.createdAt)}
                />
              );
            }

            if (sm.type === "game" && sm.game) {
              return (
                <GameCard
                  key={sm.id}
                  game={sm.game}
                  isOwn={sm.isOwn}
                  time={formatTime(sm.createdAt)}
                />
              );
            }

            if (sm.type === "music" && sm.songs) {
              return (
                <MusicCard
                  key={sm.id}
                  songs={sm.songs}
                  isOwn={sm.isOwn}
                  time={formatTime(sm.createdAt)}
                />
              );
            }

            return null;
          })}
        </AnimatePresence>

        <AnimatePresence>
          {sending && <PeerTypingIndicator key="sending-indicator" />}
        </AnimatePresence>

        <AnimatePresence>
          {peerTyping && (
            <PeerTypingIndicator key="peer-typing" peerName={peerTyping} />
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Scroll-to-bottom FAB */}
      <AnimatePresence>
        {showScrollDown && (
          <m.button
            type="button"
            onClick={scrollToBottom}
            initial={{ opacity: 0, y: 12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.9 }}
            transition={springs.snap}
            className="fixed right-4 z-30 flex items-center justify-center w-11 h-11 rounded-full bg-bg-card border border-border shadow-lg hover:border-accent/40 hover:text-accent transition-colors text-text-muted tap-target"
            style={{ bottom: "calc(5.5rem + env(safe-area-inset-bottom))" }}
            aria-label={
              unreadWhileScrolledUp > 0
                ? `${unreadWhileScrolledUp} nouveau${unreadWhileScrolledUp > 1 ? "x" : ""} message${unreadWhileScrolledUp > 1 ? "s" : ""}, descendre`
                : "Descendre au dernier message"
            }
          >
            <svg
              width={18}
              height={18}
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M6 9L12 15L18 9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {unreadWhileScrolledUp > 0 && (
              <m.span
                className="absolute -top-1 -right-1 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full gradient-bg text-[10px] font-bold text-white flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={springs.elastic}
              >
                {unreadWhileScrolledUp}
              </m.span>
            )}
          </m.button>
        )}
      </AnimatePresence>

      {/* AI Wingman suggestions */}
      <AIWingman
        mode={convoMode}
        messageCount={messages.length}
        onSelectSuggestion={(text) => setInputValue(text)}
        unansweredCount={(() => {
          let count = 0;
          for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].isOwn) count++;
            else break;
          }
          return count;
        })()}
      />

      {/* Input bar */}
      <m.div
        className="sticky bottom-0 border-t border-border bg-bg/95 backdrop-blur-md px-3 py-2"
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
        initial={{ y: 0 }}
        whileFocus={{ y: -2 }}
        transition={springs.micro}
      >
        <div className="flex items-end gap-2">
          {/* Plus menu for secondary actions */}
          <PlusMenu>
            <LocationShareButton onShare={handleLocationShare} />
            <IceBreakerButton onStartGame={handleStartGame} />
            <PlaylistShareButton onAddSong={handleAddSong} />
            <EventInviteButton
              onInvite={(ev) => {
                // Compose a concise invite message. Uses the French short
                // weekday + HHhMM format so the recipient instantly sees
                // when / where. Safe to send as plain text — no schema
                // migration needed for this first iteration.
                const d = new Date(ev.startAt);
                const day = d
                  .toLocaleDateString("fr-FR", { weekday: "short" })
                  .replace(".", "");
                const time = d.toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const msg = `Je vais a [${ev.title} @ ${ev.venue.name}] ${day} ${time}. Tu viens ?`;
                void sendMessage(msg);
              }}
            />
            {/* Shared playlist full view button */}
            <button
              type="button"
              onClick={() => setShowSharedPlaylist(true)}
              className="tap-target shrink-0 w-11 h-11 rounded-full bg-bg-card border border-border flex items-center justify-center text-text-muted hover:text-accent hover:border-accent/30 transition-colors active:scale-95"
              aria-label="Playlist commune"
            >
              <span className="text-lg">🎵</span>
            </button>
            {/* Planifier button */}
            <Link
              href={`/plan/${conversationId}`}
              className="tap-target shrink-0 w-11 h-11 rounded-full bg-bg-card border border-border flex items-center justify-center text-text-muted hover:text-accent hover:border-accent/30 transition-colors active:scale-95"
              aria-label="Planifier un rendez-vous"
            >
              <span className="text-lg">📅</span>
            </Link>
          </PlusMenu>

          {/* Text input */}
          <m.textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => { setInputValue(e.target.value); sendTyping(); }}
            onKeyDown={handleKeyDown}
            placeholder="Message..."
            rows={1}
            className="flex-1 resize-none bg-bg-card border border-border rounded-2xl px-4 py-2.5 text-[15px] text-text placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 transition-colors max-h-[120px]"
            aria-label="Ecrire un message"
            style={{ minHeight: 44, lineHeight: "1.4" }}
            whileFocus={{ y: -2 }}
            transition={springs.micro}
          />

          {/* Plan proposal button (always visible) */}
          <PlanProposalButton onSubmit={handlePlanSubmit} />

          {/* Voice note button (always visible) */}
          <VoiceRecordButton onRecordComplete={handleVoiceRecord} />

          {/* Send button — scales + glows when input has text */}
          <m.button
            onClick={handleSend}
            disabled={!inputValue.trim() || sending}
            className="tap-target shrink-0 w-11 h-11 rounded-full gradient-bg flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Envoyer le message"
            animate={
              reducedMotion
                ? undefined
                : inputValue.trim()
                  ? {
                      scale: 1.08,
                      boxShadow:
                        "0 0 22px color-mix(in srgb, var(--color-accent) 45%, transparent)",
                    }
                  : { scale: 1, boxShadow: "0 0 0px transparent" }
            }
            whileTap={{ scale: 0.85 }}
            transition={springs.micro}
          >
            <SendIcon size={18} className="text-white" />
          </m.button>
        </div>
      </m.div>

      {/* Vibe Check overlay */}
      {showVibeCheck && (
        <VibeCheck
          peerName={peer?.name ?? "..."}
          peerInitial={peer?.name?.[0] ?? "?"}
          userInitial="Y"
          onClose={() => setShowVibeCheck(false)}
        />
      )}

      {/* Message screening warning/block overlay */}
      <AnimatePresence>
        {screeningResult && screeningResult.severity !== "clean" && (
          <m.div
            className="fixed inset-0 z-[90] flex items-end justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/50" onClick={handleDismissScreening} />
            <m.div
              className="relative bg-bg rounded-t-2xl border-t border-border w-full max-w-lg pb-8 pt-3 shadow-xl"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="flex justify-center mb-4">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>
              <div className="px-6 text-center">
                <div className="text-[40px] mb-3">
                  {screeningResult.severity === "block" ? "\u26D4" : "\u26A0\uFE0F"}
                </div>
                <h3 className="text-[16px] font-bold text-text mb-2">
                  {screeningResult.severity === "block" ? "Message bloque" : "Attention"}
                </h3>
                <p className="text-[13px] text-text-muted mb-5">
                  {screeningResult.warningMessage}
                </p>

                {screeningResult.severity === "warning" && pendingMessage ? (
                  <div className="flex gap-3">
                    <button
                      onClick={handleDismissScreening}
                      className="flex-1 py-3 rounded-2xl bg-border/50 border border-border text-text-muted font-bold text-[14px]"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={handleConfirmSend}
                      className="flex-1 py-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500 font-bold text-[14px]"
                    >
                      Envoyer quand meme
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleDismissScreening}
                    className="w-full py-3 rounded-2xl bg-border/50 border border-border text-text font-bold text-[14px]"
                  >
                    Compris
                  </button>
                )}
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>

      {/* SharedPlaylist overlay */}
      <AnimatePresence>
        {showSharedPlaylist && (
          <m.div
            className="fixed inset-0 z-[85] flex items-end justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowSharedPlaylist(false)} />
            <m.div
              className="relative w-full max-w-lg max-h-[80vh] overflow-y-auto pb-4"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <SharedPlaylist
                songs={sharedPlaylistSongs}
                onAddSong={handleSharedPlaylistAdd}
                partnerName={peer?.name ?? "..."}
                className="rounded-t-2xl rounded-b-none"
              />
              <button
                onClick={() => setShowSharedPlaylist(false)}
                className="w-full py-3 bg-bg border-t border-border text-text-muted text-[13px] font-semibold"
              >
                Fermer
              </button>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>

      {/* WeMetFeedback sheet */}
      <WeMetFeedback
        peerName={peer?.name ?? "..."}
        peerId={peer?.id ?? ""}
        checkinId={`checkin-${conversationId}`}
        isOpen={showWeMetFeedback}
        onClose={() => setShowWeMetFeedback(false)}
      />
    </div>
  );
}
