"use client";

/**
 * SaveSearchButton — Wave 17.
 *
 * "Enregistrer" pill that lives next to "Reinitialiser" at the bottom
 * of a filter sheet. Tapping it opens a tiny inline modal asking for
 * a name, then persists the *current* filter state under that name
 * for the active surface.
 *
 * Surface-agnostic: the parent passes the filter snapshot to save
 * via the `getFilters` callback. Doing it via callback (rather than a
 * `filters` prop) means the component always saves the LATEST state,
 * not whatever was passed at last render — important because the
 * EventFilters bottom-sheet maintains a `draft` separate from the
 * applied filters and the user expects "Enregistrer" to capture the
 * draft they just composed.
 */

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { m, AnimatePresence, type Transition } from "motion/react";
import { springs } from "@/lib/motion-design";
import { X } from "@/components/ui/lucide";
import {
  useSavedSearches,
  type SavedSearchSurface,
} from "@/lib/useSavedSearches";

// ─────────────────────────────────────────
// Haptic helper
// ─────────────────────────────────────────

function haptic() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(6);
  }
}

// ─────────────────────────────────────────
// Props
// ─────────────────────────────────────────

export interface SaveSearchButtonProps<TFilters = Record<string, unknown>> {
  surface: SavedSearchSurface;
  /** Snapshot the current filter state at the moment Save is confirmed. */
  getFilters: () => TFilters;
  /** Optional class on the trigger button. */
  className?: string;
  /** Called after a successful save (parent can show a toast etc.). */
  onSaved?: (name: string) => void;
}

// ─────────────────────────────────────────
// Trigger + modal
// ─────────────────────────────────────────

export function SaveSearchButton<TFilters = Record<string, unknown>>({
  surface,
  getFilters,
  className,
  onSaved,
}: SaveSearchButtonProps<TFilters>) {
  const { saveCurrentAs } = useSavedSearches<TFilters>(surface);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const errorId = useId();

  // Focus the input on open — small UX win.
  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(id);
  }, [open]);

  // Escape closes the modal.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const closeModal = useCallback(() => {
    setOpen(false);
    setName("");
    setError(null);
    setSaving(false);
  }, []);

  const handleSave = useCallback(async () => {
    setError(null);
    const trimmed = name.trim();
    if (trimmed.length < 1 || trimmed.length > 30) {
      setError("Le nom doit faire entre 1 et 30 caracteres.");
      return;
    }
    setSaving(true);
    try {
      const filters = getFilters();
      await saveCurrentAs(trimmed, filters);
      haptic();
      onSaved?.(trimmed);
      closeModal();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      setError(msg);
      setSaving(false);
    }
  }, [name, saveCurrentAs, getFilters, onSaved, closeModal]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          haptic();
          setOpen(true);
        }}
        className={[
          "flex-shrink-0 text-[14px] font-semibold text-accent",
          "underline underline-offset-2 tap-target",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
          className ?? "",
        ].join(" ")}
        aria-label="Enregistrer cette recherche"
      >
        Enregistrer
      </button>

      <AnimatePresence>
        {open && (
          <>
            <m.div
              key="save-search-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={closeModal}
              className="fixed inset-0 z-[900] bg-black/55 backdrop-blur-sm"
              aria-hidden="true"
            />
            <m.div
              key="save-search-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby={`${inputId}-title`}
              initial={{ opacity: 0, scale: 0.92, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 12 }}
              transition={springs.snap as Transition}
              className={[
                "fixed left-1/2 top-1/2 z-[901] -translate-x-1/2 -translate-y-1/2",
                "w-[min(92vw,360px)] rounded-2xl bg-bg border border-border",
                "shadow-2xl p-5",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <h2
                  id={`${inputId}-title`}
                  className="text-[16px] font-bold text-text"
                >
                  Enregistrer la recherche
                </h2>
                <button
                  type="button"
                  onClick={closeModal}
                  className="-mr-1 -mt-1 rounded-full p-1.5 text-text-muted hover:text-text tap-target focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                  aria-label="Fermer"
                >
                  <X size={16} aria-hidden />
                </button>
              </div>

              <label
                htmlFor={inputId}
                className="block text-[12px] font-semibold text-text-muted mb-2"
              >
                Nom (1 à 30 caractères)
              </label>
              <input
                id={inputId}
                ref={inputRef}
                type="text"
                value={name}
                onChange={(e) => {
                  // Soft-cap at 30 to match server CHECK
                  setName(e.target.value.slice(0, 30));
                  if (error) setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void handleSave();
                  }
                }}
                placeholder="Jazz weekend, Foodie 5km gratuit…"
                maxLength={30}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? errorId : undefined}
                className={[
                  "w-full rounded-xl border px-3 py-2.5 text-[14px]",
                  "bg-bg-card text-text placeholder:text-text-muted",
                  "focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30",
                  error ? "border-danger" : "border-border",
                ].join(" ")}
              />

              <div className="mt-1 flex items-center justify-between text-[11px] text-text-muted">
                <span id={errorId} aria-live="polite" className="text-danger">
                  {error ?? ""}
                </span>
                <span aria-hidden>{name.trim().length}/30</span>
              </div>

              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 rounded-full py-2.5 text-[14px] font-semibold text-text-muted bg-bg-card border border-border tap-target focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                  disabled={saving}
                >
                  Annuler
                </button>
                <m.button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={saving || name.trim().length === 0}
                  whileTap={{ scale: 0.97 }}
                  transition={springs.snap as Transition}
                  className={[
                    "flex-1 rounded-full py-2.5 text-[14px] font-bold text-white",
                    "tap-target focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "bg-accent",
                  ].join(" ")}
                >
                  {saving ? "Enregistrement…" : "Enregistrer"}
                </m.button>
              </div>
            </m.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default SaveSearchButton;
