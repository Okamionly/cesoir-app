"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence, type Variants } from "motion/react";
import { springs, micro } from "@/lib/motion-design";
import { MODES, type ModeKey } from "@/lib/modes";
import { MOCK_EVENTS, type PopUpEvent, type EventMessage } from "@/lib/popup-events";
import { Confetti } from "@/components/ui/Confetti";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

// --- Helpers ---

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function getCountdown(datetime: string) {
  const diff = Math.max(0, new Date(datetime).getTime() - Date.now());
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1_000);
  return { h, m, s, total: diff };
}

// --- Countdown Digit ---

function CountdownDigit({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <motion.span
        key={value}
        initial={{ opacity: 0, y: -12, scale: 0.7 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={springs.snap}
        className="text-2xl font-mono font-bold text-accent tabular-nums"
      >
        {value}
      </motion.span>
      <span className="text-[9px] text-text-muted uppercase tracking-wider mt-0.5">{label}</span>
    </div>
  );
}

// --- Attendee list with staggered avatars ---

function AttendeeList({ attendees }: { attendees: PopUpEvent["attendees"] }) {
  return (
    <div className="flex flex-wrap gap-3">
      {attendees.map((a, i) => (
        <motion.div
          key={a.id}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ ...springs.elastic, delay: i * 0.06 }}
          className="flex flex-col items-center gap-1"
        >
          <img
            src={a.avatar}
            alt={a.name}
            loading="lazy"
            decoding="async"
            className="w-10 h-10 rounded-full object-cover border-2 border-border"
          />
          <span className="text-[10px] text-text-muted font-medium">{a.name}</span>
        </motion.div>
      ))}
    </div>
  );
}

// --- Chat message ---

