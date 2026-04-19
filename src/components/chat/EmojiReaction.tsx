"use client";

import { useState, useCallback, useRef } from "react";
import { m, AnimatePresence } from "motion/react";

const REACTION_EMOJIS = ["❤️", "🔥", "😂", "😮", "😢", "👍"];

export interface Reaction {
  emoji: string;
  count: number;
  byMe: boolean;
}

interface ReactionPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

function ReactionPicker({ onSelect, onClose }: ReactionPickerProps) {
  return (
    <m.div
      initial={{ opacity: 0, scale: 0.8, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 8 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="absolute -top-12 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 bg-white border border-border rounded-full px-2 py-1.5 shadow-lg"
      role="listbox"
      aria-label="Choisir une reaction"
    >
      {REACTION_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => {
            onSelect(emoji);
            onClose();
          }}
          className="w-8 h-8 flex items-center justify-center text-lg hover:scale-125 transition-transform rounded-full hover:bg-bg-card"
          role="option"
          aria-label={emoji}
        >
          {emoji}
        </button>
      ))}
    </m.div>
  );
}

interface ReactionDisplayProps {
  reactions: Reaction[];
  isOwn: boolean;
  onToggle: (emoji: string) => void;
}

export function ReactionDisplay({ reactions, isOwn, onToggle }: ReactionDisplayProps) {
  if (reactions.length === 0) return null;

  return (
    <div className={`flex gap-1 mt-0.5 ${isOwn ? "justify-end pr-2" : "justify-start pl-2"}`}>
      {reactions.map((r) => (
        <m.button
          key={r.emoji}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 20 }}
          onClick={() => onToggle(r.emoji)}
          className={`flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] border transition-colors ${
            r.byMe
              ? "bg-accent/10 border-accent/30"
              : "bg-bg-card border-border hover:border-accent/20"
          }`}
          aria-label={`${r.emoji} ${r.count}`}
        >
          <span>{r.emoji}</span>
          {r.count > 1 && <span className="text-text-muted font-medium">{r.count}</span>}
        </m.button>
      ))}
    </div>
  );
}

interface ReactionWrapperProps {
  children: React.ReactNode;
  isOwn: boolean;
  reactions: Reaction[];
  onReact: (emoji: string) => void;
}

export function ReactionWrapper({ children, isOwn, reactions, onReact }: ReactionWrapperProps) {
  const [showPicker, setShowPicker] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTap = useRef(0);

  const handlePointerDown = useCallback(() => {
    longPressTimer.current = setTimeout(() => {
      setShowPicker(true);
    }, 500);
  }, []);

  const handlePointerUp = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleDoubleClick = useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      setShowPicker(true);
    }
    lastTap.current = now;
  }, []);

  const handleSelect = useCallback(
    (emoji: string) => {
      onReact(emoji);
    },
    [onReact],
  );

  return (
    <div className="relative">
      <div
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onClick={handleDoubleClick}
        className="select-none"
      >
        {children}
      </div>
      <AnimatePresence>
        {showPicker && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowPicker(false)}
              aria-hidden="true"
            />
            <ReactionPicker
              onSelect={handleSelect}
              onClose={() => setShowPicker(false)}
            />
          </>
        )}
      </AnimatePresence>
      <ReactionDisplay reactions={reactions} isOwn={isOwn} onToggle={onReact} />
    </div>
  );
}
