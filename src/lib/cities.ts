/**
 * Cities framework — CeSoir multi-city beachhead layer.
 *
 * Wave 14 pivot (2026-04-23): Paris → Montpellier.
 * Montpellier is the single active beachhead while we validate PMF in a
 * dense Gen Z city (70K students / 300K hab). Paris data is kept behind
 * the `paris` entry for a later expansion but is NOT rendered anywhere.
 *
 * Everything user-facing (map defaults, onboarding, copy, SEO) reads the
 * active city from `ACTIVE_CITY` or the `getActiveCity()` helper below.
 * When expansion day comes we either:
 *   - flip `ACTIVE_CITY` to the new slug
 *   - or introduce a runtime switch (query param, Supabase flag) that
 *     resolves which CityConfig to hand back.
 *
 * NO FALLBACK: callers should assume `getActiveCity()` always returns a
 * valid config (never null). If a new city is added, add its full config
 * here first before shipping.
 */

export type CitySlug = "montpellier" | "paris";

export interface CityConfig {
  /** Canonical slug used as a key in this file and in URLs. */
  slug: CitySlug;
  /** Display name ("Montpellier"). */
  name: string;
  /** Demonym for user-facing copy ("Montpelliérains"). */
  demonym: string;
  /** ISO country code (FR). */
  country: string;
  /** Default map center — where the map lands if geolocation is denied. */
  center: { lat: number; lng: number };
  /** Default zoom for the default center (13 = neighborhood detail). */
  defaultZoom: number;
  /** Seed bounding box used for profile redistribution (migration 017). */
  seedBounds: { minLat: number; maxLat: number; minLng: number; maxLng: number };
  /** SEO keyword fragment used in metadata and share cards. */
  seoKeyword: string;
  /** Hero tagline fragment used by landing ("à Montpellier"). */
  heroTagline: string;
  /** Launched or not (controls feature-gates in future expansion). */
  active: boolean;
}

/**
 * Full city configs. Only `montpellier` is active; Paris lives here as a
 * placeholder for the next expansion wave.
 */
export const CITIES: Record<CitySlug, CityConfig> = {
  montpellier: {
    slug: "montpellier",
    name: "Montpellier",
    demonym: "Montpelliérains",
    country: "FR",
    center: { lat: 43.6082, lng: 3.8794 }, // Place de la Comédie
    defaultZoom: 13,
    // ~5km intra-muros bounding box centred on the Comédie.
    seedBounds: { minLat: 43.59, maxLat: 43.63, minLng: 3.85, maxLng: 3.92 },
    seoKeyword: "Montpellier",
    heroTagline: "à Montpellier",
    active: true,
  },
  paris: {
    slug: "paris",
    name: "Paris",
    demonym: "Parisiens",
    country: "FR",
    center: { lat: 48.8566, lng: 2.3522 },
    defaultZoom: 13,
    seedBounds: { minLat: 48.82, maxLat: 48.89, minLng: 2.27, maxLng: 2.41 },
    seoKeyword: "Paris",
    heroTagline: "à Paris",
    active: false,
  },
};

/**
 * The single active city. Callers should prefer `getActiveCity()` over
 * reading this constant directly so that a future runtime-switch (e.g.
 * query param, Supabase flag) can slot in without touching every file.
 */
export const ACTIVE_CITY: CitySlug = "montpellier";

/**
 * Returns the fully-expanded CityConfig for the currently active city.
 * Never returns null — will throw a very loud dev error if the active
 * slug has no config (misconfiguration bug).
 */
export function getActiveCity(): CityConfig {
  const cfg = CITIES[ACTIVE_CITY];
  if (!cfg) {
    // Misconfiguration guard — should be unreachable in production.
    throw new Error(`[cities] No config for ACTIVE_CITY="${ACTIVE_CITY}"`);
  }
  return cfg;
}

/** Shorthand for the default map center of the active city. */
export function getActiveCityCenter(): { lat: number; lng: number } {
  return getActiveCity().center;
}
