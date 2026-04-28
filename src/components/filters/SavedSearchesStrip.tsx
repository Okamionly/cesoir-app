"use client";

/**
 * SavedSearchesStrip — Wave 17.
 *
 * Horizontal pill row of the user's saved filter combos for a given
 * surface ("events" | "map" | "browse"). Sits at the top of the
 * filter UI (bottom-sheet for events, top of MapFiltersSheet, etc.).
 *
 * Each chip shows the saved name and a small ⋯ menu for rename/delete.
 * Tapping the chip body applies the WHOLE saved filter object via
 * `onApply`. The hook stamps `last_used_at = now()` server-side so
 * the chip floats to the front next time.
 *
 * This component is intentionally surface-agnostic. The caller passes
 * the surface key and the apply callback receives the opaque filters
 * payload — converting it back into the strongly-typed surface state
 * is the parent's job.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { m, AnimatePresence, type Transition } from "motion/react";
import { springs } from "@/lib/motion-design";
import { MoreHorizontal, Edit3, Trash2 } from "@/components/ui/lucide";
import {
  useSavedSearches,
  type SavedSearch,
  type SavedSearchSurface,
} from "@/lib/useSavedSearches";

// ─────────────────────────────────────────
// Haptic helper (mirrors EventFilters.tsx)
// ─────────────────────────────────────────

function haptic() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(6);
  }
}

// ─────────────────────────────────────────
// Props
// ─────────────────────────────────────────

export interface SavedSearchesStripProps<TFilters = Record<string, unknown>> {
  /** Which filter UI owns this strip — drives the DB scope. */
  surface: SavedSearchSurface;
  /**
   * Called with the filters payload of the tapped chip. The parent is
   * responsible for setting it on its own filter state.
   */
  onApply: (filters: TFilters) => void;
  /** Optional class for the wrapper. */
  className?: string;
}

// ─────────────────────────────────────────
// Sub-component: chip with overflow menu
// ─────────────────────────────────────────

function SavedSearchChip<TFilters>({
  search,
  onApply,
  onRename,
  onDelete,
}: {
  search: SavedSearch<TFilters>;
  onApply: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click-outside / Escape.
  useEffect(() => {
    if (!menuOpen) return;
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <div className="relative flex-shrink-0">
      <m.div
        layout
        whileTap={{ scale: 0.94 }}
        transition={springs.snap as Transition}
        className={[
          "inline-flex items-stretch rounded-full overflow-hidden",
          "bg-bg-card border border-border text-text",
          "focus-within:ring-2 focus-within:ring-accent/60",
        ].join(" ")}
      >
        {/* Apply zone — the bulk of the chip body */}
        <button
          type="button"
          onClick={() => {
            haptic();
            onApply();
          }}
          aria-label={`Appliquer la recherche enregistree ${search.name}`}
          className={[
            "px-3 py-1.5 text-[12px] font-semibold",
            "max-w-[150px] truncate",
            "tap-target hover:bg-accent/5 transition-colors",
            "focus:outline-none",
          ].join(" ")}
        >
          {search.name}
        </button>

        {/* ⋯ button — small overflow menu */}
        <button
          type="button"
          aria-label={`Options pour ${search.name}`}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={(e) => {
            e.stopPropagation();
            haptic();
            setMenuOpen((v) => !v);
          }}
          className={[
            "px-2 border-l border-border",
            "text-text-muted hover:text-text hover:bg-accent/5",
            "tap-target transition-colors",
            "focus:outline-none",
          ].join(" ")}
        >
          <MoreHorizontal size={14} aria-hidden />
        </button>
      </m.div>

      {/* Overflow menu */}
      <AnimatePresence>
        {menuOpen && (
          <m.div
            ref={menuRef}
            role="menu"
            aria-label={`Options de la recherche ${search.name}`}
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={springs.snap as Transition}
            className={[
              "absolute right-0 top-full mt-1 z-50",
              "min-w-[140px] rounded-xl bg-bg border border-border",
              "shadow-lg overflow-hidden",
            ].join(" ")}
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                haptic();
                setMenuOpen(false);
                onRename();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-text hover:bg-accent/5 tap-target focus:outline-none focus-visible:bg-accent/10"
            >
              <Edit3 size={14} aria-hidden />
              Renommer
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                haptic();
                setMenuOpen(false);
                onDelete();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-danger hover:bg-danger/10 tap-target focus:outline-none focus-visible:bg-danger/10"
            >
              <Trash2 size={14} aria-hidden />
              Supprimer
            </button>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────
// Main component
// ─────────────────────────────────────────

export function SavedSearchesStrip<TFilters = Record<string, unknown>>({
  surface,
  onApply,
  className,
}: SavedSearchesStripProps<TFilters>) {
  const { searches, loading, apply, rename, remove } =
    useSavedSearches<TFilters>(surface);

  const handleApply = useCallback(
    async (id: string) => {
      const filters = await apply(id);
      if (filters) onApply(filters);
    },
    [apply, onApply],
  );

  const handleRename = useCallback(
    async (s: SavedSearch<TFilters>) => {
      // Native prompt — keeps the strip self-contained without a heavier
      // modal stack. The DB CHECK enforces the 1..30 length so we let
      // the rename throw if invalid and surface via window.alert.
      const next = window.prompt("Nouveau nom (1-30 caracteres)", s.name);
      if (next === null) return;
      try {
        await rename(s.id, next);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erreur inconnue";
        window.alert(msg);
      }
    },
    [rename],
  );

  const handleDelete = useCallback(
    async (s: SavedSearch<TFilters>) => {
      const ok = window.confirm(`Supprimer la recherche "${s.name}" ?`);
      if (!ok) return;
      try {
        await remove(s.id);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erreur inconnue";
        window.alert(msg);
      }
    },
    [remove],
  );

  // Empty state: do not render anything — keeps the filter UI clean
  // for first-time users who have no saved searches yet.
  if (!loading && searches.length === 0) return null;

  return (
    <section
      aria-labelledby="saved-searches-heading"
      className={className}
    >
      <h3
        id="saved-searches-heading"
        className="text-[10px] uppercase tracking-wider text-text-muted font-bold mb-2"
      >
        Mes recherches
      </h3>
      <div
        className="flex gap-1.5 overflow-x-auto scrollbar-none -mx-1 px-1"
        style={{ WebkitOverflowScrolling: "touch" }}
        role="list"
      >
        <AnimatePresence initial={false}>
          {searches.map((s) => (
            <m.div
              key={s.id}
              layout
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={springs.snap as Transition}
              role="listitem"
            >
              <SavedSearchChip
                search={s}
                onApply={() => void handleApply(s.id)}
                onRename={() => void handleRename(s)}
                onDelete={() => void handleDelete(s)}
              />
            </m.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}

export default SavedSearchesStrip;
