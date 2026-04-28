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

// ─────────────────────────────────────────────────────────────────────────
// Wave 17 — Travel passport destinations.
//
// `CITIES` (above) is the beachhead-launch surface (one slug active at a
// time). For the `travel passport` feature we need a much wider set — any
// city the user might visit. Kept as a flat searchable list (autocomplete
// in `PassportEditor.tsx`) so we don't have to touch the typed `CITIES`
// surface. Coordinates are city centres (Wikipedia precise enough; the
// passport RPC grid-snaps to 500m so 3-decimal precision is plenty).
//
// Selection rationale: top 30 EU + key world hubs that someone in
// Montpellier might travel to in the next 30 days. Order matches likely
// search frequency (Paris > Lyon > Barcelona > London > NYC).
// ─────────────────────────────────────────────────────────────────────────

export interface PassportCity {
  /** Display name as typed by the user ("Paris"). */
  name: string;
  /** Country code (ISO-3166-1 alpha-2) — used in the result list. */
  country: string;
  /** Center coordinates. */
  lat: number;
  lng: number;
}

export const PASSPORT_CITIES: ReadonlyArray<PassportCity> = [
  // France — most likely targets first
  { name: "Paris", country: "FR", lat: 48.8566, lng: 2.3522 },
  { name: "Lyon", country: "FR", lat: 45.7640, lng: 4.8357 },
  { name: "Marseille", country: "FR", lat: 43.2965, lng: 5.3698 },
  { name: "Toulouse", country: "FR", lat: 43.6047, lng: 1.4442 },
  { name: "Nice", country: "FR", lat: 43.7102, lng: 7.2620 },
  { name: "Bordeaux", country: "FR", lat: 44.8378, lng: -0.5792 },
  { name: "Lille", country: "FR", lat: 50.6292, lng: 3.0573 },
  { name: "Nantes", country: "FR", lat: 47.2184, lng: -1.5536 },
  { name: "Strasbourg", country: "FR", lat: 48.5734, lng: 7.7521 },
  { name: "Montpellier", country: "FR", lat: 43.6082, lng: 3.8794 },
  { name: "Rennes", country: "FR", lat: 48.1173, lng: -1.6778 },
  { name: "Grenoble", country: "FR", lat: 45.1885, lng: 5.7245 },
  { name: "Toulon", country: "FR", lat: 43.1242, lng: 5.9280 },
  { name: "Aix-en-Provence", country: "FR", lat: 43.5297, lng: 5.4474 },
  { name: "Cannes", country: "FR", lat: 43.5528, lng: 7.0174 },
  { name: "Biarritz", country: "FR", lat: 43.4832, lng: -1.5586 },
  // Europe — common short-haul
  { name: "Barcelone", country: "ES", lat: 41.3851, lng: 2.1734 },
  { name: "Madrid", country: "ES", lat: 40.4168, lng: -3.7038 },
  { name: "Séville", country: "ES", lat: 37.3891, lng: -5.9845 },
  { name: "Valence", country: "ES", lat: 39.4699, lng: -0.3763 },
  { name: "Lisbonne", country: "PT", lat: 38.7223, lng: -9.1393 },
  { name: "Porto", country: "PT", lat: 41.1579, lng: -8.6291 },
  { name: "Rome", country: "IT", lat: 41.9028, lng: 12.4964 },
  { name: "Milan", country: "IT", lat: 45.4642, lng: 9.1900 },
  { name: "Florence", country: "IT", lat: 43.7696, lng: 11.2558 },
  { name: "Venise", country: "IT", lat: 45.4408, lng: 12.3155 },
  { name: "Naples", country: "IT", lat: 40.8518, lng: 14.2681 },
  { name: "Londres", country: "GB", lat: 51.5074, lng: -0.1278 },
  { name: "Édimbourg", country: "GB", lat: 55.9533, lng: -3.1883 },
  { name: "Dublin", country: "IE", lat: 53.3498, lng: -6.2603 },
  { name: "Berlin", country: "DE", lat: 52.5200, lng: 13.4050 },
  { name: "Munich", country: "DE", lat: 48.1351, lng: 11.5820 },
  { name: "Hambourg", country: "DE", lat: 53.5511, lng: 9.9937 },
  { name: "Amsterdam", country: "NL", lat: 52.3676, lng: 4.9041 },
  { name: "Bruxelles", country: "BE", lat: 50.8503, lng: 4.3517 },
  { name: "Vienne", country: "AT", lat: 48.2082, lng: 16.3738 },
  { name: "Prague", country: "CZ", lat: 50.0755, lng: 14.4378 },
  { name: "Budapest", country: "HU", lat: 47.4979, lng: 19.0402 },
  { name: "Copenhague", country: "DK", lat: 55.6761, lng: 12.5683 },
  { name: "Stockholm", country: "SE", lat: 59.3293, lng: 18.0686 },
  { name: "Oslo", country: "NO", lat: 59.9139, lng: 10.7522 },
  { name: "Athènes", country: "GR", lat: 37.9838, lng: 23.7275 },
  { name: "Genève", country: "CH", lat: 46.2044, lng: 6.1432 },
  { name: "Zurich", country: "CH", lat: 47.3769, lng: 8.5417 },
  // World hubs
  { name: "New York", country: "US", lat: 40.7128, lng: -74.0060 },
  { name: "Los Angeles", country: "US", lat: 34.0522, lng: -118.2437 },
  { name: "Miami", country: "US", lat: 25.7617, lng: -80.1918 },
  { name: "Montréal", country: "CA", lat: 45.5017, lng: -73.5673 },
  { name: "Tokyo", country: "JP", lat: 35.6762, lng: 139.6503 },
  { name: "Dubai", country: "AE", lat: 25.2048, lng: 55.2708 },
  { name: "Marrakech", country: "MA", lat: 31.6295, lng: -7.9811 },
  { name: "Casablanca", country: "MA", lat: 33.5731, lng: -7.5898 },
  { name: "Tunis", country: "TN", lat: 36.8065, lng: 10.1815 },
  { name: "Istanbul", country: "TR", lat: 41.0082, lng: 28.9784 },
];

/**
 * Search the passport city list with a forgiving prefix match.
 * Returns at most `limit` matches, ranked by:
 *   1. Exact prefix match (case + diacritic insensitive)
 *   2. Substring match anywhere in the name
 *
 * Keeps the search synchronous + tiny — no debounce / network needed for
 * a list of ~50 entries.
 */
export function searchPassportCities(query: string, limit = 8): PassportCity[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  // Strip diacritics ("seville" should match "Séville").
  const normalize = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
  const nq = normalize(q);

  const prefixHits: PassportCity[] = [];
  const containsHits: PassportCity[] = [];
  for (const c of PASSPORT_CITIES) {
    const nn = normalize(c.name);
    if (nn.startsWith(nq)) prefixHits.push(c);
    else if (nn.includes(nq)) containsHits.push(c);
  }
  return [...prefixHits, ...containsHits].slice(0, limit);
}
