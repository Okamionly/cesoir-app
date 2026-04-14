"use client";

import { use, useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useChat, useTypingIndicator } from "@/lib/useChat";
import { supabase } from "@/lib/supabase";
import type { DbProfile, DbConversation } from "@/lib/supabase";
import { MODES } from "@/lib/modes";
import type { ModeKey } from "@/lib/modes";

// Chat feature components
import SparkTimer from "@/components/chat/SparkTimer";
import { VoiceRecordButton, VoiceNoteBubble } from "@/components/chat/VoiceNote";
import { ReactionWrapper, type Reaction } from "@/components/chat/EmojiReaction";
import { PlanProposalButton, PlanCard, type PlanData } from "@/components/chat/PlanProposal";
import { LocationShareButton, LocationCard } from "@/components/chat/LocationShare";
import { IceBreakerButton, GameCard, type GameData } from "@/components/chat/IceBreakerGame";
import { PlaylistShareButton, MusicCard, type SongData } from "@/components/chat/PlaylistShare";
import { PlusMenu } from "@/components/chat/PlusMenu";
import VibeCheck, { VibeCheckButton } from "@/components/chat/VibeCheck";
import AIWingman from "@/components/chat/AIWingman";

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

function BackArrow({ size = 22, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SendIcon({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChatBubble({ content, isOwn, time, showTail, readAt }: { content: string; isOwn: boolean; time: string; showTail: boolean; readAt?: string | null }) {
  const readTime = readAt ? new Date(readAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`flex ${isOwn ? "justify-end" : "justify-start"} ${showTail ? "mt-3" : "mt-0.5"}`}
    >
      <div className={isOwn ? "flex flex-col items-end max-w-[78%]" : "max-w-[78%]"}>
        <div
          className={`relative w-full px-3.5 py-2.5 text-[15px] leading-relaxed ${
            isOwn
              ? "gradient-bg text-white rounded-2xl rounded-br-md"
              : "bg-[#F2F2F2] text-text rounded-2xl rounded-bl-md"
          }`}
        >
          <p className="whitespace-pre-wrap break-words">{content}</p>
          <span
            className={`block text-[10px] mt-1 ${
              isOwn ? "text-white/60 text-right" : "text-text-muted text-right"
            }`}
          >
            {time}
          </span>
        </div>
        {isOwn && readTime && (
          <span className="text-[10px] text-text-muted mt-0.5 mr-1">
            Vu a {readTime}
          </span>
        )}
      </div>
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start mt-2">
      <div className="bg-[#F2F2F2] rounded-2xl rounded-bl-md px-4 py-3 flex gap-1 items-center">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-text-muted"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </div>
  );
}

// ---------- Mock data for demo ----------

const MOCK_MATCHED_AT = new Date(Date.now() - 3600 * 1000).toISOString(); // 1 hour ago

const MOCK_REACTIONS: Record<string, Reaction[]> = {
  "mock-1": [{ emoji: "❤️", count: 1, byMe: false }],
  "mock-3": [{ emoji: "🔥", count: 2, byMe: true }, { emoji: "😂", count: 1, byMe: false }],
};

const MOCK_SPECIAL_MESSAGES: SpecialMessage[] = [
  {
    id: "special-voice-1",
    type: "voice",
    isOwn: false,
    createdAt: new Date(Date.now() - 1800 * 1000).toISOString(),
    voiceDuration: 15,
  },
  {
    id: "special-plan-1",
    type: "plan",
    isOwn: false,
    createdAt: new Date(Date.now() - 900 * 1000).toISOString(),
    plan: {
      activity: "Verre",
      location: "Le Perchoir, Paris 11",
      time: "21h",
      status: "pending",
    },
  },
];

const MOCK_PLAYLIST: SongData[] = [
  { artist: "Daft Punk", title: "Something About Us" },
];

// ---------- Main page ----------

export default function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: conversationId } = use(params);
  const { user } = useAuth();
  const { messages, loading, loadingMore, hasMore, sending, sendMessage, markAsRead, loadMore } = useChat(
    conversationId,
    user?.id,
  );

  const [inputValue, setInputValue] = useState("");
  const [peer, setPeer] = useState<Pick<DbProfile, "id" | "name" | "avatar_url" | "is_online"> | null>(null);
  const [convoMode, setConvoMode] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesTopRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Typing indicator
  const { peerTyping, sendTyping, stopTyping } = useTypingIndicator(
    conversationId,
    user?.id,
    user?.user_metadata?.name,
  );

  // State for special messages
  const [specialMessages, setSpecialMessages] = useState<SpecialMessage[]>(MOCK_SPECIAL_MESSAGES);
  const [reactions, setReactions] = useState<Record<string, Reaction[]>>(MOCK_REACTIONS);
  const [playlist, setPlaylist] = useState<SongData[]>(MOCK_PLAYLIST);

  // Vibe Check state
  const [showVibeCheck, setShowVibeCheck] = useState(false);

  // fetch conversation metadata + peer profile
  useEffect(() => {
    if (!conversationId || !user) return;

    (async () => {
      const { data: convo } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", conversationId)
        .single();

      if (!convo) return;
      const typed = convo as DbConversation;
      setConvoMode(typed.mode);

      const peerId = typed.user_a === user.id ? typed.user_b : typed.user_a;
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, name, avatar_url, is_online")
        .eq("id", peerId)
        .single();

      if (profile) setPeer(profile);
    })();
  }, [conversationId, user]);

  // mark messages as read when conversation opens and when new messages arrive
  useEffect(() => {
    if (conversationId && user?.id && messages.length > 0) {
      markAsRead();
    }
  }, [conversationId, user?.id, messages.length, markAsRead]);

  // auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, specialMessages]);

  const handleSend = useCallback(async () => {
    const text = inputValue.trim();
    if (!text) return;
    setInputValue("");
    stopTyping();
    await sendMessage(text);
    inputRef.current?.focus();
  }, [inputValue, sendMessage, stopTyping]);

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
  const avatarColor = modeInfo?.color ?? "#8B5CF6";

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

  return (
    <div className="flex flex-col h-[100dvh] bg-bg">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-bg/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-3 px-3 py-3">
          <Link
            href="/chat"
            className="tap-target flex items-center justify-center shrink-0"
            aria-label="Retour aux conversations"
          >
            <BackArrow />
          </Link>

          {/* Avatar */}
          <div className="relative shrink-0">
            {peer?.avatar_url ? (
              <img
                src={peer.avatar_url}
                alt={peer.name}
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
            {peer?.is_online && (
              <div
                className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-safe border-2 border-bg"
                aria-label="En ligne"
              />
            )}
          </div>

          {/* Name + mode */}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[15px] truncate">{peer?.name ?? "..."}</p>
            {modeInfo && (
              <p className="text-[11px] text-accent truncate">
                {modeInfo.icon} {modeInfo.name}
              </p>
            )}
            {!modeInfo && peer?.is_online && (
              <p className="text-[11px] text-safe">En ligne</p>
            )}
          </div>

          {/* Vibe Check button */}
          <VibeCheckButton onClick={() => setShowVibeCheck(true)} />
        </div>
      </header>

      {/* Spark Timer */}
      <SparkTimer matchedAt={MOCK_MATCHED_AT} />

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-3" role="log" aria-label="Messages" aria-live="polite">
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && timeline.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full gradient-bg-subtle border border-accent/20 flex items-center justify-center mb-4">
              <span className="text-2xl">{modeInfo?.icon ?? "💬"}</span>
            </div>
            <p className="text-sm text-text-muted">Aucun message pour le moment</p>
            <p className="text-xs text-text-muted mt-1">Envoie le premier message !</p>
          </div>
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
                <ReactionWrapper
                  key={msg.id}
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

        {sending && <TypingIndicator />}

        {peerTyping && (
          <div className="flex justify-start mt-2">
            <div className="bg-[#F2F2F2] rounded-2xl rounded-bl-md px-4 py-3 flex gap-1.5 items-center">
              <span className="text-xs text-text-muted font-medium">{peerTyping} ecrit</span>
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-text-muted"
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.12 }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* AI Wingman suggestions */}
      <AIWingman
        mode={convoMode}
        messageCount={messages.length}
        onSelectSuggestion={(text) => setInputValue(text)}
      />

      {/* Input bar */}
      <div className="sticky bottom-0 border-t border-border bg-bg/95 backdrop-blur-md px-3 py-2" style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}>
        <div className="flex items-end gap-2">
          {/* Plus menu for secondary actions */}
          <PlusMenu>
            <LocationShareButton onShare={handleLocationShare} />
            <IceBreakerButton onStartGame={handleStartGame} />
            <PlaylistShareButton onAddSong={handleAddSong} />
          </PlusMenu>

          {/* Text input */}
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => { setInputValue(e.target.value); sendTyping(); }}
            onKeyDown={handleKeyDown}
            placeholder="Message..."
            rows={1}
            className="flex-1 resize-none bg-bg-card border border-border rounded-2xl px-4 py-2.5 text-[15px] text-text placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 transition-colors max-h-[120px]"
            aria-label="Ecrire un message"
            style={{ minHeight: 44, lineHeight: "1.4" }}
          />

          {/* Plan proposal button (always visible) */}
          <PlanProposalButton onSubmit={handlePlanSubmit} />

          {/* Voice note button (always visible) */}
          <VoiceRecordButton onRecordComplete={handleVoiceRecord} />

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || sending}
            className="tap-target shrink-0 w-11 h-11 rounded-full gradient-bg flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
            aria-label="Envoyer le message"
          >
            <SendIcon size={18} className="text-white" />
          </button>
        </div>
      </div>

      {/* Vibe Check overlay */}
      {showVibeCheck && (
        <VibeCheck
          peerName={peer?.name ?? "..."}
          peerInitial={peer?.name?.[0] ?? "?"}
          userInitial="Y"
          onClose={() => setShowVibeCheck(false)}
        />
      )}
    </div>
  );
}
