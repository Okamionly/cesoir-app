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
//   Social proof:        15 pts  — karma, reviews, verification
//
// The algorithm is designed for URGENCY: tonight, nearby, same vibe.

import { supabase } from "@/lib/supabase";
import type { ModeKey } from "@/lib/modes";

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
 * @returns Score 0-100 and its breakdown
 */
export function calculateMatchScore(
  userModes: ModeKey[],
  candidate: NearbyProfileRow,
  candidateModes: ModeKey[],
  candidateKarma: number,
  candidateReviewAvg: number,
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
 * Social proof scoring:
 *   Verified badge:         +5 pts
 *   Karma (0-100 scale):    0-5 pts
 *   Review average (1-5):   0-5 pts
 */
function getSocialScore(
  isVerified: boolean,
  karma: number,
  reviewAvg: number,
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

  return Math.min(15, score);
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

  // Exclude self
  const candidates = nearby.filter((p) => p.id !== userId);

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

  // ----- Step 4: Fetch user's active modes -----
  const userModes = await getActiveModes(userId);

  // ----- Step 5: Batch-fetch candidate data -----
  const candidateIds = ageFiltered.map((p) => p.id);

  // Fetch all active modes for candidates, karma totals, review averages,
  // and founder-badge holders in parallel.
  const [candidateModesMap, karmaMap, reviewMap, founderSet] = await Promise.all([
    getActiveModesForUsers(candidateIds),
    getKarmaForUsers(candidateIds),
    getReviewAvgForUsers(candidateIds),
    getFounderUserIds(candidateIds),
  ]);

  // ----- Step 6: Score each candidate -----
  const scored: MatchCandidate[] = ageFiltered.map((candidate) => {
    const cModes = candidateModesMap.get(candidate.id) ?? [];
    const cKarma = karmaMap.get(candidate.id) ?? 0;
    const cReview = reviewMap.get(candidate.id) ?? 0;

    const { score, breakdown, sharedModes } = calculateMatchScore(
      userModes,
      candidate,
      cModes,
      cKarma,
      cReview,
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
  // Supabase JS doesn't support GROUP BY, so we fetch all and aggregate client-side.
  // For large scale, this should be a DB view or RPC — fine for MVP.
  const { data, error } = await supabase
    .from("karma_transactions")
    .select("user_id, amount")
    .in("user_id", userIds);

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
