import { logger } from "./logger";

// ========================================
// CeSoir Matching Algorithm
// The heart of the app: find someone to go out with TONIGHT.
// ========================================
//
// Scoring breakdown (0-100):
//   Mode compatibility:  40 pts  — both active in the same mode
//   Distance:            25 pts  — closer = higher
//   Timing:              20 pts  — both available NOW beats "later"
//   Social proof:        15 pts  — karma, reviews, verification, vibe match
//
// The algorithm is designed for URGENCY: tonight, nearby, same vibe.

import { supabase } from "@/lib/supabase";
import type { ModeKey } from "@/lib/modes";
import type { VibeId } from "@/lib/vibes";

// ----------------------------------------
// Types
// ----------------------------------------

/** A single candidate returned by the matching pipeline. */
export interface MatchCandidate {
  /** Profile ID */
  id: string;
  name: string;
  age: number;
  gender: string;
  bio: string;
  avatar_url: string | null;
  is_verified: boolean;
  /** Distance in km from the searching user */
  distance_km: number;
  /** Total match score 0-100 */
  score: number;
  /** Breakdown of the score for transparency / debugging */
  scoreBreakdown: ScoreBreakdown;
  /** Modes this candidate has in common with the searching user */
  sharedModes: ModeKey[];
  /** All active modes for this candidate */
  activeModes: ModeKey[];
  /** When the candidate is available (ISO string or null) */
  availableTime: string | null;
  /** Latitude */
  lat: number;
  /** Longitude */
  lng: number;
  /** True if the candidate has the 'founder' achievement (signed up via invite code) */
  is_founder?: boolean;
  /**
   * 2026-04-27 (mig 030): true while the candidate's "Je suis dispo
   * ce soir" broadcast is active. Drives the green pulse ring and
   * "Dispo maintenant" pill on swipe cards / map pins.
   */
  broadcast_active?: boolean;
  /**
   * 2026-04-28 (mig 039): the candidate's vibe today (or null). Read
   * server-side via the get_vibe_today RPC so stale (yesterday) values
   * are filtered out automatically. Surfaces as a chip on the swipe
   * card and feeds the +2 same-vibe bonus in the social score.
   */
  vibe_today?: VibeId | null;
}

export interface ScoreBreakdown {
  mode: number;      // 0-40
  distance: number;  // 0-25
  timing: number;    // 0-20
  social: number;    // 0-15
}

/** Options for the findMatches query. */
export interface MatchOptions {
  /** Filter to a single mode. If null, match across all active modes. */
  mode?: ModeKey | null;
  /** Maximum search radius in km (default: 10) */
  maxDistance?: number;
  /** Minimum age filter */
  minAge?: number;
  /** Maximum age filter */
  maxAge?: number;
  /** Max number of results to return (default: 20) */
  limit?: number;
  /** Gender preference filter — "hommes" | "femmes" | "tous" */
  genderFilter?: string | null;
}

/**
 * Raw row returned by the `nearby_profiles` RPC function.
 *
 * 2026-04-24 (migration 024 / #5 SEC-001): `lat/lng` are now
 * **grid-snapped to ~500m (0.005°)** server-side. The values below are
 * coarse on purpose — never treat them as precise. See the migration's
 * `COMMENT ON FUNCTION` for the full rationale.
 */
interface NearbyProfileRow {
  id: string;
  name: string;
  age: number;
  gender: string;
  bio: string;
  avatar_url: string | null;
  is_verified: boolean;
  distance_km: number;
  mode: string | null;
  available_time: string | null;
  mode_details: Record<string, unknown> | null;
  lat_rough: number;
  lng_rough: number;
  /**
   * 2026-04-27 (mig 030): true when the profile has tapped
   * "Je suis dispo ce soir" and `broadcast_until > now()`.
   * Computed in SQL — clients cannot spoof it.
   */
  broadcast_active?: boolean;
}

// ----------------------------------------
// Score calculation
// ----------------------------------------

