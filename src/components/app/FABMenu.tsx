"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { Route } from "next";
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

// Arc positions for 3 action buttons. Each entry is the (x,y) offset from
// the FAB anchor (right-4 / right-aligned). All offsets are NEGATIVE x so
// the buttons fan up-and-LEFT — historically position[2] was at x:+20 which
// pushed the third button + its whitespace-nowrap label past the right edge
// of both the 440px desktop phone-frame AND the mobile viewport. QA caught
// "Mood Match" / "Speed Dating" / "Creer un plan" labels truncated and the
// cluster bleeding into the BottomNav area on /profile (2026-04-27 user
// report). Re-anchored the whole arc to the LEFT of the FAB; labels now
// stay inside the frame at every breakpoint.
const positions = [
  { x: -75, y: -10 },   // far left, slight rise
  { x: -50, y: -60 },   // upper-mid-left
  { x: -15, y: -75 },   // straight-up-ish (was +20)
];

/**
 * Pages where the FAB is hidden — it would crowd an already-busy surface or
 * distract from a focused flow. Post-deploy audit (Playwright, 2026-04-20)
 * caught overlap on:
 *  - /map                — has MapFloatingActions stack (target, pin, rotate, LiveActivityPanel)
 *  - /chat/[id]          — composer + scroll FAB already claim bottom-right
 *  - /speed-dating       — pure empty-state, no quick-action value
 *  - /rooms/[id]         — empty-state, same rationale
 *  - /onboarding/*       — focus flow, no distractions
 *  - /safety, /safety/*  — FAB recouvrait le bouton/texte "Cercle de confiance"
 *                          (BUG-07, audit 2026-04-26). Page sensible (trust &
 *                          safety) — pas de quick-action utile ici.
 */
function shouldHideFAB(pathname: string | null): boolean {
  if (!pathname) return false;
  if (pathname === "/map" || pathname.startsWith("/map/")) return true;
  if (pathname.startsWith("/chat/")) return true;
  if (pathname === "/speed-dating" || pathname.startsWith("/speed-dating/")) return true;
  if (/^\/rooms\/[^/]+/.test(pathname)) return true;
  if (pathname.startsWith("/onboarding")) return true;
  if (pathname === "/safety" || pathname.startsWith("/safety/")) return true;
  return false;
}

export function FABMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const hidden = useMemo(() => shouldHideFAB(pathname), [pathname]);

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
    router.push(href as Route);
  }, [router]);

  if (hidden) return null;

  return (
    // FAB partout sauf pages listées dans shouldHideFAB (audit 2026-04-20).
    //
    // Positioning rules (post-audit):
    //  - Vertical:  sit ABOVE the BottomNav (60px tall + safe-area). We use
    //               calc(76px + env(safe-area-inset-bottom) + 16px) which
    //               guarantees ≥16px gap above the nav on all devices.
    //  - Desktop:   BottomNav is clamped to the 440px phone-frame with
    //               md:mb-6 (24px) — the wrapper below centers the FAB on
    //               the same phone-frame so it sits in the bottom-right
    //               corner of the frame, not of the viewport.
    //  - Horizontal mobile:  right-4 (16px).
    //  - Horizontal desktop: right-4 relative to the clamped 440px frame.
    //  - z-index:   z-40 — above page content, BELOW BottomNav (z-50) and
    //               modals (z-60+). Backdrop lifts to z-[45] when open so
    //               it overlays content but not modals. Action buttons and
    //               main FAB share z-[46] so they sit above the backdrop.
    //  - Size:      48×48 button (h-12 w-12). On narrow viewports (<400px
    //               width) we fallback to 44×44 to save room while staying
    //               within the 44px min hit-target (tap-target).
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
            className="fixed inset-0 z-[45] bg-black/20 backdrop-blur-[2px]"
          />
        )}
      </AnimatePresence>

      <div
        className="pointer-events-none fixed left-0 right-0 z-40 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-full md:max-w-[440px]"
        style={{
          // mobile: nav (60px) + safe-area + 16px gap
          // desktop keeps same formula (nav ≈ 60px + 24px mb-6 ≈ 84px →
          // stacking 16px above means bottom ≈ 100px on desktop). The
          // md:bottom-* override below handles that.
          bottom: "calc(60px + env(safe-area-inset-bottom) + 16px)",
        }}
      >
        <div className="pointer-events-auto absolute bottom-0 right-4 md:bottom-[40px]">

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
                      className="tap-target flex h-10 w-10 items-center justify-center rounded-full text-white shadow-lg transition-transform active:scale-90"
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

          {/* Main FAB — 48px (44px on very narrow mobile), above backdrop */}
          <m.button
            onClick={() => { haptics.medium(); setIsOpen((v) => !v); }}
            animate={{ rotate: isOpen ? 135 : 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="tap-target relative z-[46] flex h-11 w-11 items-center justify-center rounded-full bg-accent shadow-md min-[400px]:h-12 min-[400px]:w-12"
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
