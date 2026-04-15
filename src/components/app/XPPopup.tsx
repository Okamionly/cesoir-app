"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { springs } from "@/lib/motion-design";
import type { XPPopupData } from "@/lib/useGamification";

interface XPPopupProps {
  popups: XPPopupData[];
  onRemove: (id: string) => void;
}

function XPPopupItem({
  popup,
  index,
  onRemove,
}: {
  popup: XPPopupData;
  index: number;
  onRemove: (id: string) => void;
}) {
  // Auto-remove after 1.5s
  useEffect(() => {
    const timer = setTimeout(() => onRemove(popup.id), 1500);
    return () => clearTimeout(timer);
  }, [popup.id, onRemove]);

  return (
    <motion.div
      key={popup.id}
      className="flex items-center gap-1.5 pointer-events-none select-none"
      style={{
        position: "absolute",
        bottom: 80 + index * 40,
        right: 24,
      }}
      initial={{ opacity: 0, y: 0, scale: 0.5 }}
      animate={{ opacity: 1, y: -40, scale: 1 }}
      exit={{ opacity: 0, y: -80, scale: 0.8 }}
      transition={{
        ...springs.elastic,
        opacity: { duration: 0.3 },
      }}
      aria-live="polite"
      role="status"
    >
      {/* XP amount */}
      <span
        className="font-black text-[20px] leading-none"
        style={{
          fontFamily: "var(--font-display, 'Space Grotesk')",
          background: "linear-gradient(135deg, #00FF88, #8B5CF6)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          textShadow: "none",
          filter: "drop-shadow(0 0 8px rgba(0,255,136,0.4))",
        }}
      >
        +{popup.amount} XP
      </span>
    </motion.div>
  );
}

export default function XPPopup({ popups, onRemove }: XPPopupProps) {
  return (
    <div
      className="fixed inset-0 z-[250] pointer-events-none"
      aria-label="XP notifications"
    >
      <AnimatePresence mode="popLayout">
        {popups.map((popup, index) => (
          <XPPopupItem
            key={popup.id}
            popup={popup}
            index={index}
            onRemove={onRemove}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
