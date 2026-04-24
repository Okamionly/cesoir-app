"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { Route } from "next";
import { m, AnimatePresence } from "motion/react";
import { X } from "@/components/ui/lucide";
import { useIsMobile } from "@/lib/hooks/useIsMobile";

// ---------------------------------------------------------------------------
// Keybinding table — kept in one place so UI + handler stay in sync.
// ---------------------------------------------------------------------------

interface Shortcut {
  keys: string[];
  label: string;
  section: "navigation" | "actions" | "swipe" | "misc";
}

const SHORTCUTS: Shortcut[] = [
  // Navigation (g-chord)
  { keys: ["g", "f"], label: "Ouvrir Explorer", section: "navigation" },
  { keys: ["g", "m"], label: "Ouvrir Carte", section: "navigation" },
  { keys: ["g", "c"], label: "Ouvrir Chat", section: "navigation" },
  { keys: ["g", "o"], label: "Ouvrir Modes", section: "navigation" },
  { keys: ["g", "p"], label: "Ouvrir Profil", section: "navigation" },

  // Actions
  { keys: ["⌘", "K"], label: "Recherche rapide", section: "actions" },
  { keys: ["?"], label: "Afficher ces raccourcis", section: "actions" },
  { keys: ["Esc"], label: "Fermer les modals", section: "actions" },

  // Swipe deck (/browse)
  { keys: ["J"], label: "Swipe suivant (liker)", section: "swipe" },
  { keys: ["K"], label: "Swipe précédent (passer)", section: "swipe" },
];

const SECTION_LABELS: Record<Shortcut["section"], string> = {
  navigation: "Navigation",
  actions: "Actions",
  swipe: "Swipe deck",
  misc: "Divers",
};

const HINT_DISMISSED_KEY = "cesoir_kb_hint_dismissed";

// ---------------------------------------------------------------------------
// Key helpers
// ---------------------------------------------------------------------------

