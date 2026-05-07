"use client";

/**
 * PassportEditor — modal for setting / clearing a travel passport.
 *
 * Wave 17 (mig 040). Lets the user pick a destination city (autocomplete
 * from `PASSPORT_CITIES`) and a duration preset (today, tomorrow, 3 days,
 * 1 week, 2 weeks). Persists via `usePassport.setPassport`. Capped at
 * 30 days client-side AND server-side (CHECK constraint).
 *
 * Used from /settings (TRAVEL PASSPORT section).
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  searchPassportCities,
  type PassportCity,
} from "@/lib/cities";
import { usePassport, PASSPORT_MAX_DAYS, type PassportState } from "@/lib/usePassport";
import { springs } from "@/lib/motion-design";
import { useFocusTrap } from "@/lib/hooks/useFocusTrap";
import { X } from "@/components/ui/lucide";

interface PassportEditorProps {
  open: boolean;
  onClose: () => void;
}

interface DurationPreset {
  /** Stable key for React lists. */
  id: string;
  /** Visible label, e.g. "3 jours". */
  label: string;
  /** Window length in days (inclusive). */
  days: number;
}

const DURATION_PRESETS: ReadonlyArray<DurationPreset> = [
  { id: "1d", label: "Aujourd'hui", days: 1 },
  { id: "2d", label: "Demain (2j)", days: 2 },
  { id: "3d", label: "3 jours", days: 3 },
  { id: "7d", label: "1 semaine", days: 7 },
  { id: "14d", label: "2 semaines", days: 14 },
];

function formatRangeLabel(state: PassportState): string {
  if (!state.city || !state.activeFrom || !state.activeUntil) return "";
  const from = new Date(state.activeFrom);
  const until = new Date(state.activeUntil);
  // Round up to whole days for display.
  const ms = until.getTime() - from.getTime();
  const days = Math.max(1, Math.round(ms / (24 * 60 * 60 * 1000)));
  return `${state.city} · ${days} ${days === 1 ? "jour" : "jours"}`;
}

