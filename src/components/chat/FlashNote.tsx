"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { springs } from "@/lib/motion-design";

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

interface FlashNoteButtonProps {
  /** Recipient name */
  recipientName: string;
  /** Already used today? */
  usedToday?: boolean;
  /** Is premium user (unlimited) */
  isPremium?: boolean;
  /** Called when FlashNote is sent */
  onSend: (message: string) => void;
  className?: string;
}

interface FlashNoteReceivedProps {
  /** Sender name */
  senderName: string;
  /** Message content */
  message: string;
  /** When the FlashNote was received */
  time: string;
  /** Called when user taps to reply */
  onReply?: () => void;
}

const MAX_CHARS = 140;

// ─────────────────────────────────────────
// FlashNote Send Button (on browse card)
// ─────────────────────────────────────────

export function FlashNoteButton({
  recipientName,
  usedToday = false,
  isPremium = false,
  onSend,
  className = "",
}: FlashNoteButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");

  const canSend = isPremium || !usedToday;
  const charsLeft = MAX_CHARS - message.length;
  const isValid = message.trim().length > 0 && charsLeft >= 0;

  const handleSend = useCallback(() => {
    if (!isValid) return;
    onSend(message.trim());
    setMessage("");
    setIsOpen(false);
  }, [message, isValid, onSend]);

  return (
    <>
      {/* Trigger button */}
      <motion.button
        onClick={() => canSend && setIsOpen(true)}
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold transition-colors ${
          canSend
            ? "bg-accent/15 border border-accent/30 text-accent hover:bg-accent/25"
            : "bg-white/5 border border-white/10 text-white/30 cursor-not-allowed"
        } ${className}`}
        whileTap={canSend ? { scale: 0.95 } : undefined}
        transition={springs.micro}
        disabled={!canSend}
        aria-label={canSend ? "Envoyer un FlashNote" : "FlashNote deja utilise aujourd'hui"}
      >
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
        {canSend ? "Envoyer un FlashNote" : "FlashNote utilise"}
      </motion.button>

      {/* Compose sheet */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-white/10 rounded-t-2xl"
              style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
              role="dialog"
              aria-label="Composer un FlashNote"
            >
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              <div className="px-5 pb-4">
                {/* Header */}
                <div className="flex items-center gap-2 mb-1">
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                  <h3 className="text-[16px] font-bold text-white">FlashNote</h3>
                </div>
                <p className="text-[12px] text-white/40 mb-4">
                  Envoie un message a {recipientName} avant de matcher
                </p>

                {/* Textarea */}
                <div className="relative">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value.slice(0, MAX_CHARS))}
                    placeholder="Ton message..."
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[14px] text-white placeholder:text-white/30 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 resize-none"
                    autoFocus
                  />
                  <span
                    className={`absolute bottom-2 right-3 text-[10px] font-semibold tabular-nums ${
                      charsLeft < 20 ? "text-danger" : "text-white/20"
                    }`}
                  >
                    {charsLeft}
                  </span>
                </div>

                {/* Send button */}
                <motion.button
                  onClick={handleSend}
                  disabled={!isValid}
                  className="w-full mt-3 py-3 rounded-2xl bg-accent text-white font-bold text-[15px] disabled:opacity-30 disabled:cursor-not-allowed"
                  whileTap={{ scale: 0.98 }}
                  transition={springs.micro}
                >
                  Envoyer le FlashNote
                </motion.button>

                {!isPremium && (
                  <p className="text-[10px] text-white/30 mt-2 text-center">
                    1 FlashNote gratuit par jour &middot; Illimite en Premium
                  </p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ─────────────────────────────────────────
// FlashNote Received (in chat/notifications)
// ─────────────────────────────────────────

export function FlashNoteReceived({
  senderName,
  message,
  time,
  onReply,
}: FlashNoteReceivedProps) {
  return (
    <motion.div
      className="mx-4 my-3"
      initial={{ opacity: 0, y: 12, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={springs.elastic}
    >
      <div className="bg-accent/10 border border-accent/20 rounded-2xl p-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          <span className="text-[12px] text-accent font-bold">
            FlashNote de {senderName}
          </span>
        </div>

        {/* Message — text-text so it reads on both light + dark body */}
        <p className="text-[14px] text-text font-medium leading-relaxed">
          {message}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3">
          <span className="text-[10px] text-text-muted">{time}</span>
          {onReply && (
            <motion.button
              onClick={onReply}
              className="text-[12px] text-accent font-bold"
              whileTap={{ scale: 0.95 }}
              transition={springs.micro}
            >
              Repondre
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default FlashNoteButton;
