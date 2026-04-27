/**
 * Referral helpers — DB-backed since Wave 16 Bet #2 (2026-04-27).
 *
 * Pre-Wave 16 the file was a localStorage-only stub from the original
 * Wave 14 mock (kept around so unrelated badge logic compiled). Now that
 * mig 025 has shipped the hybrid invite-reward model, every referral fact
 * lives on `public.invite_codes` (created_by → who minted, used_by → who
 * claimed). We read straight from the table — RLS already lets a user see
 * the rows where `created_by = auth.uid()`.
 *
 * The +5 roses / +founder badge rewards are emitted atomically by the
 * `claim_invite_code` RPC (mig 025). We don't have per-row reward columns
 * on the table — instead we know the protocol constants and derive the
 * stats from them. If migration 025 ever changes the per-claim payout,
 * update `ROSES_PER_CLAIM` below.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  namespacedChannelName,
  useRealtimeChannel,
} from "@/lib/hooks/useSupabaseQuery";
import { logger } from "@/lib/logger";

// ──────────────────────────────────────────────────────────────────────
// Constants (mirrored from supabase/migrations/025_invite_rewards_hybrid.sql)
// ──────────────────────────────────────────────────────────────────────

/** Roses awarded to BOTH sides per successful claim. From mig 025 (v_roses_amount = 5). */
export const ROSES_PER_CLAIM = 5;

/** Achievement key minted by the RPC for the new user. */
export const FOUNDER_ACHIEVEMENT_KEY = "founder";

// ──────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────

export interface ReferralCodeEntry {
  /** The 8-char code itself. */
  code: string;
  /** auth.users.id of the friend who claimed this code, or null if unused. */
  usedBy: string | null;
  /** ISO timestamp of the claim, or null if unused. */
  usedAt: string | null;
  /** Roses the inviter earned for this claim. 0 if not yet used. Always +5 once claimed. */
  rosesGranted: number;
  /** Achievement key the new user received via this claim, or null if unused. */
  badgeGranted: string | null;
  /** ISO expiry timestamp (mig 021 default = +30 days). */
  expiresAt: string;
  /** ISO mint timestamp. */
  createdAt: string;
}

export interface ReferralInfo {
  /** Every code I've minted, newest first (active + used + expired). */
  myCodes: ReferralCodeEntry[];
  /** Number of distinct friends who claimed one of my codes. */
  totalReferrals: number;
  /** Sum of rose payouts attributed to me from referrals. */
  totalRosesEarned: number;
  /** Subset of `totalReferrals` who currently hold the 'founder' achievement. */
  activeFounders: number;
}

interface InviteCodeRow {
  code: string;
  used_by: string | null;
  used_at: string | null;
  expires_at: string;
  created_at: string;
}

// ──────────────────────────────────────────────────────────────────────
// Core fetcher (server-callable, no React)
// ──────────────────────────────────────────────────────────────────────

const EMPTY_INFO: ReferralInfo = {
  myCodes: [],
  totalReferrals: 0,
  totalRosesEarned: 0,
  activeFounders: 0,
};

/**
 * Fetch the user's referral stats straight from Supabase.
 *
 * Two queries:
 *   1. `invite_codes WHERE created_by = $userId` — RLS-allowed for the owner.
 *   2. `achievements WHERE achievement_key = 'founder' AND user_id IN (used_by[])`
 *      — `achievements` has a public SELECT policy (mig 002), so this works
 *      regardless of who the inviter is.
 *
 * Errors surface up — caller decides whether to swallow / toast / log.
 */