/**
 * Calculate the match score between two users.
 *
 * @param userModes  - Active modes of the searching user
 * @param candidate  - Raw nearby profile row from the RPC
 * @param candidateModes - All active modes for the candidate
 * @param candidateKarma - Total karma points for the candidate
 * @param candidateReviewAvg - Average review rating (1-5) for the candidate
 * @param vibeMatch - True when both users picked the SAME vibe today (mig 039)
 * @param ghostPenaltyActive - True when the candidate has an active
 *        anti-ghost penalty (mig 045). Triggers a -5 visibility deboost
 *        in the social bucket — this is the visibility cost.
 * @returns Score 0-100 and its breakdown
 */
export function calculateMatchScore(
  userModes: ModeKey[],
  candidate: NearbyProfileRow,
  candidateModes: ModeKey[],
  candidateKarma: number,
  candidateReviewAvg: number,
  vibeMatch: boolean = false,
  ghostPenaltyActive: boolean = false,
): { score: number; breakdown: ScoreBreakdown; sharedModes: ModeKey[] } {
  // --- 1. Mode compatibility (40 pts max) ---
  const sharedModes = userModes.filter((m) => candidateModes.includes(m));

  let modeScore: number;
  if (sharedModes.length === 0) {
    // No shared modes at all — hard penalty
    modeScore = 0;
  } else if (sharedModes.length === 1) {
    // One shared mode — solid base
    modeScore = 25;
  } else if (sharedModes.length === 2) {
    modeScore = 33;
  } else {
    // 3+ shared modes — near-perfect vibe match
    modeScore = 40;
  }

  // Bonus: if the candidate's *primary* active mode (the one returned by RPC)
  // matches one of the user's modes, extra weight — they specifically activated it.
  if (candidate.mode && userModes.includes(candidate.mode as ModeKey)) {
    modeScore = Math.min(40, modeScore + 5);
  }

  // --- 2. Distance (25 pts max) ---
  const distanceScore = getDistanceScore(candidate.distance_km);

  // --- 3. Timing (20 pts max) ---
  const timingScore = getTimingScore(candidate.available_time);

  // --- 4. Social proof (15 pts max) ---
  const socialScore = getSocialScore(
    candidate.is_verified,
    candidateKarma,
    candidateReviewAvg,
    candidate.broadcast_active === true,
    vibeMatch,
    ghostPenaltyActive,
  );

  const breakdown: ScoreBreakdown = {
    mode: modeScore,
    distance: distanceScore,
    timing: timingScore,
    social: socialScore,
  };

  const score = Math.round(
    Math.min(100, Math.max(0, modeScore + distanceScore + timingScore + socialScore)),
  );

  return { score, breakdown, sharedModes };
}

/**
 * Distance scoring:
 *   0-1 km  = 25 pts
 *   1-3 km  = 20 pts
 *   3-5 km  = 15 pts
 *   5-10 km = 8 pts
 *   10+ km  = 0 pts
 */
function getDistanceScore(distanceKm: number): number {
  if (distanceKm <= 1) return 25;
  if (distanceKm <= 3) return 20;
  if (distanceKm <= 5) return 15;
  if (distanceKm <= 10) return 8;
  return 0;
}

/**
 * Timing scoring — how soon is the candidate available?
 *   Available NOW (within 30 min)   = 20 pts
 *   Within 1 hour                   = 15 pts
 *   Within 2 hours                  = 10 pts
 *   Later tonight                   = 5 pts
 *   No availability set             = 3 pts (benefit of doubt)
 */
function getTimingScore(availableTime: string | null): number {
  if (!availableTime) return 3;

  const now = Date.now();
  const available = new Date(availableTime).getTime();
  const diffMs = available - now;
  const diffMinutes = diffMs / (1000 * 60);

  // Already available or available within 30 min
  if (diffMinutes <= 30) return 20;
  // Within 1 hour
  if (diffMinutes <= 60) return 15;
  // Within 2 hours
  if (diffMinutes <= 120) return 10;
  // Later tonight
  return 5;
}

