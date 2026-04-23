import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

/**
 * POST /api/venues/events — create a new event on behalf of a venue owner.
 *
 * Wave 15 CRO 10/10 (2026-04-23). Security:
 *   1. User must be authenticated (Bearer token).
 *   2. User's email must appear in NEXT_PUBLIC_VENUE_OWNERS (comma list).
 *   3. The actual INSERT runs with service_role to bypass the `events`
 *      RLS (which is service-only at launch — see migration 019).
 *
 * The request body must be a partial DbEvent without geography (we stub
 * `venue_location` to the Montpellier city centroid — v2 will geocode).
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const VENUE_OWNERS = new Set(
  (process.env.NEXT_PUBLIC_VENUE_OWNERS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
);

// Montpellier city hall — a reasonable default centroid when we don't have
// a geocoded address. v2: plug in an actual geocoder (Mapbox or Nominatim).
const MONTPELLIER_CENTER = { lat: 43.6108, lng: 3.8767 };

interface CreateEventBody {
  slug?: string;
  title?: string;
  description?: string | null;
  flyer_url?: string | null;
  venue_name?: string;
  venue_address?: string | null;
  starts_at?: string;
  ends_at?: string | null;
  categories?: string[];
  lineup?: string[];
  door_price_eur?: number | null;
  ticket_url?: string | null;
  city_slug?: string;
  source?: "manual_curated" | "partner" | "api";
}

export async function POST(request: Request) {
  // 1. Auth
  const authHeader = request.headers.get("authorization");
  let token: string | null = null;
  let user: { id: string; email?: string } | null = null;

  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  }

  // Fallback: if no Bearer, use cookie-based SSR client (same-origin browser fetch).
  if (token) {
    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data, error } = await authClient.auth.getUser();
    if (error || !data.user) {
      return NextResponse.json({ error: "Session invalide" }, { status: 401 });
    }
    user = { id: data.user.id, email: data.user.email ?? undefined };
  } else {
    // Try cookie-based auth.
    const { createClient: createServerCookieClient } = await import("@/lib/supabase/server");
    const cookieClient = await createServerCookieClient();
    const { data, error } = await cookieClient.auth.getUser();
    if (error || !data.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    user = { id: data.user.id, email: data.user.email ?? undefined };
  }

  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  // 2. Whitelist
  const email = user.email?.toLowerCase() ?? "";
  if (!email || !VENUE_OWNERS.has(email)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  // 3. Parse
  let body: CreateEventBody;
  try {
    body = (await request.json()) as CreateEventBody;
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  if (!body.title || !body.venue_name || !body.starts_at) {
    return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
  }

  // 4. Service-role insert (bypasses the events RLS)
  if (!SUPABASE_SERVICE_ROLE) {
    logger.error("api_venues_events_missing_service_role");
    return NextResponse.json(
      { error: "Configuration serveur incomplète" },
      { status: 500 },
    );
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

  const slug =
    body.slug ??
    `${body.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}-${Date.now().toString(36)}`;

  // PostGIS expects WKT when inserting via PostgREST. The geography type
  // accepts the SRID-tagged EWKT format below.
  const venueLocation = `SRID=4326;POINT(${MONTPELLIER_CENTER.lng} ${MONTPELLIER_CENTER.lat})`;

  const { data, error } = await admin
    .from("events")
    .insert({
      slug,
      title: body.title,
      description: body.description ?? null,
      flyer_url: body.flyer_url ?? null,
      venue_name: body.venue_name,
      venue_address: body.venue_address ?? null,
      venue_location: venueLocation,
      city_slug: body.city_slug ?? "montpellier",
      starts_at: body.starts_at,
      ends_at: body.ends_at ?? null,
      door_price_eur: body.door_price_eur ?? null,
      ticket_url: body.ticket_url ?? null,
      categories: body.categories ?? [],
      lineup: body.lineup ?? [],
      source: body.source ?? "partner",
      featured: false,
      is_cancelled: false,
    })
    .select()
    .single();

  if (error) {
    logger.error("api_venues_events_insert_failed", { err: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ event: data });
}