export async function getReferralInfo(userId: string): Promise<ReferralInfo> {
  if (!userId) return EMPTY_INFO;

  const { data: rows, error: codesErr } = await supabase
    .from("invite_codes")
    .select("code, used_by, used_at, expires_at, created_at")
    .eq("created_by", userId)
    .order("created_at", { ascending: false });

  if (codesErr) {
    logger.error("referral_getReferralInfo_codes_failed", {
      err: codesErr.message,
    });
    throw codesErr;
  }

  const codes = (rows ?? []) as InviteCodeRow[];
  const usedCodes = codes.filter((c) => c.used_by !== null);
  const usedByIds = usedCodes
    .map((c) => c.used_by)
    .filter((v): v is string => v !== null);

  // Founder achievements — null payload when nobody claimed yet (skip the round-trip).
  let founderUserIds = new Set<string>();
  if (usedByIds.length > 0) {
    const { data: achievements, error: achErr } = await supabase
      .from("achievements")
      .select("user_id")
      .eq("achievement_key", FOUNDER_ACHIEVEMENT_KEY)
      .in("user_id", usedByIds);

    if (achErr) {
      // Achievements are non-critical for the headline stats — log and move on
      // so the page still renders the codes.
      logger.warn("referral_getReferralInfo_achievements_failed", {
        err: achErr.message,
      });
    } else {
      founderUserIds = new Set(
        (achievements ?? []).map((a: { user_id: string }) => a.user_id),
      );
    }
  }

  const myCodes: ReferralCodeEntry[] = codes.map((c) => ({
    code: c.code,
    usedBy: c.used_by,
    usedAt: c.used_at,
    rosesGranted: c.used_by ? ROSES_PER_CLAIM : 0,
    badgeGranted: c.used_by ? FOUNDER_ACHIEVEMENT_KEY : null,
    expiresAt: c.expires_at,
    createdAt: c.created_at,
  }));

  return {
    myCodes,
    totalReferrals: usedCodes.length,
    totalRosesEarned: usedCodes.length * ROSES_PER_CLAIM,
    activeFounders: founderUserIds.size,
  };
}

// ──────────────────────────────────────────────────────────────────────
// Sharing helper (kept from the legacy stub — used by /invites/mine)
// ──────────────────────────────────────────────────────────────────────

/**
 * Build the deep link a user should share for a given invite code.
 *
 * Server-safe: when `window` is undefined we fall back to the configured
 * site URL so the link can also be embedded in transactional emails.
 */
export function buildInviteUrl(code: string): string {
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL ?? "https://cesoir-app.vercel.app";
  return `${origin}/signup-quick?invite=${encodeURIComponent(code)}`;
}

// ──────────────────────────────────────────────────────────────────────
// React hook (with optional realtime subscription)
// ──────────────────────────────────────────────────────────────────────

export interface UseReferralInfoResult {
  info: ReferralInfo;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * React hook around `getReferralInfo` with a live Supabase realtime
 * subscription on `invite_codes` filtered to rows the user owns.
 *
 * The subscription mirrors the canonical pattern from `useFeed` —
 * per-user namespaced channel + `useRealtimeChannel` for guaranteed
 * cleanup on unmount + auto-reconnect on `window.online`. We don't try
 * to patch the local state by hand; instead any realtime UPDATE simply
 * triggers a refetch of both queries (cheap — usually < 10 rows total).
 */
export function useReferralInfo(
  userId: string | null | undefined,
): UseReferralInfoResult {
  const [info, setInfo] = useState<ReferralInfo>(EMPTY_INFO);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchOnce = useCallback(async () => {
    if (!userId) {
      setInfo(EMPTY_INFO);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const next = await getReferralInfo(userId);
      setInfo(next);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void fetchOnce();
  }, [fetchOnce]);

  // Realtime: refresh whenever any of my invite_codes rows change. The
  // RPC `claim_invite_code` UPDATEs (sets used_by + used_at) so the event
  // we actually care about is UPDATE — but the filter is also valid for
  // future INSERTs (e.g. minting more codes) and DELETEs (account purge).
  useRealtimeChannel(
    (client) =>
      userId
        ? client
            .channel(namespacedChannelName("invite-codes-realtime", userId))
            .on(
              "postgres_changes",
              {
                event: "*",
                schema: "public",
                table: "invite_codes",
                filter: `created_by=eq.${userId}`,
              },
              () => {
                void fetchOnce();
              },
            )
        : null,
    [userId, fetchOnce],
  );

  return useMemo(
    () => ({ info, loading, error, refetch: fetchOnce }),
    [info, loading, error, fetchOnce],
  );
}