/**
 * Social proof scoring (15 pts max):
 *   Verified badge:                    +5 pts
 *   Karma (0-100 scale):               0-5 pts
 *   Review average (1-5):              0-5 pts
 *   Active "dispo ce soir" broadcast:  +5 pts (mig 030)
 *   Same vibe today (Wave 17):         +2 pts (mig 039)
 *   Active ghost penalty (mig 045):    -5 pts (visibility cost)
 *
 * The broadcast bonus deliberately sits in the social bucket: it's a
 * declared intent signal ("I'm actually available right now") and feeds
 * the same urgency the timing score already chases. Capped at 15 like
 * the rest of the social block, so the boost never lets a stranger
 * outscore a high-karma + reviewed match — it just nudges the tie.
 *
 * The vibe match is a small +2 nudge — strong enough to break ties
 * between two otherwise-equal candidates but never enough to flip a
 * low-quality match above a high-quality one. Both users must have
 * picked the SAME vibe today (read through get_vibe_today RPC so
 * yesterday's selection doesn't count).
 *
 * Mig 045 (anti-ghost) — `ghostPenaltyActive` subtracts 5 from the
 * social score and is allowed to push the bucket below zero (we floor
 * at 0 at the very end). This is the visibility cost: a chronic
 * ghoster never disappears entirely from the deck, but they slide down
 * far enough that fresh, well-behaved candidates float to the top.
 * Combined with the -15 × severity karma deduction (also reflected in
 * `karma`) the deboost compounds — the user pays in both dimensions.
 */
function getSocialScore(
  isVerified: boolean,
  karma: number,
  reviewAvg: number,
  broadcastActive: boolean = false,
  vibeMatch: boolean = false,
  ghostPenaltyActive: boolean = false,
): number {
  let score = 0;

  // Verification: trust signal
  if (isVerified) score += 5;

  // Karma: map 0-100+ karma to 0-5 pts (cap at 100)
  const clampedKarma = Math.min(100, Math.max(0, karma));
  score += Math.round((clampedKarma / 100) * 5);

  // Reviews: map 1-5 average to 0-5 pts
  if (reviewAvg > 0) {
    score += Math.round(((reviewAvg - 1) / 4) * 5);
  }

  // Live availability broadcast (mig 030): the user explicitly
  // tapped "Je suis dispo ce soir" — boost the social score so they
  // surface to the top of the swipe deck while the flag is live.
  if (broadcastActive) score += 5;

  // Same vibe today (mig 039): tiny tie-break bonus when both users
  // picked the SAME mood for tonight. Capped at 15 like the rest of
  // the social block, so this never flips bad matches above good ones.
  if (vibeMatch) score += 2;

  // Anti-ghost visibility deboost (mig 045): chronic ghosters lose
  // visibility while a penalty row is active (≤30 days). -5 is the
  // visibility cost; the karma side of the punishment is already
  // baked into `karma` above via the karma_transactions deduction.
  if (ghostPenaltyActive) score -= 5;

  return Math.min(15, Math.max(0, score));
}

// ----------------------------------------
// Main matching pipeline
// ----------------------------------------

/**
 * Find the best matches for a user. This is the core pipeline:
 *
 * 1. Query Supabase for nearby active profiles (RPC)
 * 2. Filter out already-interacted users (liked, passed, blocked)
 * 3. Filter by age range
 * 4. Fetch social proof data (karma, reviews)
 * 5. Score each candidate
 * 6. Sort by score descending
 * 7. Return top N
 */
