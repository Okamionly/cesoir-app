"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { m, AnimatePresence } from "motion/react";
import { haptics } from "@/lib/haptics";
import { Clock } from "@/components/ui/lucide";
import { FAB_ACTIONS_META, type FABAction } from "@/lib/fab-actions";

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

/**
 * Bespoke radar glyph — lucide has no exact equivalent (the built-in Radar
 * icon ships a sweep beam that doesn't read well at 18px). Kept inline.
 */
function RadarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="10" cy="10" r="8" />
      <circle cx="10" cy="10" r="4" />
      <circle cx="10" cy="10" r="1" />
      <path d="M10 2v4" />
    </svg>
  );
}

function TimerIcon() {
  return <Clock size={18} strokeWidth={2} aria-hidden="true" />;
}

/**
 * Calendar-with-plus glyph. Lucide's `CalendarPlus` exists but its composition
 * doesn't match the existing 20x20 optical weight used across the FAB; a
 * trimmed inline SVG looks sharper alongside the other 18px glyphs.
 */
function CalendarPlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="4" width="16" height="14" rx="2" />
      <path d="M6 2v4M14 2v4M2 9h16" />
      <path d="M10 12v4M8 14h4" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

// Actions come from src/lib/fab-actions.ts (per-action hex lives there, not
// in components/). Icons are rendered here because JSX can't live in the lib.
const FAB_ICONS: Record<string, React.ReactNode> = {
  "/mood-match": <RadarIcon />,
  "/speed-dating": <TimerIcon />,
  "/plans/create": <CalendarPlusIcon />,
};

const FAB_ACTIONS: FABAction[] = FAB_ACTIONS_META.map((meta) => ({
  ...meta,
  icon: FAB_ICONS[meta.href] ?? null,
}));

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
    // FAB partout (user choice 2026-04-20) — cohérent avec BottomNav mobile-first.
    // Position au-dessus de la BottomNav (90px ≈ nav 60px + marge 30px).
    // 2026-04-20 v2: on desktop, clamp horizontal anchor to the AppShell
    // phone-frame (440px). Backdrop stays as a separate sibling so its
    // `fixed inset-0` isn't trapped by the clamp wrapper's transform
    // (transformed ancestors become a containing block for `fixed`).
    <>
      {/* Backdrop when open — sibling, not descendant, so it covers viewport */}
      <AnimatePresence>
        {isOpen && (
          <m.div
            key="fab-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-[799] bg-black/20 backdrop-blur-[2px]"
          />
        )}
      </AnimatePresence>

      <div className="pointer-events-none fixed bottom-[90px] left-0 right-0 z-[800] md:bottom-[114px] md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-[440px]">
      <div className="pointer-events-auto absolute bottom-0 right-4">

      {/* Action buttons */}
      <AnimatePresence>
        {isOpen && (
          <div role="menu" aria-label="Actions rapides">
          {FAB_ACTIONS.map((action, i) => (
            <m.div
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
            </m.div>
          ))}
          </div>
        )}
      </AnimatePresence>

      {/* Main FAB — 48px, simpler style */}
      <m.button
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
      </m.button>
      </div>
    </div>
    </>
  );
}
