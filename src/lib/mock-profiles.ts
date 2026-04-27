import { ModeKey } from "./modes";

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
