import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { findMatches } from "@/lib/matching";
import type { ModeKey } from "@/lib/modes";
import type { RecommendationsResponse } from "@/types/matching";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Whitelisted gender filter values (B1 — validate inputs at API boundary). */
const GENDER_FILTERS = new Set(["men", "women", "all", "nonbinary"]);

export async function GET(request: Request) {
  // --- Auth verification ---
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }
  const token = authHeader.slice(7);

  const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const {
    data: { user },
    error: authError,
  } = await db.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Session invalide" }, { status: 401 });
  }

  // --- Query params ---
  const { searchParams } = new URL(request.url);

  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lng = parseFloat(searchParams.get("lng") ?? "");

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json(
      { error: "Parametres lat et lng requis" },
      { status: 400 },
    );
  }

  // Sanity check ranges so a malformed client cannot push wild values into
  // the SQL function (defence in depth — RLS already filters to authed user).
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return NextResponse.json(
      { error: "lat/lng hors plage" },
      { status: 400 },
    );
  }

  const rawMode = searchParams.get("mode");
  const mode: ModeKey | null = rawMode ? (rawMode as ModeKey) : null;
  const maxDistance = Math.min(
    parseFloat(searchParams.get("maxDistance") ?? "10") || 10,
    50,
  );
  const minAge = parseInt(searchParams.get("minAge") ?? "") || undefined;
  const maxAge = parseInt(searchParams.get("maxAge") ?? "") || undefined;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "10") || 10, 50);

  // B1 — validate against whitelist; reject unknown values rather than
  // silently passing them to findMatches.
  const rawGender = searchParams.get("genderFilter");
  let genderFilter: string | null = null;
  if (rawGender !== null) {
    if (!GENDER_FILTERS.has(rawGender)) {
      return NextResponse.json(
        { error: "genderFilter invalide" },
        { status: 400 },
      );
    }
    genderFilter = rawGender === "all" ? null : rawGender;
  }

  try {
    const candidates = await findMatches(user.id, lat, lng, {
      mode,
      maxDistance,
      minAge,
      maxAge,
      limit,
      genderFilter,
    });

    const body: RecommendationsResponse = { candidates };
    return NextResponse.json(body);
  } catch (err) {
    console.error("[/api/recommendations]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
