"use client";

/**
 * AvailabilityBroadcast — "Je suis dispo ce soir" pill.
 *
 * Three visual states:
 *   1. IDLE      — gradient pill "Je suis dispo ce soir" + Sparkles glyph
 *   2. ACTIVE    — solid pill "Disponible · expire dans Xh Ym"
 *                  with a pulsing dot, plus an "Annuler" link
 *   3. PENDING   — disabled while POST/DELETE is in flight
 *
 * Source of truth = the user's `profiles.broadcast_until` column. This
 * component:
 *   - Hydrates the initial value via the prop or by reading the row.
 *   - Subscribes to realtime UPDATEs so a status change made on another
 *     device shows up here without manual refresh.
 *   - Re-renders the countdown every 30s while active, and auto-flips
 *     back to IDLE the second `broadcast_until` slips into the past.
 */
import { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { Sparkles, X } from "@/components/ui/lucide";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/Toast";
import { logger } from "@/lib/logger";

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

type BroadcastHours = 1 | 3 | 6;

interface BroadcastResponse {
  ok: true;
  data: {
    broadcast_until: string | null;
    hours?: BroadcastHours;
  };
}

interface ApiErrorBody {
  error: string;
  code?: string;
}

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

/** Returns ms remaining until expiry; <= 0 means expired or not active. */
function msUntilExpiry(broadcastUntil: string | null): number {
  if (!broadcastUntil) return 0;
  return new Date(broadcastUntil).getTime() - Date.now();
}

/** Format ms into "Xh Ym" / "Ym Xs" / "<1m" so the pill stays compact. */
function formatRemaining(ms: number): string {
  if (ms <= 0) return "expiré";
  const totalMin = Math.floor(ms / 60_000);
  const hours = Math.floor(totalMin / 60);
  const minutes = totalMin % 60;
  if (hours >= 1) return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
  if (totalMin >= 1) return `${minutes}m`;
  return "<1m";
}

// ────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────

interface Props {
  /** Optional initial value to avoid a fetch flash on mount. */
  initialBroadcastUntil?: string | null;
  /** Default duration when the user taps the IDLE pill. */
  defaultHours?: BroadcastHours;
}

export default function AvailabilityBroadcast({
  initialBroadcastUntil = null,
  defaultHours = 3,
}: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const reducedMotion = useReducedMotion();

  // Source of truth (in-memory mirror of profiles.broadcast_until)
  const [broadcastUntil, setBroadcastUntil] = useState<string | null>(
    initialBroadcastUntil,
  );
  const [pending, setPending] = useState(false);

  // Tick clock used by the countdown pill. We don't store the remaining
  // ms — we recompute it in render — but we need a state setter to force
  // a re-render every 30s while the broadcast is active.
  const [, setTick] = useState(0);

  // ── Hydrate from the profile row on mount ──
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    supabase
      .from("profiles")
      .select("broadcast_until")
      .eq("id", user.id)
      .maybeSingle()
      .then(
        ({ data }: { data: { broadcast_until?: string | null } | null }) => {
          if (cancelled) return;
          setBroadcastUntil(data?.broadcast_until ?? null);
        },
      );
    return () => {
      cancelled = true;
    };
  }, [user]);

  // ── Realtime: react to broadcast_until changes from any device ──
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`profile_broadcast_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        (payload: { new: { broadcast_until?: string | null } }) => {
          setBroadcastUntil(payload.new?.broadcast_until ?? null);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // ── Tick every 30s while active so the countdown updates + auto-clears ──
  const remainingMs = useMemo(
    () => msUntilExpiry(broadcastUntil),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [broadcastUntil],
  );
  const isActive = remainingMs > 0;

  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      setTick((t) => t + 1);
      // Clear locally the moment we cross the deadline so we don't show
      // "Disponible · expiré" for up to 30s before the next tick.
      if (msUntilExpiry(broadcastUntil) <= 0) {
        setBroadcastUntil(null);
      }
    }, 30_000);
    return () => clearInterval(interval);
  }, [isActive, broadcastUntil]);

  // ── Mutations ──
  const activate = useCallback(
    async (hours: BroadcastHours) => {
      if (!user || pending) return;
      setPending(true);

      // Optimistic update — flip the pill instantly so the tap feels
      // weightless. If the API rejects, we roll back below.
      const previous = broadcastUntil;
      const optimistic = new Date(
        Date.now() + hours * 60 * 60 * 1000,
      ).toISOString();
      setBroadcastUntil(optimistic);

      try {
        const res = await fetch("/api/availability/broadcast", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hours }),
        });

        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as ApiErrorBody;
          setBroadcastUntil(previous);
          toast(body.error ?? "Impossible d'activer le statut", "error");
          return;
        }

        const body = (await res.json()) as BroadcastResponse;
        if (body?.data?.broadcast_until) {
          setBroadcastUntil(body.data.broadcast_until);
        }
        toast(`Tu es visible pendant ${hours}h`, "success");
      } catch (err) {
        setBroadcastUntil(previous);
        logger.error("availability_broadcast_set_network_failed", {
          err: err instanceof Error ? err.message : String(err),
        });
        toast("Problème de connexion. Réessaie.", "error");
      } finally {
        setPending(false);
      }
    },
    [user, pending, broadcastUntil, toast],
  );

  const cancel = useCallback(async () => {
    if (!user || pending) return;
    setPending(true);

    const previous = broadcastUntil;
    setBroadcastUntil(null); // optimistic

    try {
      const res = await fetch("/api/availability/broadcast", {
        method: "DELETE",
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as ApiErrorBody;
        setBroadcastUntil(previous);
        toast(body.error ?? "Impossible d'annuler le statut", "error");
        return;
      }

      toast("Statut désactivé", "info", 2000);
    } catch (err) {
      setBroadcastUntil(previous);
      logger.error("availability_broadcast_clear_network_failed", {
        err: err instanceof Error ? err.message : String(err),
      });
      toast("Problème de connexion. Réessaie.", "error");
    } finally {
      setPending(false);
    }
  }, [user, pending, broadcastUntil, toast]);

  // ────────────────────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────────────────────

  return (
    <div className="w-full flex flex-col items-center gap-2">
      <AnimatePresence mode="wait">
        {!isActive ? (
          <motion.button
            key="idle"
            type="button"
            onClick={() => activate(defaultHours)}
            disabled={pending || !user}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
            whileTap={{ scale: 0.97 }}
            aria-label={`Je suis disponible ce soir (${defaultHours} heures)`}
            className="relative inline-flex items-center gap-2 px-6 py-3 rounded-full text-[14px] font-semibold text-white shadow-lg disabled:opacity-60 disabled:cursor-not-allowed tap-target focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg focus-visible:outline-none overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, var(--color-accent), var(--color-accent-2))",
            }}
          >
            {/* Subtle gradient sheen — skipped for reduced motion */}
            {!reducedMotion && (
              <motion.span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%)",
                  backgroundSize: "200% 100%",
                }}
                animate={{ backgroundPosition: ["200% 0%", "-100% 0%"] }}
                transition={{
                  duration: 3.2,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            )}
            <Sparkles size={16} strokeWidth={2} aria-hidden="true" />
            <span className="relative">Je suis dispo ce soir</span>
          </motion.button>
        ) : (
          <motion.div
            key="active"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
            className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border bg-bg-card"
            style={{
              borderColor: "var(--color-accent-2)55",
              boxShadow: "0 0 18px rgba(0,255,136,0.15)",
            }}
          >
            <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
              {!reducedMotion && (
                <motion.span
                  className="absolute inset-0 rounded-full"
                  style={{ background: "var(--color-accent-2)" }}
                  animate={{ opacity: [0.6, 0, 0.6], scale: [1, 1.9, 1] }}
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              )}
              <span
                className="relative inline-flex h-2.5 w-2.5 rounded-full"
                style={{ background: "var(--color-accent-2)" }}
              />
            </span>
            <span className="text-[13px] font-semibold text-text">
              Disponible
            </span>
            <span className="text-[12px] text-text-muted tabular-nums">
              · expire dans {formatRemaining(remainingMs)}
            </span>
            <button
              type="button"
              onClick={cancel}
              disabled={pending}
              aria-label="Annuler le statut"
              className="ml-1 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium text-text-muted hover:text-text hover:bg-bg transition-colors tap-target disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            >
              <X size={12} strokeWidth={2} aria-hidden="true" />
              Annuler
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {!isActive && (
        <p className="text-[11px] text-text-muted">
          Visible {defaultHours}h pour les profils proches
        </p>
      )}
    </div>
  );
}
