/**
 * genderRatio.ts
 *
 * Server-side utility to compute the H/F ratio of newly registered users
 * over the past 7 days. Used by:
 *   - GET /api/admin/gender-ratio (dashboard monitoring)
 *   - POST /api/invites/claim (throttle to maintain ≤60% male target)
 *
 * Design:
 *   - Queries `profiles` table filtered by created_at >= now() - 7d.
 *   - Only "male" / "female" are counted for the binary ratio; other values
 *     (non-binary, etc.) are tallied in `other` but excluded from the ratio
 *     threshold check to avoid penalising non-binary users.
 *   - Uses the service-role client to bypass RLS (count query, no PII read).
 *
 * IMPORTANT: must only be called server-side (API routes, Server Components).
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export interface GenderRatioResult {
  /** Count of profiles with gender = 'male' registered in the last 7 days */
  male: number;
  /** Count of profiles with gender = 'female' registered in the last 7 days */
  female: number;
  /** Count of profiles with gender not in {male, female} */
  other: number;
  /** Percentage of male profiles among (male + female) — 0 if no profiles */
  ratio_male_pct: number;
  /** Total profiles counted (male + female + other) */
  total: number;
  /** ISO string of the window start (now() - 7 days) */
  window_start: string;
}

/**
 * Compute the H/F ratio for signups over the last 7 days.
 *
 * Throws if the service-role key is missing — never call client-side.
 */
export async function getCurrentRatio(): Promise<GenderRatioResult> {
  if (!SERVICE_ROLE_KEY) {
    throw new Error(
      "getCurrentRatio: SUPABASE_SERVICE_ROLE_KEY is required but missing",
    );
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const windowStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const windowStartISO = windowStart.toISOString();

  // Fetch gender column for profiles created in the last 7 days.
  // We intentionally do NOT fetch name/id/avatar — only gender counts.
  const { data, error } = await admin
    .from("profiles")
    .select("gender")
    .gte("created_at", windowStartISO);

  if (error) {
    throw new Error(`getCurrentRatio: query failed — ${error.message}`);
  }

  const rows = data ?? [];
  let male = 0;
  let female = 0;
  let other = 0;

  for (const row of rows) {
    const g = (row.gender ?? "").toLowerCase();
    if (g === "male" || g === "homme" || g === "m") {
      male++;
    } else if (g === "female" || g === "femme" || g === "f") {
      female++;
    } else {
      other++;
    }
  }

  const binaryTotal = male + female;
  const ratio_male_pct = binaryTotal === 0 ? 0 : Math.round((male / binaryTotal) * 100);

  return {
    male,
    female,
    other,
    ratio_male_pct,
    total: rows.length,
    window_start: windowStartISO,
  };
}

/**
 * Returns true if a new male signup should be blocked.
 *
 * Threshold: refuse male signups when ratio_male_pct > 60.
 * Female, non-binary, and unknown genders always pass.
 *
 * @param gender  - the gender string from the signup form
 */
export async function isMaleThrottled(gender: string): Promise<boolean> {
  const g = (gender ?? "").toLowerCase();
  const isMale = g === "male" || g === "homme" || g === "m";
  if (!isMale) return false;

  const ratio = await getCurrentRatio();
  return ratio.ratio_male_pct > 60;
}
