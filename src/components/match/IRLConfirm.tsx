"use client";

/**
 * IRLConfirm — "Vu ce soir ?" bottom sheet.
 *
 * Lifecycle (chat/[id]):
 *   1. Component mounts on the chat page with conversationId + peerName.
 *   2. It autonomously checks Supabase for:
 *        - the most recent plan (1:1 `plans` or shared `flash_plans`)
 *        - whether the caller has ALREADY confirmed
 *        - whether the user has actively dismissed in this session
 *      It renders ONLY if a plan exists, plan_time is in the past by
 *      >= 2h, < 50h have elapsed since plan_time, and the user has not
 *      confirmed yet.
 *   3. "Oui, on s'est vus" → POST /api/match/confirm-irl. On success
 *      (200), unmounts the sheet. The /api/match/confirm-irl response
 *      tells us if the badge was awarded; the GamificationToasts global
 *      listener picks up the new achievement row on next refetch and
 *      surfaces the "Badge débloqué" toast.
 *   4. "Pas cette fois" → dismiss locally only. NO server-side write
 *      (privacy spec — no penalty, no audit trail).
 *
 * Auto-refresh: GamificationToasts watches achievements table reactively
 * via useBadges. After a successful mutual-confirm, the achievements row
 * lands in DB → useBadges refetches → toast fires. This is wired through
 * the existing layout-level <GamificationToasts /> mount, no extra wiring
 * needed here.
 *
 * TODO if GamificationToasts is ever removed: trigger a custom event
 * here on { mutual: true, awarded: true } and have a local listener pop
 * a toast. For now the global listener handles it.
 */

import { useCallback, useEffect, useState } from "react";
import { m, AnimatePresence } from "motion/react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { logger } from "@/lib/logger";

// --- Constants (must match server-side) --------------------------------

const CONFIRM_WINDOW_OPENS_MS = 2 * 60 * 60 * 1000; // +2h
const CONFIRM_WINDOW_CLOSES_MS = 50 * 60 * 60 * 1000; // +2h + 48h

// --- Types -------------------------------------------------------------

interface IRLConfirmProps {
  /** Active conversation id — the modal scopes everything to this convo. */
  conversationId: string;
  /** Peer display name for the prompt copy. */
  peerName: string;
  /** Optional callback fired after a successful confirmation (mutual or solo). */
  onConfirmed?: (mutual: boolean) => void;
}

interface VisibilityState {
  visible: boolean;
  /** Source plan time in ms — used only for instrumentation/debug. */
  planTimeMs: number | null;
}

// --- Helpers -----------------------------------------------------------

/** Pair the two participants in deterministic (user_a, user_b) order. */
function orderedPair(a: string, b: string): { userA: string; userB: string } {
  return a < b
    ? { userA: a, userB: b }
    : { userA: b, userB: a };
}

/**
 * Probe the DB for the most recent plan (plans → flash_plans fallback)
 * and report whether the confirmation window is currently open.
 *
 * Mirrors the server-side findMostRecentPlan + window logic so the UI
 * doesn't pop the modal unless the API would also accept the request.
 * The API stays the source of truth — this is best-effort UX gating.
 */
async function probeWindow(
  callerId: string,
  peerId: string,
): Promise<{ planTimeMs: number | null; inWindow: boolean }> {
  const ordered = orderedPair(callerId, peerId);

  // 1) `plans` table — 1:1 dating model.
  const { data: planRows } = await supabase
    .from("plans")
    .select("when_date")
    .eq("user_a", ordered.userA)
    .eq("user_b", ordered.userB)
    .order("when_date", { ascending: false })
    .limit(1);

  let planTimeMs: number | null = null;
  if (planRows && planRows.length > 0) {
    planTimeMs = new Date(planRows[0].when_date).getTime();
  } else {
    // 2) flash_plans — group plans where both users are accepted.
    const { data: fpRows } = await supabase
      .from("flash_plan_participants")
      .select("flash_plan_id, status, user_id")
      .in("user_id", [callerId, peerId])
      .eq("status", "accepted");

    if (fpRows) {
      const counts = new Map<string, number>();
      for (const row of fpRows) {
        counts.set(row.flash_plan_id, (counts.get(row.flash_plan_id) ?? 0) + 1);
      }
      const sharedIds = Array.from(counts.entries())
        .filter(([, c]) => c >= 2)
        .map(([id]) => id);

      if (sharedIds.length > 0) {
        const { data: flash } = await supabase
          .from("flash_plans")
          .select("when_at")
          .in("id", sharedIds)
          .order("when_at", { ascending: false })
          .limit(1);

        if (flash && flash.length > 0) {
          planTimeMs = new Date(flash[0].when_at).getTime();
        }
      }
    }
  }

  if (planTimeMs === null) return { planTimeMs: null, inWindow: false };

  const now = Date.now();
  const opens = planTimeMs + CONFIRM_WINDOW_OPENS_MS;
  const closes = planTimeMs + CONFIRM_WINDOW_CLOSES_MS;
  return {
    planTimeMs,
    inWindow: now >= opens && now <= closes,
  };
}

// --- Component ---------------------------------------------------------