function isTextInput(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * KeyboardShortcuts — desktop-only global keyboard controls + a `?` help modal.
 *
 * Behaviour:
 *   - Mobile: renders nothing. All shortcuts noop.
 *   - Desktop:
 *       • `?` toggles the help overlay
 *       • `Esc` closes the help overlay (doesn't interfere with other modals —
 *         when open, it `preventDefault`s so other `Esc` listeners won't react)
 *       • `Cmd/Ctrl+K` → opens a stub "quick search" modal. For now the stub
 *         surfaces the shortcuts list (same overlay) — real command palette
 *         is a follow-up.
 *       • `g f/m/c/o/p` → goto routes (chord with 800ms timeout)
 *       • `j / k` on `/browse` → dispatches `CustomEvent('cesoir:swipe', …)`
 *         that the swipe deck (SwipeCard) can listen for. We don't import
 *         SwipeCard internals to keep this component decoupled.
 *
 * No key handler fires while the user is typing in a form field.
 *
 * A small floating "? for shortcuts" hint appears bottom-left once on
 * desktop and persists a dismiss flag in localStorage.
 */
export default function KeyboardShortcuts() {
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  // 2026-04-24 (hydration fix): the previous "useState initialiser that
  // reads localStorage on the client, returns false on the server" pattern
  // was NOT SSR-safe despite the comment — the initialiser DOES run during
  // the initial client render of a "use client" component (hydration pass),
  // and if localStorage is empty (first visit) it returns true on the
  // client while SSR produced false. That introduces a stray
  // AnimatePresence child in the tree on CSR that wasn't there on SSR, and
  // React flags it as a hydration mismatch ("server HTML didn't match the
  // client") that shifts the position of the next sibling (the Toast
  // container). Fix: use the mounted-gate pattern — always start false
  // (matches SSR), flip to the real localStorage value in a useEffect
  // AFTER hydration so the first render is deterministic across runtimes.
  const [hintVisible, setHintVisible] = useState<boolean>(false);
  useEffect(() => {
    try {
      setHintVisible(!localStorage.getItem(HINT_DISMISSED_KEY));
    } catch {
      // Private browsing / quota — leave hint hidden.
    }
  }, []);

  // g-chord buffer — stores the last "g" press with a timestamp; resets
  // after 800ms of inactivity or when the chord completes.
  const gChordAt = useRef<number | null>(null);

  const dismissHint = useCallback(() => {
    setHintVisible(false);
    try {
      localStorage.setItem(HINT_DISMISSED_KEY, "1");
    } catch {
      // ignore quota/private mode
    }
  }, []);

  // ── Key handler ────────────────────────────────────────────────────────
  useEffect(() => {
    if (isMobile) return;

    function handler(e: KeyboardEvent) {
      // Never hijack typing
      if (isTextInput(e.target)) return;

      const key = e.key;
      const mod = e.metaKey || e.ctrlKey;

      // Cmd/Ctrl+K — quick search (for now surfaces the shortcuts overlay)
      if (mod && (key === "k" || key === "K")) {
        e.preventDefault();
        setOpen((v) => !v);
        dismissHint();
        return;
      }

      // Esc — only intercept if our overlay is open (don't swallow other modals)
      if (key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
        return;
      }

      // ? — open help (Shift+/ on FR/US keyboards)
      if (key === "?" || (e.shiftKey && key === "/")) {
        e.preventDefault();
        setOpen((v) => !v);
        dismissHint();
        return;
      }

      // Swipe deck shortcuts — only on /browse
      if (pathname?.startsWith("/browse")) {
        if (key === "j" || key === "J") {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent("cesoir:swipe", { detail: { dir: "right" } }));
          return;
        }
        if (key === "k" || key === "K") {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent("cesoir:swipe", { detail: { dir: "left" } }));
          return;
        }
      }

      // g-chord navigation
      const now = Date.now();
      if (key === "g" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        gChordAt.current = now;
        return;
      }

      if (gChordAt.current !== null && now - gChordAt.current < 800) {
        const chordMap: Record<string, string> = {
          f: "/feed",
          m: "/map",
          c: "/chat",
          o: "/modes",
          p: "/profile",
        };
        const dest = chordMap[key.toLowerCase()];
        if (dest) {
          e.preventDefault();
          gChordAt.current = null;
          router.push(dest as Route);
          return;
        }
      }
    }

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isMobile, open, pathname, router, dismissHint]);

  if (isMobile) return null;

  // Group shortcuts by section for the UI
  const grouped: Record<Shortcut["section"], Shortcut[]> = {
    navigation: [],
    actions: [],
    swipe: [],
    misc: [],
  };
  SHORTCUTS.forEach((s) => grouped[s.section].push(s));

  return (
    <>
      {/* Floating hint — bottom-left, desktop-only, dismissible */}
      <AnimatePresence>
        {hintVisible && !open && (
          <m.button
            key="kb-hint"
            type="button"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.25 }}
            onClick={() => {
              setOpen(true);
              dismissHint();
            }}
            className="fixed bottom-6 left-6 z-[850] hidden md:flex items-center gap-2 rounded-full border border-border bg-bg-card/90 px-3 py-2 text-xs font-medium text-text-soft shadow-md backdrop-blur-md transition-colors hover:text-text hover:border-accent/40"
            aria-label="Afficher les raccourcis clavier"
          >
            <kbd className="font-display rounded bg-bg px-1.5 py-0.5 text-[10px] font-bold text-text border border-border">
              ?
            </kbd>
            <span>raccourcis</span>
          </m.button>
        )}
      </AnimatePresence>

      {/* Help overlay */}
      <AnimatePresence>
        {open && (
          <m.div
            key="kb-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[900] flex items-center justify-center bg-black/30 backdrop-blur-sm p-6"
            onClick={() => setOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Raccourcis clavier"
          >
            <m.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 4 }}
              transition={{ type: "spring", stiffness: 280, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-3xl border border-border bg-bg-card shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-border">
                <div>
                  <h2 className="font-display text-lg font-bold text-text">
                    Raccourcis clavier
                  </h2>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    Appuie sur <kbd className="font-display px-1 bg-bg rounded text-text border border-border">?</kbd> à tout moment
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="tap-target -mr-2 rounded-full p-2 text-text-muted hover:text-text hover:bg-bg transition-colors"
                  aria-label="Fermer"
                >
                  <X size={18} strokeWidth={2} aria-hidden="true" />
                </button>
              </div>

              {/* Shortcut list */}
              <div className="px-6 py-4 max-h-[60vh] overflow-y-auto no-scrollbar">
                {(Object.keys(grouped) as Shortcut["section"][]).map((sec) => {
                  const rows = grouped[sec];
                  if (!rows.length) return null;
                  return (
                    <div key={sec} className="mb-5 last:mb-0">
                      <h3 className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">
                        {SECTION_LABELS[sec]}
                      </h3>
                      <ul className="space-y-1.5">
                        {rows.map((s) => (
                          <li
                            key={`${sec}-${s.keys.join("+")}`}
                            className="flex items-center justify-between gap-4"
                          >
                            <span className="text-sm text-text">{s.label}</span>
                            <span className="flex items-center gap-1 shrink-0">
                              {s.keys.map((k, i) => (
                                <span key={`${k}-${i}`} className="flex items-center gap-1">
                                  {i > 0 && (
                                    <span className="text-[10px] text-text-muted">
                                      {/* separator: " then " for g-chord, " + " for modifier combos */}
                                      {s.keys[0].length === 1 && s.keys[0] === "g" ? "puis" : "+"}
                                    </span>
                                  )}
                                  <kbd className="font-display rounded-md border border-border bg-bg px-2 py-0.5 text-[11px] font-bold text-text min-w-[26px] text-center">
                                    {k}
                                  </kbd>
                                </span>
                              ))}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="px-6 py-3 border-t border-border text-[11px] text-text-muted text-center">
                Sur mobile, utilise les gestes de swipe et la BottomNav.
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}
