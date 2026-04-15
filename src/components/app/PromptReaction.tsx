"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { springs } from "@/lib/motion-design";
import type { PromptQuestion } from "./ProfilePrompts";

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

export interface PromptReactionData {
  /** The prompt question or "Photo {n}" */
  context: string;
  /** User message about it */
  message: string;
}

interface PromptReactionProps {
  /** What is being reacted to */
  context: string;
  /** Profile name */
  profileName: string;
  /** Called with the reaction data */
  onSend: (data: PromptReactionData) => void;
  /** Close the reaction sheet */
  onClose: () => void;
}

// ─────────────────────────────────────────
// Quick reaction suggestions
// ─────────────────────────────────────────

const QUICK_REACTIONS = [
  "J'adore ta reponse!",
  "Trop bien!",
  "On a ca en commun!",
  "Raconte-moi plus!",
];

// ─────────────────────────────────────────
// Component
// ─────────────────────────────────────────

export default function PromptReaction({
  context,
  profileName,
  onSend,
  onClose,
}: PromptReactionProps) {
  const [message, setMessage] = useState("");

  const handleSend = useCallback(() => {
    const text = message.trim();
    if (!text) return;
    onSend({ context, message: text });
    setMessage("");
    onClose();
  }, [message, context, onSend, onClose]);

  const handleQuickReaction = useCallback(
    (text: string) => {
      onSend({ context, message: text });
      onClose();
    },
    [context, onSend, onClose],
  );

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-white/10 rounded-t-2xl"
        style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
        role="dialog"
        aria-label="Reagir au contenu"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        <div className="px-5 pb-4">
          {/* Context label */}
          <div className="mb-4">
            <p className="text-[11px] text-white/40 uppercase tracking-widest font-semibold mb-1">
              A propos de
            </p>
            <p className="text-[13px] text-[#8B5CF6] font-medium line-clamp-2">
              {context}
            </p>
          </div>

          {/* Quick reactions */}
          <div className="flex flex-wrap gap-2 mb-4">
            {QUICK_REACTIONS.map((text) => (
              <motion.button
                key={text}
                onClick={() => handleQuickReaction(text)}
                className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[12px] text-white/70 font-medium hover:bg-[#8B5CF6]/10 hover:border-[#8B5CF6]/30 hover:text-[#8B5CF6] transition-colors"
                whileTap={{ scale: 0.92 }}
                transition={springs.micro}
              >
                {text}
              </motion.button>
            ))}
          </div>

          {/* Custom message input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={`Message a ${profileName}...`}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-[14px] text-white placeholder:text-white/30 focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/15"
              autoFocus
            />
            <motion.button
              onClick={handleSend}
              disabled={!message.trim()}
              className="px-4 py-2.5 rounded-xl bg-[#8B5CF6] text-white font-bold text-[14px] disabled:opacity-30 disabled:cursor-not-allowed"
              whileTap={{ scale: 0.95 }}
              transition={springs.micro}
            >
              Envoyer
            </motion.button>
          </div>

          {/* Info text */}
          <p className="text-[10px] text-white/30 mt-3 text-center">
            Envoye comme premier message avec le contexte
          </p>
        </div>
      </motion.div>
    </>
  );
}

// ─────────────────────────────────────────
// Wrapper: manages open/close state
// ─────────────────────────────────────────

interface PromptReactionTriggerProps {
  /** The prompt question or photo label */
  context: string;
  profileName: string;
  onSend: (data: PromptReactionData) => void;
  children?: React.ReactNode;
}

export function PromptReactionTrigger({
  context,
  profileName,
  onSend,
  children,
}: PromptReactionTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {children ? (
        <div onClick={() => setIsOpen(true)}>{children}</div>
      ) : (
        <motion.button
          onClick={() => setIsOpen(true)}
          className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-[#8B5CF6] hover:border-[#8B5CF6]/30 transition-colors"
          whileTap={{ scale: 0.85 }}
          transition={springs.micro}
          aria-label={`Reagir a: ${context}`}
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </motion.button>
      )}

      <AnimatePresence>
        {isOpen && (
          <PromptReaction
            context={context}
            profileName={profileName}
            onSend={onSend}
            onClose={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
