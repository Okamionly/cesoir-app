import { ModeKey } from "./modes";
import type { VibeId } from "./vibes";

/**
 * Canonical `Profile` shape used by the swipe/discovery/map surfaces.
 *
 * Historically this module also exported a `MOCK_PROFILES` demo array, which
 * has been removed as part of the 2026-04-20 mock-data cleanup. Real profiles
 * are fetched via `useProfiles` (Supabase `nearby_profiles` RPC). The type
 * itself is kept here for backwards-compatible imports across ~10 call sites
 * (components, hooks, pages).
 */
export interface Profile {
  id: string;
  name: string;
  age: number;
  mode: ModeKey;
  bio: string;
  distance: number;
  time: string;
  color: string;
  photo: string;
  photos?: string[];
  /** Hybrid invite reward badge — set on the SwipeCard if the user signed
   *  up via an invitation code (mig 025 / achievement_key='founder'). */
  is_founder?: boolean;
  /** True while this profile has tapped "Je suis dispo ce soir" and the
   *  broadcast is still live (mig 030). Drives the green pulse ring and
   *  the "Dispo maintenant" pill on the swipe deck + map pins. */
  broadcast_active?: boolean;
  /** Tonight's vibe (mig 039) — when set, surfaces as a small chip below
   *  the mode badge on the swipe card. NULL when not picked or stale
   *  (older than UTC midnight — see get_vibe_today RPC). */
  vibe_today?: VibeId | null;
  /** True while this profile's travel passport window is active (Wave 17,
   *  mig 040). Drives the "Passport" chip on the SwipeCard mode badge row. */
  passport_active?: boolean;
  /** Display name of the passport target city ("Lyon", "Paris"). Only set
   *  while `passport_active === true`. */
  passport_city?: string | null;
  /** Wave 17 (mig 046) — top mastery mode key for this profile. Set by
   *  the data layer alongside `top_mastery_tier` only when the profile
   *  has reached at least one tier in that mode. SwipeCard surfaces the
   *  chip exclusively when `top_mastery_tier === 'maitre'` (per spec). */
  top_mastery_mode?: ModeKey | null;
  /** Wave 17 (mig 046) — top mastery tier for this profile. Possible
   *  values: "apprenti" | "initie" | "maitre" | null. Only "maitre" is
   *  surfaced on the swipe deck. */
  top_mastery_tier?: "apprenti" | "initie" | "maitre" | null;
  // Mode-specific
  cuisine?: string;
  event?: string;
  eventType?: string;
  from?: string;
  badge?: string;
  langs?: string[];
  safe?: boolean;
  since?: string;
  neighborhood?: string;
  ambassador?: boolean;
  speaks?: string[];
  learns?: string;
  level?: string;
  dog?: string;
  breed?: string;
  dogAge?: string;
}
