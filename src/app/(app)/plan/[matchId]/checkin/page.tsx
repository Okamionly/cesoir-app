"use client";

/**
 * Plan Check-In page (Wave 17).
 *
 * Path: `/plan/[matchId]/checkin`
 *
 * `matchId` here is the CONVERSATION id between the two users (same
 * convention as `/plan/[matchId]` for the date planner). On mount we:
 *   1. Resolve the conversation → peer id.
 *   2. Resolve the most recent plan between the caller and the peer
 *      (`plans` 1:1 first, falling back to shared `flash_plans` —
 *      same logic as IRLConfirm/the confirm-irl API).
 *   3. Render two tabs:
 *      • "Mon code"   → <QRCheckInDisplay planId={plan} userId={me}/>
 *      • "Scanner"    → <QRCheckInScanner planId={plan} peerUserId={peer}/>
 *
 * If we can't resolve a plan we surface a friendly empty state — the
 * page is reachable from `/plan/[matchId]` and we don't want a hard
 * crash when someone navigates here before any plan exists.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { m, AnimatePresence } from "motion/react";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { logger } from "@/lib/logger";
import QRCheckInDisplay from "@/components/checkin/QRCheckInDisplay";
import QRCheckInScanner from "@/components/checkin/QRCheckInScanner";

type Tab = "display" | "scan";

interface ResolvedPlan {
  planId: string;
  peerId: string;
  peerName: string | null;
  source: "plans" | "flash_plans";
}

/** Pair the two participants in deterministic (user_a, user_b) order. */
function orderedPair(a: string, b: string) {
  return a < b ? { userA: a, userB: b } : { userA: b, userB: a };
}

/**
 * Find the most recent plan id between the two users. Mirrors the
 * server-side findMostRecentPlan in /api/match/confirm-irl.
 */
async function resolveMostRecentPlanId(
  callerId: string,
  peerId: string,
): Promise<{ planId: string; source: "plans" | "flash_plans" } | null> {
  const ordered = orderedPair(callerId, peerId);

  // 1) plans table — 1:1 dating model.
  const { data: planRows } = await supabase
    .from("plans")
    .select("id, when_date")
    .eq("user_a", ordered.userA)
    .eq("user_b", ordered.userB)
    .order("when_date", { ascending: false })
    .limit(1);

  if (planRows && planRows.length > 0) {
    return { planId: planRows[0].id as string, source: "plans" };
  }

  // 2) flash_plans fallback.
  const { data: fpRows } = await supabase
    .from("flash_plan_participants")
    .select("flash_plan_id, status, user_id")
    .in("user_id", [callerId, peerId])
    .eq("status", "accepted");

  if (!fpRows) return null;

  const counts = new Map<string, number>();
  for (const row of fpRows) {
    counts.set(row.flash_plan_id, (counts.get(row.flash_plan_id) ?? 0) + 1);
  }
  const sharedIds = Array.from(counts.entries())
    .filter(([, c]) => c >= 2)
    .map(([id]) => id);

  if (sharedIds.length === 0) return null;

  const { data: flash } = await supabase
    .from("flash_plans")
    .select("id, when_at")
    .in("id", sharedIds)
    .order("when_at", { ascending: false })
    .limit(1);

  if (!flash || flash.length === 0) return null;

  return { planId: flash[0].id as string, source: "flash_plans" };
}

export default function PlanCheckinPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const conversationId = params.matchId as string;

  const [tab, setTab] = useState<Tab>("display");
  const [loading, setLoading] = useState(true);
  const [resolved, setResolved] = useState<ResolvedPlan | null>(null);

  const callerId = user?.id ?? null;

  // ── Resolve conversation → peer → plan ──────────────────────────────
  useEffect(() => {
    let cancelled = false;
    if (!callerId || !conversationId) return;

    setLoading(true);

    (async () => {
      try {
        // 1) Conversation membership + peer id.
        const { data: convo, error: convoErr } = await supabase
          .from("conversations")
          .select("user_a, user_b")
          .eq("id", conversationId)
          .maybeSingle();

        if (cancelled) return;
        if (convoErr || !convo) {
          setResolved(null);
          setLoading(false);
          return;
        }

        const peerId =
          convo.user_a === callerId ? convo.user_b : convo.user_a;

        // 2) Peer profile name (best-effort, ok if it fails).
        const { data: peer } = await supabase
          .from("profiles")
          .select("name")
          .eq("id", peerId)
          .maybeSingle();

        if (cancelled) return;

        // 3) Most recent plan id.
        const planLookup = await resolveMostRecentPlanId(callerId, peerId);

        if (cancelled) return;
        if (!planLookup) {
          setResolved(null);
          setLoading(false);
          return;
        }

        setResolved({
          planId: planLookup.planId,
          peerId,
          peerName: (peer?.name as string | null) ?? null,
          source: planLookup.source,
        });
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        logger.warn("plan_checkin_resolve_failed", {
          err: err instanceof Error ? err.message : String(err),
        });
        setResolved(null);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [callerId, conversationId]);

  const handleScanResult = useCallback(
    ({ mutual }: { mutual: boolean }) => {
      // After a successful mutual scan, drop back to the chat after a
      // short pause so the success message is visible.
      if (mutual) {
        setTimeout(() => {
          router.push(`/chat/${conversationId}`);
        }, 1500);
      }
    },
    [router, conversationId],
  );

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-bg">
      <PageHeader
        title="Check-in"
        subtitle="Scanne-toi mutuellement au lieu de RDV"
        onBack={() => router.back()}
      />

      <main className="pb-32 pt-2">
        {/* Tabs */}
        {resolved && (
          <div className="px-5 mb-4">
            <div className="flex rounded-2xl border border-border bg-bg-card p-1">
              <TabButton
                active={tab === "display"}
                onClick={() => setTab("display")}
                label="Mon code"
              />
              <TabButton
                active={tab === "scan"}
                onClick={() => setTab("scan")}
                label="Scanner"
              />
            </div>
          </div>
        )}

        {/* Body */}
        {loading && (
          <div className="flex flex-col items-center gap-3 py-16">
            <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <p className="text-[12px] text-text-muted">
              Recuperation du plan...
            </p>
          </div>
        )}

        {!loading && !resolved && (
          <EmptyState
            emoji="📍"
            title="Pas encore de plan"
            subtitle="Cree un plan ensemble avant de pouvoir vous check-in mutuellement."
          />
        )}

        {!loading && resolved && callerId && (
          <AnimatePresence mode="wait">
            {tab === "display" ? (
              <m.div
                key="display"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.18 }}
              >
                <QRCheckInDisplay
                  planId={resolved.planId}
                  userId={callerId}
                  selfName={user?.user_metadata?.name ?? "moi"}
                />
              </m.div>
            ) : (
              <m.div
                key="scan"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.18 }}
              >
                <QRCheckInScanner
                  planId={resolved.planId}
                  peerUserId={resolved.peerId}
                  peerName={resolved.peerName ?? undefined}
                  onScanned={handleScanResult}
                />
              </m.div>
            )}
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}

// ─────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex-1 py-2.5 rounded-xl text-[13px] font-bold transition-all ${
        active
          ? "gradient-bg text-white shadow-glow"
          : "text-text-muted hover:text-text"
      }`}
    >
      {label}
    </button>
  );
}
