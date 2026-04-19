"use client";

import { useState, useCallback, useRef } from "react";
import { m, AnimatePresence } from "motion/react";
import { springs } from "@/lib/motion-design";

// ─────────────────────────────────────────
// Emoji set for quick reactions
// ─────────────────────────────────────────

const QUICK_EMOJIS = ["\u2764\uFE0F", "\uD83D\uDE02", "\uD83D\uDD25", "\uD83D\uDE2E", "\uD83D\uDC4F", "\u2753"];

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

export interface QuickReaction {
  emoji: string;
  /** Who reacted */
  byMe: boolean;
}

interface QuickReactBarProps {
  /** Called when an emoji is selected */
  onSelect: (emoji: string) => void;
  /** Close the bar */
  onClose: () => void;
  /** Position: above or below */
  position?: "above" | "below";
}

interface QuickReactBubbleProps {
  /** Reaction on this message */
  reaction: QuickReaction | null;
  /** Is this the sender's message */
  isOwn: boolean;
}

interface QuickReactWrapperProps {
  children: React.ReactNode;
  /** Is this the sender's message */
  isOwn: boolean;
  /** Current reaction on this message */
  reaction: QuickReaction | null;
  /** Called when user reacts */
  onReact: (emoji: string) => void;
}

// ─────────────────────────────────────────
// Horizontal emoji bar (shown on long-press)
// ─────────────────────────────────────────

function QuickReactBar({ onSelect, onClose, position = "above" }: QuickReactBarProps) {
  return (
    <m.div
      className={`absolute ${position === "above" ? "-top-14" : "-bottom-14"} left-1/2 -translate-x-1/2 z-50`}
      initial={{ opacity: 0, scale: 0.6, y: position === "above" ? 10 : -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.6, y: position === "above" ? 10 : -10 }}
      transition={springs.elastic}
    >
      <div className="flex items-center gap-0.5 bg-black border border-white/15 rounded-full px-2 py-1.5 shadow-2xl backdrop-blur-md">
        {QUICK_EMOJIS.map((emoji, i) => (
          <m.button
            key={emoji}
            onClick={() => {
              onSelect(emoji);
              onClose();
            }}
            className="w-9 h-9 flex items-center justify-center text-xl rounded-full hover:bg-white/10 transition-colors"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ ...springs.elastic, delay: i * 0.03 }}
            whileHover={{ scale: 1.3 }}
            whileTap={{ scale: 0.85 }}
            aria-label={`Reagir avec ${emoji}`}
          >
            {emoji}
          </m.button>
        ))}
      </div>
    </m.div>
  );
}

// ─────────────────────────────────────────
// Small emoji bubble on message
// ─────────────────────────────────────────

function QuickReactBubble({ reaction, isOwn }: QuickReactBubbleProps) {
  if (!reaction) return null;

  return (
    <m.div
      className={`absolute -bottom-2.5 ${isOwn ? "right-2" : "left-2"} z-10`}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={springs.elastic}
    >
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-sm border shadow-sm ${
          reaction.byMe
            ? "bg-accent/15 border-accent/30"
            : "bg-black border-white/15"
        }`}
      >
        {reaction.emoji}
      </div>
    </m.div>
  );
}

// ─────────────────────────────────────────
// Wrapper: wraps a chat message with long-press reaction
// ─────────────────────────────────────────

export default function QuickReact({
  children,
  isOwn,
  reaction,
  onReact,
}: QuickReactWrapperProps) {
  const [showBar, setShowBar] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePointerDown = useCallback(() => {
    longPressTimer.current = setTimeout(() => {
      setShowBar(true);
    }, 400);
  }, []);

  const handlePointerUp = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleSelect = useCallback(
    (emoji: string) => {
      onReact(emoji);
    },
    [onReact],
  );

  return (
    <div className="relative">
      {/* Message content with long-press handler */}
      <div
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onContextMenu={(e) => {
          e.preventDefault();
          setShowBar(true);
        }}
        className="select-none"
      >
        {children}
      </div>

      {/* Emoji bar */}
      <AnimatePresence>
        {showBar && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowBar(false)}
              aria-hidden="true"
            />
            <QuickReactBar
              onSelect={handleSelect}
              onClose={() => setShowBar(false)}
            />
          </>
        )}
      </AnimatePresence>

      {/* Reaction bubble */}
      <QuickReactBubble reaction={reaction} isOwn={isOwn} />
    </div>
  );
}

// Re-export for convenience
export { QuickReactBar, QuickReactBubble };
export { QUICK_EMOJIS };