export default function PassportEditor({ open, onClose }: PassportEditorProps) {
  const { passport, setPassport, clearPassport } = usePassport();

  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<PassportCity | null>(null);
  const [duration, setDuration] = useState<DurationPreset>(DURATION_PRESETS[2]); // "3 jours" default
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const sheetRef = useRef<HTMLDivElement>(null);
  useFocusTrap(sheetRef, open, { onEscape: onClose });

  // Reset form when sheet opens — defaults to current passport if any.
  useEffect(() => {
    if (!open) return;
    setErrorMsg(null);
    if (passport.city && passport.lat !== null && passport.lng !== null) {
      setQuery(passport.city);
      setSelected({
        name: passport.city,
        country: "FR", // unknown at this point — country only used for display below the input
        lat: passport.lat,
        lng: passport.lng,
      });
    } else {
      setQuery("");
      setSelected(null);
    }
  }, [open, passport.city, passport.lat, passport.lng]);

  // Body scroll lock while open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const suggestions = useMemo(() => {
    if (!query.trim() || (selected && selected.name === query)) return [];
    return searchPassportCities(query, 6);
  }, [query, selected]);

  async function handleSave() {
    if (!selected) {
      setErrorMsg("Choisis une ville dans la liste");
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const from = new Date();
      const until = new Date(from.getTime() + duration.days * 24 * 60 * 60 * 1000);
      await setPassport({
        city: selected.name,
        lat: selected.lat,
        lng: selected.lng,
        activeFrom: from,
        activeUntil: until,
      });
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleClear() {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await clearPassport();
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="passport-editor-title"
            className="fixed inset-x-0 bottom-0 z-[81] bg-bg rounded-t-3xl border-t border-border max-h-[88vh] overflow-y-auto"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={springs.heavy}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <span aria-hidden="true" className="block w-10 h-1 rounded-full bg-border" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
              <h2
                id="passport-editor-title"
                className="text-[16px] font-bold tracking-tight text-text"
              >
                Travel Passport
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer"
                className="w-9 h-9 rounded-full flex items-center justify-center text-text-muted hover:text-text hover:bg-bg-card transition-colors tap-target focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
              >
                <X size={18} strokeWidth={1.6} aria-hidden="true" />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-5 space-y-6">
              <p className="text-[13px] text-text-muted leading-relaxed">
                Choisis une ville pour matcher comme si tu y étais déjà. Ta
                position GPS réelle reste inchangée — seul le matching utilise
                la ville cible.
              </p>

              {/* ── City search ───────────────────────────────── */}
              <section aria-labelledby="passport-city-label">
                <label
                  id="passport-city-label"
                  htmlFor="passport-city-input"
                  className="block text-[11px] font-semibold text-text-muted uppercase tracking-[0.12em] mb-2"
                >
                  Ville
                </label>
                <div className="relative">
                  <input
                    id="passport-city-input"
                    type="text"
                    autoComplete="off"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setSelected(null);
                    }}
                    placeholder="Paris, Lyon, Barcelone…"
                    className="w-full px-4 py-3 rounded-xl bg-bg-card border border-border text-[14px] text-text placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
                  />

                  {suggestions.length > 0 && (
                    <ul
                      role="listbox"
                      aria-label="Villes proposées"
                      className="absolute left-0 right-0 mt-2 max-h-[260px] overflow-y-auto rounded-xl bg-bg-card border border-border shadow-lg z-10"
                    >
                      {suggestions.map((c) => (
                        <li key={`${c.name}-${c.country}`}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelected(c);
                              setQuery(c.name);
                            }}
                            className="w-full text-left px-4 py-2.5 hover:bg-bg transition-colors flex items-center justify-between tap-target focus-visible:bg-bg focus-visible:outline-none"
                          >
                            <span className="text-[14px] text-text font-medium">
                              {c.name}
                            </span>
                            <span className="text-[11px] text-text-muted uppercase tracking-wider">
                              {c.country}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {selected && (
                  <p className="text-[11px] text-text-muted mt-2">
                    {selected.name}, {selected.country} ·{" "}
                    {selected.lat.toFixed(2)}, {selected.lng.toFixed(2)}
                  </p>
                )}
              </section>

              {/* ── Duration preset ───────────────────────────── */}
              <section aria-labelledby="passport-duration-label">
                <p
                  id="passport-duration-label"
                  className="block text-[11px] font-semibold text-text-muted uppercase tracking-[0.12em] mb-2"
                >
                  Durée (max {PASSPORT_MAX_DAYS} jours)
                </p>
                <div
                  role="radiogroup"
                  aria-labelledby="passport-duration-label"
                  className="grid grid-cols-2 gap-2"
                >
                  {DURATION_PRESETS.map((preset) => {
                    const active = duration.id === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setDuration(preset)}
                        className={`py-2.5 rounded-xl text-[13px] font-medium transition-colors tap-target focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
                          active
                            ? "bg-accent text-white"
                            : "border border-border text-text-muted hover:border-accent/30"
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* ── Current passport summary ──────────────────── */}
              {passport.isActive && passport.city && (
                <div
                  className="rounded-xl px-4 py-3 border"
                  style={{
                    background: "var(--color-accent)10",
                    borderColor: "var(--color-accent)40",
                  }}
                >
                  <p className="text-[11px] font-semibold text-text-muted uppercase tracking-[0.12em] mb-1">
                    Passport actif
                  </p>
                  <p className="text-[13px] text-text">
                    {formatRangeLabel(passport)}
                  </p>
                </div>
              )}

              {/* ── Error ─────────────────────────────────────── */}
              {errorMsg && (
                <p
                  role="alert"
                  className="text-[12px] text-danger px-3 py-2 rounded-lg bg-danger/10 border border-danger/20"
                >
                  {errorMsg}
                </p>
              )}
            </div>

            {/* Footer actions */}
            <div className="sticky bottom-0 bg-bg border-t border-border px-5 py-4 flex gap-3">
              {passport.city && (
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={submitting}
                  className="flex-1 py-3 rounded-full text-[14px] font-medium border border-border text-text-muted hover:text-text hover:border-text/30 transition-colors tap-target disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                >
                  Désactiver
                </button>
              )}
              <motion.button
                type="button"
                onClick={handleSave}
                disabled={submitting || !selected}
                whileTap={!submitting && selected ? { scale: 0.96 } : {}}
                className="flex-1 py-3 rounded-full text-[14px] font-semibold bg-text text-bg hover:opacity-90 transition-opacity tap-target disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none relative overflow-hidden"
              >
                <AnimatePresence mode="wait">
                  {submitting ? (
                    <motion.span
                      key="flying"
                      className="absolute inset-0 flex items-center justify-center gap-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <motion.span
                        aria-hidden="true"
                        initial={{ x: -24, opacity: 0 }}
                        animate={{ x: 24, opacity: [0, 1, 1, 0] }}
                        transition={{ duration: 0.7, ease: "easeInOut", times: [0, 0.2, 0.8, 1] }}
                      >
                        ✈️
                      </motion.span>
                    </motion.span>
                  ) : (
                    <motion.span
                      key="label"
                      className="relative"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      Enregistrer
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