export async function findMatches(
  userId: string,
  userLat: number,
  userLng: number,
  options: MatchOptions = {},
): Promise<MatchCandidate[]> {
  const {
    mode = null,
    maxDistance = 10,
    minAge,
    maxAge,
    limit = 20,
    genderFilter = null,
  } = options;

  // ----- Step 1: Get nearby profiles via RPC -----
  const { data: nearbyRaw, error: nearbyError } = await supabase.rpc(
    "nearby_profiles",
    {
      user_lat: userLat,
      user_lng: userLng,
      radius_km: maxDistance,
      mode_filter: mode,
      gender_filter: genderFilter,
      limit_count: limit * 3, // Over-fetch because we'll filter
    },
  );

  if (nearbyError || !nearbyRaw) {
    logger.error("matching_nearby_profiles_rpc_failed", { err: nearbyError?.message });
    return [];
  }

  const nearby = nearbyRaw as NearbyProfileRow[];

  // 2026-04-26 fix: dedupe by id. The nearby_profiles RPC LEFT JOINs
  // mode_activations, so a profile with N active modes appears N times
  // in the result set. /browse swipe deck shows duplicate cards, /map
  // throws React key collisions. Keep the FIRST occurrence — its `mode`
  // column reflects the user's primary mode per the LEFT JOIN ordering.
  const seenIds = new Set<string>();
  const dedupedNearby = nearby.filter((p) => {
    if (seenIds.has(p.id)) return false;
    seenIds.add(p.id);
    return true;
  });

  // Exclude self
  const candidates = dedupedNearby.filter((p) => p.id !== userId);

  if (candidates.length === 0) return [];

  // ----- Step 2: Get already-interacted user IDs -----
  const excludedIds = await getExcludedUserIds(userId);

  const filtered = candidates.filter((p) => !excludedIds.has(p.id));

  if (filtered.length === 0) return [];

  // ----- Step 3: Age filter -----
  const ageFiltered = filtered.filter((p) => {
    if (minAge != null && p.age < minAge) return false;
    if (maxAge != null && p.age > maxAge) return false;
    return true;
  });

  if (ageFiltered.length === 0) return [];

  // ----- Step 4: Fetch user's active modes + their vibe today (mig 039) -----
  const [userModes, userVibe] = await Promise.all([
    getActiveModes(userId),
    getVibeForUser(userId),
  ]);

  // ----- Step 5: Batch-fetch candidate data -----
  const candidateIds = ageFiltered.map((p) => p.id);

  // Fetch all active modes for candidates, karma totals, review averages,
  // founder-badge holders, tonight's vibe, and active ghost penalties
  // in parallel. The ghost set drives the -5 visibility deboost in
  // getSocialScore — this is the visibility cost (mig 045).
  const [
    candidateModesMap,
    karmaMap,
    reviewMap,
    founderSet,
    vibeMap,
    ghostPenaltySet,
  ] = await Promise.all([
    getActiveModesForUsers(candidateIds),
    getKarmaForUsers(candidateIds),
    getReviewAvgForUsers(candidateIds),
    getFounderUserIds(candidateIds),
    getVibesForUsers(candidateIds),
    getActiveGhostPenaltyUserIds(candidateIds),
  ]);

  // ----- Step 6: Score each candidate -----
  const scored: MatchCandidate[] = ageFiltered.map((candidate) => {
    const cModes = candidateModesMap.get(candidate.id) ?? [];
    const cKarma = karmaMap.get(candidate.id) ?? 0;
    const cReview = reviewMap.get(candidate.id) ?? 0;
    const cVibe = vibeMap.get(candidate.id) ?? null;
    const cGhost = ghostPenaltySet.has(candidate.id);

    // Vibe match (mig 039): both users picked the SAME vibe today.
    // Both must be non-null AND equal — null vibes don't trigger the bonus.
    const vibeMatch = userVibe !== null && cVibe !== null && userVibe === cVibe;

    const { score, breakdown, sharedModes } = calculateMatchScore(
      userModes,
      candidate,
      cModes,
      cKarma,
      cReview,
      vibeMatch,
      cGhost,
    );

    return {
      id: candidate.id,
      name: candidate.name,
      age: candidate.age,
      gender: candidate.gender,
      bio: candidate.bio,
      avatar_url: candidate.avatar_url,
      is_verified: candidate.is_verified,
      distance_km: Math.round(candidate.distance_km * 10) / 10, // 1 decimal
      score,
      scoreBreakdown: breakdown,
      sharedModes,
      activeModes: cModes,
      availableTime: candidate.available_time,
      // 2026-04-24 (mig 024 / #5 SEC-001): RPC returns 500m grid-snapped
      // coords. Name them as such on the public API too so consumers know
      // they are NOT precise. Pin placement on /map already expects the
      // rough value (see the "Positions floutées à ~500m" trust banner).
      lat: candidate.lat_rough,
      lng: candidate.lng_rough,
      // 2026-04-26: hybrid invite reward — surface founder badge so
      // SwipeCard can render the chip without re-querying achievements
      // per card.
      is_founder: founderSet.has(candidate.id),
      // 2026-04-27 (mig 030): forward the live broadcast flag.
      broadcast_active: candidate.broadcast_active === true,
      // 2026-04-28 (mig 039): forward today's vibe so SwipeCard can
      // render the small mood chip below the mode badge.
      vibe_today: cVibe,
    };
  });

  // ----- Step 7: Sort by score, return top N -----
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit);
}

