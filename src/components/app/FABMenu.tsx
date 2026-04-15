"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { haptics } from "@/lib/haptics";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FABAction {
  label: string;
  color: string;
  icon: React.ReactNode;
  href: string;
}

// ---------------------------------------------------------------------------
// Icons (inline SVG to avoid external deps)
// ---------------------------------------------------------------------------

function RadarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="8" />
      <circle cx="10" cy="10" r="4" />
      <circle cx="10" cy="10" r="1" />
      <path d="M10 2v4" />
    </svg>
  );
}

function TimerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="11" r="7" />
      <path d="M10 7v4l2.5 2.5" />
      <path d="M8 2h4" />
    </svg>
  );
}

function CalendarPlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="16" height="14" rx="2" />
      <path d="M6 2v4M14 2v4M2 9h16" />
      <path d="M10 12v4M8 14h4" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const FAB_ACTIONS: FABAction[] = [
  {
    label: "Mood Match",
    color: "#8B5CF6",
    icon: <RadarIcon />,
    href: "/mood-match",
  },
  {
    label: "Speed Dating",
    color: "#F59E0B",
    icon: <TimerIcon />,
    href: "/speed-dating",
  },
  {
    label: "Creer un event",
    color: "#00FF88",
    icon: <CalendarPlusIcon />,
    href: "/events/create",
  },
];

// Arc positions for 3 buttons — tighter, closer to the FAB
const positions = [
  { x: -55, y: -30 },
  { x: -20, y: -65 },
  { x: 20, y: -65 },
];

export function FABMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  // Close on Escape key for keyboard accessibility
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape" && isOpen) setIsOpen(false);
  }, [isOpen]);

  useEffect(() => {
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [handleEscape]);

  const handleAction = useCallback((href: string) => {
    haptics.light();
    setIsOpen(false);
    router.push(href);
  }, [router]);

  return (
    <div className="fixed bottom-[90px] right-4 z-[800]">
      {/* Backdrop when open */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="fab-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-[799] bg-black/20 backdrop-blur-[2px]"
          />
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <AnimatePresence>
        {isOpen && (
          <div role="menu" aria-label="Actions rapides">
          {FAB_ACTIONS.map((action, i) => (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, x: 0, y: 0, scale: 0.3 }}
              animate={{
                opacity: 1,
                x: positions[i].x,
                y: positions[i].y,
                scale: 1,
              }}
              exit={{ opacity: 0, x: 0, y: 0, scale: 0.3 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 22,
                delay: i * 0.04,
              }}
              className="absolute bottom-0 right-0 flex flex-col items-center gap-1"
            >
              <span className="whitespace-nowrap rounded-full bg-bg px-2 py-0.5 text-[10px] font-semibold text-text shadow-md">
                {action.label}
              </span>
              <button
                onClick={() => handleAction(action.href)}
                role="menuitem"
                className="flex h-10 w-10 items-center justify-center rounded-full text-white shadow-lg transition-transform active:scale-90"
                style={{ backgroundColor: action.color }}
                aria-label={action.label}
              >
                {action.icon}
              </button>
            </motion.div>
          ))}
          </div>
        )}
      </AnimatePresence>

      {/* Main FAB — 48px, simpler style */}
      <motion.button
        onClick={() => { haptics.medium(); setIsOpen((v) => !v); }}
        animate={{ rotate: isOpen ? 135 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="relative z-[801] flex h-12 w-12 items-center justify-center rounded-full bg-accent shadow-md"
        aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="text-lg font-bold text-white select-none">
          {isOpen ? "+" : "\u263E"}
        </span>
      </motion.button>
    </div>
  );
}
