"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PlusMenuProps {
  children: React.ReactNode;
}

export function PlusMenu({ children }: PlusMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="absolute bottom-14 left-0 z-40 flex gap-2 bg-bg border border-border rounded-2xl p-2 shadow-lg"
              role="menu"
              aria-label="Actions supplementaires"
            >
              {children}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`tap-target shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-95 ${
          isOpen
            ? "gradient-bg text-white"
            : "bg-bg-card border border-border text-text-muted hover:text-accent hover:border-accent/30"
        }`}
        aria-label={isOpen ? "Fermer le menu" : "Plus d'actions"}
        aria-expanded={isOpen}
      >
        <motion.svg
          width={18}
          height={18}
          viewBox="0 0 24 24"
          fill="none"
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <path
            d="M12 5v14M5 12h14"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </motion.svg>
      </button>
    </div>
  );
}