function ChatBubble({ msg, isOwn }: { msg: EventMessage; isOwn: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6, x: isOwn ? 30 : -30 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      transition={springs.elastic}
      className={`flex gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
    >
      <img
        src={msg.userAvatar}
        alt={msg.userName}
        loading="lazy"
        decoding="async"
        className="w-7 h-7 rounded-full object-cover shrink-0 border border-border"
      />
      <div
        className={`max-w-[75%] px-3 py-2 rounded-2xl ${
          isOwn
            ? "bg-accent/20 text-text rounded-br-md"
            : "bg-card border border-border text-text rounded-bl-md"
        }`}
      >
        <p className="text-[11px] font-semibold text-accent mb-0.5">{msg.userName}</p>
        <p className="text-[12px] leading-relaxed">{msg.text}</p>
        <p className={`text-[9px] mt-1 ${isOwn ? "text-accent/50" : "text-text-muted"}`}>{msg.time}</p>
      </div>
    </motion.div>
  );
}

// --- Main Page ---

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const event = useMemo(() => MOCK_EVENTS.find((e) => e.id === id), [id]);

  const [isJoined, setIsJoined] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [countdown, setCountdown] = useState({ h: 0, m: 0, s: 0, total: 0 });
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<EventMessage[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize messages from event
  useEffect(() => {
    if (event) {
      setMessages(event.messages);
    }
  }, [event]);

  // Countdown timer
  useEffect(() => {
    if (!event) return;
    const update = () => setCountdown(getCountdown(event.datetime));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [event]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleToggleJoin = useCallback(() => {
    if (!isJoined) {
      setShowConfetti(true);
    }
    setIsJoined((prev) => !prev);
  }, [isJoined]);

  const handleSendMessage = useCallback(() => {
    if (!chatInput.trim()) return;
    const newMsg: EventMessage = {
      id: `msg-${Date.now()}`,
      userId: "me",
      userName: "Toi",
      userAvatar: "https://randomuser.me/api/portraits/men/99.jpg",
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, newMsg]);
    setChatInput("");
  }, [chatInput]);

  const handleShare = useCallback(async () => {
    if (!event) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: `${event.title} - ${event.time} a ${event.venue}`,
          url: window.location.href,
        });
      } catch {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  }, [event]);

  if (!event) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-muted text-sm">Event introuvable</p>
          <Link href="/events" className="text-accent text-sm mt-2 inline-block">
            Retour aux events
          </Link>
        </div>
      </div>
    );
  }

  const mode = MODES[event.mode] ?? MODES["night-owl"];
  const isFull = event.maxAttendees > 0 && event.currentAttendees >= event.maxAttendees;
  const isCreator = false; // Mock: user is not the creator
  const attendeeCount = isJoined ? event.currentAttendees + 1 : event.currentAttendees;

  return (
    <div className="min-h-screen bg-bg pb-32">
      <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-bg/95 backdrop-blur-md border-b border-border px-5 py-3">
        <div className="flex items-center justify-between">
          <Link href="/events">
            <motion.span
              whileTap={{ scale: 0.9 }}
              className="text-text-muted text-sm font-medium flex items-center gap-1"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Events
            </motion.span>
          </Link>
          <div className="flex items-center gap-2">
            {isCreator && (
              <motion.button
                onClick={() => setIsEditing(!isEditing)}
                whileTap={{ scale: 0.9 }}
                className="text-text-muted text-sm font-medium"
              >
                {isEditing ? "Terminer" : "Modifier"}
              </motion.button>
            )}
            <motion.button
              onClick={handleShare}
              whileTap={{ scale: 0.9 }}
              className="flex items-center gap-1 text-accent text-[12px] font-semibold"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              Partager
            </motion.button>
          </div>
        </div>
      </header>

      {/* Event info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springs.heavy}
        className="px-5 pt-5"
      >
        {/* Title + mode badge */}
        <div className="flex items-start gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0"
            style={{ background: `linear-gradient(135deg, ${mode.color}, #8B5CF6)` }}
          >
            {mode.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-display font-bold text-text leading-tight">{event.title}</h1>
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white mt-1"
              style={{ backgroundColor: mode.color }}
            >
              {mode.icon} {mode.name}
            </span>
          </div>
        </div>

        {/* Description */}
        {event.description && (
          <p className="text-[13px] text-text-muted mt-3 leading-relaxed">{event.description}</p>
        )}

        {/* Countdown */}
        {countdown.total > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...springs.elastic, delay: 0.2 }}
            className="mt-5 bg-card border border-border rounded-2xl p-4"
          >
            <p className="text-[10px] text-text-muted uppercase tracking-wider text-center mb-2">
              Commence dans
            </p>
            <div className="flex items-center justify-center gap-4">
              {countdown.h > 0 && (
                <>
                  <CountdownDigit value={pad(countdown.h)} label="heures" />
                  <span className="text-accent/40 text-lg font-bold">:</span>
                </>
              )}
              <CountdownDigit value={pad(countdown.m)} label="min" />
              <span className="text-accent/40 text-lg font-bold">:</span>
              <CountdownDigit value={pad(countdown.s)} label="sec" />
            </div>
          </motion.div>
        )}

        {/* Location card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.heavy, delay: 0.3 }}
          className="mt-4 bg-card border border-border rounded-2xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-text">{event.venue}</p>
              <p className="text-[11px] text-text-muted">Paris {event.arrondissement}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[13px] font-bold text-accent">{event.time}</p>
            </div>
          </div>
        </motion.div>

        {/* Creator info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.heavy, delay: 0.35 }}
          className="mt-4 flex items-center gap-3"
        >
          <div
            className="w-9 h-9 rounded-full p-[2px]"
            style={{ background: `linear-gradient(135deg, ${mode.color}, #8B5CF6)` }}
          >
            <img
              src={event.creatorAvatar}
              alt={event.creator}
              loading="lazy"
              decoding="async"
              className="w-full h-full rounded-full object-cover border-2 border-bg"
            />
          </div>
          <div>
            <p className="text-[12px] text-text-muted">Organise par</p>
            <p className="text-[13px] font-semibold text-text">{event.creator}</p>
          </div>
        </motion.div>

        {/* Attendees section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.heavy, delay: 0.4 }}
          className="mt-6"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-display font-bold text-text">
              Participants ({attendeeCount}{event.maxAttendees > 0 ? `/${event.maxAttendees}` : ""})
            </h2>
            {event.maxAttendees > 0 && (
              <span className={`text-[10px] font-semibold ${isFull && !isJoined ? "text-red-400" : "text-text-muted"}`}>
                {isFull && !isJoined ? "Complet" : `${event.maxAttendees - attendeeCount} places restantes`}
              </span>
            )}
          </div>
          <AttendeeList attendees={event.attendees} />
        </motion.div>

        {/* Tags */}
        {event.tags.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="flex flex-wrap gap-1.5 mt-4"
          >
            {event.tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded-full text-[10px] font-semibold text-text-muted bg-card border border-border"
              >
                {tag}
              </span>
            ))}
          </motion.div>
        )}

        {/* Chat section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.heavy, delay: 0.5 }}
          className="mt-6"
        >
          <h2 className="text-sm font-display font-bold text-text mb-3">Discussion</h2>

          <div className="bg-card border border-border rounded-2xl p-3 max-h-64 overflow-y-auto space-y-3">
            {messages.length === 0 ? (
              <p className="text-[12px] text-text-muted text-center py-4">
                Aucun message pour le moment. Lance la conversation!
              </p>
            ) : (
              messages.map((msg) => (
                <ChatBubble key={msg.id} msg={msg} isOwn={msg.userId === "me"} />
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat input */}
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Ecris un message..."
              className="flex-1 bg-card border border-border rounded-full px-4 py-2.5 text-text text-[12px] placeholder:text-text-muted/50 focus:outline-none focus:border-accent/50 transition-colors"
            />
            <motion.button
              onClick={handleSendMessage}
              disabled={!chatInput.trim()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center shadow-glow shrink-0 disabled:opacity-40"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </motion.button>
          </div>
        </motion.div>
      </motion.div>

      {/* Fixed bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-bg/95 backdrop-blur-md border-t border-border px-5 py-4 pb-safe">
        <div className="flex gap-3">
          {isCreator ? (
            <>
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="flex-1 py-3 rounded-2xl border border-border text-text text-sm font-bold text-center"
              >
                Modifier
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="flex-1 py-3 rounded-2xl border border-red-500/30 text-red-400 text-sm font-bold text-center"
              >
                Annuler l&apos;event
              </motion.button>
            </>
          ) : (
            <motion.button
              onClick={handleToggleJoin}
              disabled={isFull && !isJoined}
              whileHover={!isFull || isJoined ? {
                scale: 1.02,
                boxShadow: isJoined
                  ? "0 0 0px rgba(239,68,68,0)"
                  : "0 0 30px rgba(139,92,246,0.5)",
              } : {}}
              whileTap={!isFull || isJoined ? { scale: 0.95 } : {}}
              className={`flex-1 py-3.5 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                isJoined
                  ? "border border-red-500/30 text-red-400 bg-card"
                  : isFull
                    ? "bg-border text-text-muted/50 cursor-not-allowed"
                    : "gradient-bg text-white shadow-glow"
              }`}
            >
              {isJoined ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  Annuler ma participation
                </>
              ) : isFull ? (
                "Complet"
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  J&apos;y vais!
                </>
              )}
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}
