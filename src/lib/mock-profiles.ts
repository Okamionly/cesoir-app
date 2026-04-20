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
