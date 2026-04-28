"use client";

/**
 * PlanSuggestionCard — Card surfaced on the Feed when both the user
 * and one of their matches have RSVP'd the same event (Wave 17).
 *
 * Behaviour
 * ─────────
 * - Shows the peer avatar + name + the event title/venue/time.
 * - Two CTAs:
 *   * "Créer le plan" → calls `accept()` from the hook → spawns a
 *     flash_plan around the event, then router.push to /plans/[id].
 *   * "Pas cette fois" → `dismiss()` writes dismissed_at on the row.
 *     The hook hides the card immediately (optimistic).
 * - Both actions are debounced via local `submitting` state.
 *
 * Layout
 * ──────
 * Mirrors the violet glow-bordered "highlighted" feel from the
 * NewItemsBanner / IRLConfirm surfaces. The card sits above the feed
 * filter bar (handled by the parent page).
 *
 * Accessibility
 * ─────────────
 * - role="region" + aria-label so SRs announce it as a discrete unit.
 * - Buttons are real <button> elements with explicit labels.
 * - Honours prefers-reduced-motion via the shared hook.
 */

import { useState, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { m, AnimatePresence } from "motion/react";
import { springs } from "@/lib/motion-design";
import type { PlanSuggestion } from "@/lib/usePlanSuggestions";
import { useAccessibility } from "@/components/ui/ReducedMotion";
import { useToast } from "@/components/ui/Toast";
import { Calendar, MapPin, X, Sparkles } from "@/components/ui/lucide";

interface PlanSuggestionCardProps {
  suggestion: PlanSuggestion;
  onAccept: (id: string) => Promise<{
    planId: string | null;
    error: string | null;
  }>;
  onDismiss: (id: string) => Promise<void>;
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function formatEventTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";

  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow =
    d.getFullYear() === tomorrow.getFullYear() &&
    d.getMonth() === tomorrow.getMonth() &&
    d.getDate() === tomorrow.getDate();

  const time = d.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (sameDay) return `Ce soir · ${time}`;
  if (isTomorrow) return `Demain · ${time}`;
  return d.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }) + ` · ${time}`;
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export default function PlanSuggestionCard({
  suggestion,
  onAccept,
  onDismiss,
}: PlanSuggestionCardProps) {
  const router = useRouter();
  const { reducedMotion } = useAccessibility();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState<"accept" | "dismiss" | null>(
    null,
  );
  const [removed, setRemoved] = useState(false);

  const handleAccept = useCallback(async () => {
    if (submitting) return;
    setSubmitting("accept");

    const { planId, error } = await onAccept(suggestion.id);

    if (error || !planId) {
      setSubmitting(null);
      toast(
        "Impossible de créer le plan pour le moment",
        "error",
      );
      return;
    }

    toast("Plan créé — direction le plan", "success");
    setRemoved(true);
    // Navigate after the exit animation has had a tick to start.
    setTimeout(() => {
      router.push(`/plans/${planId}`);
    }, reducedMotion ? 0 : 220);
  }, [submitting, onAccept, suggestion.id, toast, router, reducedMotion]);

  const handleDismiss = useCallback(async () => {
    if (submitting) return;
    setSubmitting("dismiss");
    setRemoved(true);
    await onDismiss(suggestion.id);
  }, [submitting, onDismiss, suggestion.id]);

  return (
    <AnimatePresence initial={false}>
      {!removed && (
        <m.section
          role="region"
          aria-label={`Suggestion de plan avec ${suggestion.peer.name} pour ${suggestion.event.title}`}
          initial={
            reducedMotion
              ? { opacity: 0 }
              : { opacity: 0, y: -12, scale: 0.98 }
          }
          animate={
            reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }
          }
          exit={
            reducedMotion
              ? { opacity: 0 }
              : { opacity: 0, y: -8, scale: 0.97 }
          }
          transition={
            reducedMotion ? { duration: 0.15 } : { ...springs.gentle }
          }
          className={[
            "mx-4 mt-3 mb-1 rounded-2xl",
            "bg-card border border-accent/40",
            "shadow-[0_0_0_1px_rgba(139,92,246,0.18),0_8px_28px_-12px_rgba(139,92,246,0.45)]",
            "p-3.5",
            "relative",
          ].join(" ")}
        >
          {/* Dismiss X — top-right ghost button. */}
          <button
            type="button"
            onClick={handleDismiss}
            disabled={submitting !== null}
            aria-label="Ignorer cette suggestion"
            className={[
              "absolute top-2 right-2 inline-flex items-center justify-center",
              "h-7 w-7 rounded-full text-text-muted",
              "hover:bg-bg-card hover:text-text",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-card",
              "transition-colors disabled:opacity-50 disabled:pointer-events-none",
            ].join(" ")}
          >
            <X size={14} strokeWidth={2} />
          </button>

          {/* Header pill: "Match commun" */}
          <div className="flex items-center gap-1.5 mb-3">
            <span
              className="inline-flex items-center gap-1 rounded-full bg-accent/10 border border-accent/30 px-2 py-0.5 text-[10px] font-semibold text-accent uppercase tracking-wide"
              aria-label="Suggestion automatique"
            >
              <Sparkles size={10} strokeWidth={2.5} aria-hidden="true" />
              Vous y allez tous les deux
            </span>
          </div>

          {/* Peer + event row */}
          <div className="flex items-start gap-3">
            {/* Peer avatar */}
            <div className="relative flex-shrink-0">
              {suggestion.peer.avatarUrl ? (
                <Image
                  src={suggestion.peer.avatarUrl}
                  alt={`Photo de ${suggestion.peer.name}`}
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full object-cover border-2 border-accent/30"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-bg-card border-2 border-accent/30 flex items-center justify-center text-text-muted text-base">
                  {suggestion.peer.name.charAt(0)}
                </div>
              )}
            </div>

            {/* Text block */}
            <div className="flex-1 min-w-0 pr-6">
              <p className="text-sm text-text leading-snug">
                <span className="font-semibold">{suggestion.peer.name}</span>
                <span className="text-text-muted">
                  {" "}
                  va aussi à cet évènement
                </span>
              </p>
              <p
                className="mt-1 text-[13px] font-semibold text-text leading-snug truncate"
                title={suggestion.event.title}
              >
                {suggestion.event.title}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-text-muted">
                <span className="inline-flex items-center gap-1">
                  <Calendar
                    size={11}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  {formatEventTime(suggestion.event.startsAt)}
                </span>
                {suggestion.event.venueName && (
                  <span
                    className="inline-flex items-center gap-1 truncate"
                    title={suggestion.event.venueName}
                  >
                    <MapPin
                      size={11}
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                    {suggestion.event.venueName}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions — stacked on narrow viewports, side-by-side on sm+. */}
          <div className="mt-3 flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={handleAccept}
              disabled={submitting !== null}
              aria-label={`Créer un plan avec ${suggestion.peer.name} pour ${suggestion.event.title}`}
              className={[
                "flex-1 h-11 rounded-xl text-sm font-semibold",
                "bg-accent text-white",
                "shadow-[0_6px_20px_rgba(139,92,246,0.35)]",
                "hover:brightness-110 active:brightness-95",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                "transition-all disabled:opacity-50 disabled:pointer-events-none",
                "inline-flex items-center justify-center gap-2",
              ].join(" ")}
            >
              {submitting === "accept" ? (
                <span
                  aria-hidden="true"
                  className="inline-block h-3.5 w-3.5 rounded-full border-2 border-white/60 border-t-white animate-spin"
                />
              ) : null}
              {submitting === "accept" ? "Création..." : "Créer le plan"}
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              disabled={submitting !== null}
              className={[
                "h-11 px-4 rounded-xl text-sm font-medium",
                "bg-bg-card text-text border border-border",
                "hover:border-text/20 hover:bg-bg-card/80",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                "transition-colors disabled:opacity-50 disabled:pointer-events-none",
              ].join(" ")}
            >
              Pas cette fois
            </button>
          </div>
        </m.section>
      )}
    </AnimatePresence>
  );
}
