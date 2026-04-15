"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FABAction {
  label: string;
  color: string;
  icon: ReactNode;
  onClick: () => void;
}

interface FABMenuProps {
  onDispo?: () => void;
  onNewPlan?: () => void;
  onSOS?: () => void;
  onChangeMode?: () => void;
}

import type { ReactNode } from "react";

// ---------------------------------------------------------------------------
// Icons (inline SVG to avoid external deps)
// ---------------------------------------------------------------------------

function CheckCircleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="8" />
      <path d="M7 10l2 2 4-4" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M10 4v12M4 10h12" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 3L2 17h16L10 3zM10 8v4M10 14v1" />
    </svg>
  );
}

function SwapIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h12l-3-3M16 13H4l3 3" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FABMenu({ onDispo, onNewPlan, onSOS, onChangeMode }: FABMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const actions: FABAction[] = [
    {
      label: "Dispo ce soir",
      color: "#22c55e",
      icon: <CheckCircleIcon />,
      onClick: () => { onDispo?.(); setIsOpen(false); },
    },
    {
      label: "Nouveau plan",
      color: "#8B5CF6",
      icon: <PlusIcon />,
      onClick: () => { onNewPlan?.(); setIsOpen(false); },
    },
    {
      label: "SOS",
      color: "#ef4444",
      icon: <AlertIcon />,
      onClick: () => { onSOS?.(); setIsOpen(false); },
    },
    {
      label: "Changer mode",
      color: "#3b82f6",
      icon: <SwapIcon />,
      onClick: () => { onChangeMode?.(); setIsOpen(false); },
    },
  ];

  // Radial positions for 4 buttons (arc from -135deg to -45deg)
  const positions = [
    { x: -70, y: -50 },
    { x: -30, y: -80 },
    { x: 30, y: -80 },
    { x: 70, y: -50 },
  ];

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
            className="fixed inset-0 z-[799]"
          />
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <AnimatePresence>
        {isOpen &&
          actions.map((action, i) => (
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
                delay: i * 0.05,
              }}
              className="absolute bottom-0 right-0 flex flex-col items-center gap-1"
            >
              <span className="whitespace-nowrap rounded-full bg-bg px-2 py-0.5 text-[10px] font-semibold text-text shadow-md">
                {action.label}
              </span>
              <button
                onClick={action.onClick}
                className="flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition-transform active:scale-90"
                style={{ backgroundColor: action.color }}
                aria-label={action.label}
              >
                {action.icon}
              </button>
            </motion.div>
          ))}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        onClick={() => setIsOpen((v) => !v)}
        animate={{ rotate: isOpen ? 135 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="relative z-[801] flex h-14 w-14 items-center justify-center rounded-full shadow-lg shadow-accent/30 gradient-bg"
        aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
      >
        <span className="text-xl font-bold text-white select-none">
          {isOpen ? "+" : "\u263E"}
        </span>
      </motion.button>
    </div>
  );
}