// ----------------------------------------
// Data fetching helpers
// ----------------------------------------

/**
 * Returns a Set of user IDs the current user has already interacted with
 * (liked, passed, superliked, blocked, reported).
 * These should be excluded from match results.
 */
async function getExcludedUserIds(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("interactions")
    .select("to_user")
    .eq("from_user", userId);

  if (error || !data) return new Set();

  return new Set(data.map((row: { to_user: string }) => row.to_user));
}

/** Get the active modes for a single user. */
async function getActiveModes(userId: string): Promise<ModeKey[]> {
  const { data, error } = await supabase
    .from("mode_activations")
    .select("mode")
    .eq("user_id", userId)
    .eq("is_active", true)
    .gt("expires_at", new Date().toISOString());

  if (error || !data) return [];

  return data.map((row: { mode: string }) => row.mode as ModeKey);
}

/** Batch-fetch active modes for multiple users. */
async function getActiveModesForUsers(
  userIds: string[],
): Promise<Map<string, ModeKey[]>> {
  const map = new Map<string, ModeKey[]>();
  if (userIds.length === 0) return map;

  const { data, error } = await supabase
    .from("mode_activations")
    .select("user_id, mode")
    .in("user_id", userIds)
    .eq("is_active", true)
    .gt("expires_at", new Date().toISOString());

  if (error || !data) return map;

  for (const row of data as Array<{ user_id: string; mode: string }>) {
    const existing = map.get(row.user_id) ?? [];
    existing.push(row.mode as ModeKey);
    map.set(row.user_id, existing);
  }

  return map;
}

/** Batch-fetch total karma for multiple users. */
async function getKarmaForUsers(
  userIds: string[],
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (userIds.length === 0) return map;

  // Sum all karma transactions per user.
  // Supabase JS doesn't support GROUP BY, so we fetch and aggregate client-side.
  //
  // 2026-04-26 P1 fix: cap the scan to last 90 days + hard limit 5000 rows.
  // The previous unbounded query scaled O(users × full_history) — at ~100
  // candidates with active karma users, the response could exceed 5MB and
  // saturate the Supabase JS client. 90 days covers the realistic decay
  // window for "social proof recency" and stays well under PostgREST's
  // default row caps.
  //
  // TODO(scaling): replace with SQL aggregate via RPC `get_karma_totals(
  //   user_ids uuid[]) returns table(user_id uuid, total int)` OR materialise
  //   a `karma_balance` table updated by trigger. Either eliminates the
  //   client-side aggregation entirely.
  const iso90daysAgo = new Date(
    Date.now() - 90 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data, error } = await supabase
    .from("karma_transactions")
    .select("user_id, amount")
    .in("user_id", userIds)
    .gte("created_at", iso90daysAgo)
    .limit(5000);

  if (error || !data) return map;

  for (const row of data as Array<{ user_id: string; amount: number }>) {
    map.set(row.user_id, (map.get(row.user_id) ?? 0) + row.amount);
  }

  return map;
}

/** Batch-fetch average review rating for multiple users. */
/**
 * Returns the subset of `userIds` who hold the 'founder' achievement
 * badge (i.e. signed up via an invite code, mig 025 hybrid reward).
 * Single SELECT, no joins — much cheaper than per-card queries.
 */
async function getFounderUserIds(userIds: string[]): Promise<Set<string>> {
  const set = new Set<string>();
  if (userIds.length === 0) return set;

  const { data, error } = await supabase
    .from("achievements")
    .select("user_id")
    .eq("achievement_key", "founder")
    .in("user_id", userIds);

  if (error || !data) return set;

  for (const row of data as Array<{ user_id: string }>) {
    set.add(row.user_id);
  }
  return set;
}

