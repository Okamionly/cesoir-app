import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { findMatches } from "@/lib/matching";
import type { ModeKey } from "@/lib/modes";
import type { RecommendationsResponse } from "@/types/matching";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://ycyxmvzilzkusecpgvbi.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

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

  const rawMode = searchParams.get("mode");
  const mode: ModeKey | null = rawMode ? (rawMode as ModeKey) : null;
  const maxDistance = Math.min(parseFloat(searchParams.get("maxDistance") ?? "10") || 10, 50);
  const minAge = parseInt(searchParams.get("minAge") ?? "") || undefined;
  const maxAge = parseInt(searchParams.get("maxAge") ?? "") || undefined;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "10") || 10, 50);
  const genderFilter = searchParams.get("genderFilter") ?? null;

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