export default function IRLConfirm({
  conversationId,
  peerName,
  onConfirmed,
}: IRLConfirmProps) {
  const { user } = useAuth();
  const callerId = user?.id;

  const [state, setState] = useState<VisibilityState>({
    visible: false,
    planTimeMs: null,
  });
  const [submitting, setSubmitting] = useState(false);
  // Per-tab dismissal — survives re-renders but resets on next visit.
  const [dismissed, setDismissed] = useState(false);

  // ── Visibility probe ────────────────────────────────────────────────
  // Runs on mount + when caller/conversation/dismissed flips. We do NOT
  // poll — the chat page already re-mounts this component on each visit
  // and that's enough. The window itself is 48h wide.
  useEffect(() => {
    let cancelled = false;
    if (!callerId || !conversationId || dismissed) {
      setState({ visible: false, planTimeMs: null });
      return;
    }

    (async () => {
      try {
        // Look up the conversation to find the peer id.
        const { data: convo, error: convoErr } = await supabase
          .from("conversations")
          .select("user_a, user_b")
          .eq("id", conversationId)
          .maybeSingle();

        if (cancelled) return;
        if (convoErr || !convo) {
          setState({ visible: false, planTimeMs: null });
          return;
        }

        const peerId = convo.user_a === callerId ? convo.user_b : convo.user_a;

        // Has the caller ALREADY confirmed for this convo? If yes, hide.
        const { data: existing } = await supabase
          .from("irl_confirmations")
          .select("user_id")
          .eq("conversation_id", conversationId)
          .eq("user_id", callerId)
          .maybeSingle();

        if (cancelled) return;
        if (existing) {
          setState({ visible: false, planTimeMs: null });
          return;
        }

        // Probe the plan window.
        const { planTimeMs, inWindow } = await probeWindow(callerId, peerId);
        if (cancelled) return;
        setState({ visible: inWindow, planTimeMs });
      } catch (err) {
        if (cancelled) return;
        logger.warn("irl_confirm_probe_failed", {
          err: err instanceof Error ? err.message : String(err),
        });
        setState({ visible: false, planTimeMs: null });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [callerId, conversationId, dismissed]);

  // ── Handlers ────────────────────────────────────────────────────────
  const handleYes = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);

    // Pull the current session bearer token to send with the API call.
    // Keeps us on the same auth path as other client → /api/* calls.
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    try {
      const res = await fetch("/api/match/confirm-irl", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ conversationId }),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as
          | { error?: string; code?: string }
          | null;
        logger.warn("irl_confirm_api_rejected", {
          status: res.status,
          code: payload?.code,
          error: payload?.error,
        });
        // Treat 409 (already_confirmed) as success — same observable
        // outcome from the user's side: dismiss the sheet.
        if (res.status !== 409) {
          // Soft-fail: keep the sheet open so the user can retry.
          setSubmitting(false);
          return;
        }
      }

      const json = (await res.json().catch(() => null)) as
        | { ok: true; data: { mutual: boolean; awarded: boolean } }
        | null;

      const mutual = json?.data?.mutual ?? false;
      onConfirmed?.(mutual);
      // GamificationToasts (mounted in (app)/layout.tsx) will detect the
      // new "first-date" achievement on next useBadges refetch and pop
      // the badge-unlock toast. Nothing to do here.
    } catch (err) {
      logger.warn("irl_confirm_api_threw", {
        err: err instanceof Error ? err.message : String(err),
      });
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setDismissed(true);
  }, [conversationId, submitting, onConfirmed]);

  const handleNo = useCallback(() => {
    // Privacy spec: NO server write on "Pas cette fois". Just dismiss.
    setDismissed(true);
  }, []);

  // ── Render ──────────────────────────────────────────────────────────
  if (!state.visible) return null;

  return (
    <AnimatePresence>
      <m.div
        className="fixed inset-0 z-[90] flex items-end justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        role="dialog"
        aria-label="Confirmation de rencontre IRL"
        aria-modal="true"
      >
        {/* Backdrop — tap to dismiss (same as "Pas cette fois") */}
        <m.div
          className="absolute inset-0 bg-black/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleNo}
        />

        {/* Sheet */}
        <m.div
          className="relative bg-bg rounded-t-3xl border-t border-border w-full max-w-lg pb-8 pt-3 shadow-xl"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 220, damping: 26, mass: 1.4 }}
        >
          {/* Handle */}
          <div className="flex justify-center mb-4">
            <div className="w-10 h-1 rounded-full bg-border" />
          </div>

          <div className="px-6">
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 150, damping: 20, mass: 1.2 }}
            >
              <h2 className="text-[18px] font-black text-text text-center mb-2">
                Vous vous êtes vus IRL ?
              </h2>
              <p className="text-[13px] text-text-muted text-center mb-6">
                Vous et {peerName} aviez prévu de sortir.
                <br />
                Si {peerName} confirme aussi, vous gagnez tous les deux +20 karma
                et le badge Premier RDV.
              </p>

              <div className="flex flex-col gap-2.5">
                <m.button
                  type="button"
                  onClick={handleYes}
                  disabled={submitting}
                  className="w-full py-4 rounded-2xl gradient-bg text-white font-bold text-[15px] shadow-glow disabled:opacity-60 disabled:cursor-not-allowed"
                  whileTap={!submitting ? { scale: 0.97 } : undefined}
                >
                  {submitting ? "Envoi..." : "Oui, on s'est vus 🎉"}
                </m.button>

                <m.button
                  type="button"
                  onClick={handleNo}
                  disabled={submitting}
                  className="w-full py-3.5 rounded-2xl bg-bg-card border border-border text-text-muted font-semibold text-[14px] disabled:opacity-60"
                  whileTap={!submitting ? { scale: 0.97 } : undefined}
                >
                  Pas cette fois
                </m.button>
              </div>

              <p className="text-[11px] text-text-muted text-center mt-4 opacity-60">
                Ta réponse est privée. Aucun message envoyé à {peerName}.
              </p>
            </m.div>
          </div>
        </m.div>
      </m.div>
    </AnimatePresence>
  );
}