/**
 * Returns the subset of `userIds` who currently have an ACTIVE anti-ghost
 * penalty row (mig 045) — i.e. `expires_at > now()`. Active membership
 * triggers the -5 visibility deboost in getSocialScore. RLS only lets a
 * user SEE their own penalties, but the matching pipeline reads through
 * the same Supabase client used for nearby_profiles which itself bypasses
 * RLS via a SECURITY DEFINER function. Here we run a plain SELECT — if
 * RLS is enforced for the calling client we just see an empty set, which
 * is the safe default (no deboost rather than a crash).
 *
 * Single SELECT with the IN-list and an `expires_at > now()` filter.
 * The partial index `idx_ghost_penalties_active` covers this query.
 */
async function getActiveGhostPenaltyUserIds(
  userIds: string[],
): Promise<Set<string>> {
  const set = new Set<string>();
  if (userIds.length === 0) return set;

  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("ghost_penalties")
    .select("user_id")
    .in("user_id", userIds)
    .gt("expires_at", nowIso);

  if (error) {
    // Don't crash the matching pipeline on a deboost-table read failure
    // — the consequence is a missing penalty (slightly more visibility
    // for ghosters), not a wrong match.
    logger.warn("matching_ghost_penalties_query_failed", {
      err: error.message,
    });
    return set;
  }
  if (!data) return set;

  for (const row of data as Array<{ user_id: string }>) {
    set.add(row.user_id);
  }
  return set;
}

/**
 * Fetch the current user's vibe today (mig 039) via the get_vibe_today RPC.
 * Returns null when the user hasn't picked one today (or it's stale).
 */
async function getVibeForUser(userId: string): Promise<VibeId | null> {
  const { data, error } = await supabase.rpc("get_vibe_today", {
    uid: userId,
  });

  if (error) {
    logger.error("matching_get_vibe_for_user_failed", { err: error.message });
    return null;
  }

  return (data as VibeId | null) ?? null;
}

/**
 * Batch-fetch tonight's vibe for every candidate (mig 039).
 *
 * The RPC takes a single uid, so we fan out one call per user and zip
 * the results. Cheap because the RPC is a single-row read of a cached
 * column. If we ever see >50 candidates per scoring pass we can replace
 * this with a SELECT id, vibe_today, vibe_set_at WHERE id IN (...) and
 * apply the UTC-midnight filter client-side — but the RPC keeps the
 * "single source of truth" invariant for now.
 *
 * Errors per user are swallowed → null, so one bad row doesn't blow
 * up the whole pipeline.
 */
async function getVibesForUsers(
  userIds: string[],
): Promise<Map<string, VibeId | null>> {
  const map = new Map<string, VibeId | null>();
  if (userIds.length === 0) return map;

  const results = await Promise.all(
    userIds.map(async (id) => {
      const { data, error } = await supabase.rpc("get_vibe_today", {
        uid: id,
      });
      if (error) return { id, vibe: null as VibeId | null };
      return { id, vibe: (data as VibeId | null) ?? null };
    }),
  );

  for (const { id, vibe } of results) {
    map.set(id, vibe);
  }

  return map;
}

async function getReviewAvgForUsers(
  userIds: string[],
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (userIds.length === 0) return map;

  const { data, error } = await supabase
    .from("reviews")
    .select("reviewed_id, rating")
    .in("reviewed_id", userIds);

  if (error || !data) return map;

  // Aggregate: sum and count per user, then compute average
  const sums = new Map<string, { total: number; count: number }>();

  for (const row of data as Array<{ reviewed_id: string; rating: number }>) {
    const existing = sums.get(row.reviewed_id) ?? { total: 0, count: 0 };
    existing.total += row.rating;
    existing.count += 1;
    sums.set(row.reviewed_id, existing);
  }

  sums.forEach(({ total, count }, id) => {
    map.set(id, total / count);
  });

  return map;
}
