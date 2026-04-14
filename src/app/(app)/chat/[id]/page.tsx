"use client";

import { use, useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useChat } from "@/lib/useChat";
import { supabase } from "@/lib/supabase";
import type { DbProfile, DbConversation } from "@/lib/supabase";
import { MODES } from "@/lib/modes";
import type { ModeKey } from "@/lib/modes";

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

function ChatBubble({ content, isOwn, time, showTail }: { content: string; isOwn: boolean; time: string; showTail: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`flex ${isOwn ? "justify-end" : "justify-start"} ${showTail ? "mt-3" : "mt-0.5"}`}
    >
      <div
        className={`relative max-w-[78%] px-3.5 py-2.5 text-[15px] leading-relaxed ${
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

// ---------- Main page ----------

export default function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: conversationId } = use(params);
  const { user } = useAuth();
  const { messages, loading, sending, sendMessage, markAsRead } = useChat(
    conversationId,
    user?.id,
  );

  const [inputValue, setInputValue] = useState("");
  const [peer, setPeer] = useState<Pick<DbProfile, "id" | "name" | "avatar_url" | "is_online"> | null>(null);
  const [convoMode, setConvoMode] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
  }, [messages]);

  const handleSend = useCallback(async () => {
    const text = inputValue.trim();
    if (!text) return;
    setInputValue("");
    await sendMessage(text);
    inputRef.current?.focus();
  }, [inputValue, sendMessage]);

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
        </div>
      </header>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-3" role="log" aria-label="Messages" aria-live="polite">
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full gradient-bg-subtle border border-accent/20 flex items-center justify-center mb-4">
              <span className="text-2xl">{modeInfo?.icon ?? "💬"}</span>
            </div>
            <p className="text-sm text-text-muted">Aucun message pour le moment</p>
            <p className="text-xs text-text-muted mt-1">Envoie le premier message !</p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => {
            const prevMsg = messages[i - 1];
            const showTail = !prevMsg || prevMsg.isOwn !== msg.isOwn;
            return (
              <ChatBubble
                key={msg.id}
                content={msg.content}
                isOwn={msg.isOwn}
                time={formatTime(msg.createdAt)}
                showTail={showTail}
              />
            );
          })}
        </AnimatePresence>

        {sending && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="sticky bottom-0 border-t border-border bg-bg/95 backdrop-blur-md px-3 py-2" style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}>
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message..."
            rows={1}
            className="flex-1 resize-none bg-bg-card border border-border rounded-2xl px-4 py-2.5 text-[15px] text-text placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 transition-colors max-h-[120px]"
            aria-label="Ecrire un message"
            style={{ minHeight: 44, lineHeight: "1.4" }}
          />
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
    </div>
  );
}
