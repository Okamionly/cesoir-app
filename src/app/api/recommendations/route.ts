import { findMatches } from "@/lib/matching";
import type { ModeKey } from "@/lib/modes";
import type { RecommendationsResponse } from "@/types/matching";
import { requireUser, AuthError } from "@/lib/api/auth";
import { apiError, apiRaw } from "@/lib/api/response";

/** Whitelisted gender filter values (B1 — validate inputs at API boundary). */
const GENDER_FILTERS = new Set(["men", "women", "all", "nonbinary"]);

export async function GET(request: Request) {
  let ctx;
  try {
    ctx = await requireUser(request);
  } catch (err) {
    if (err instanceof AuthError) {
      return apiError(err.message, err.status, { code: err.code });
    }
    throw err;
  }
  const { user } = ctx;

  const { searchParams } = new URL(request.url);

  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lng = parseFloat(searchParams.get("lng") ?? "");

  if (isNaN(lat) || isNaN(lng)) {
    return apiError("Parametres lat et lng requis", 400, {
      code: "missing_latlng",
    });
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return apiError("lat/lng hors plage", 400, { code: "invalid_latlng" });
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

  const rawGender = searchParams.get("genderFilter");
  let genderFilter: string | null = null;
  if (rawGender !== null) {
    if (!GENDER_FILTERS.has(rawGender)) {
      return apiError("genderFilter invalide", 400, {
        code: "invalid_gender_filter",
      });
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
    return apiRaw(body);
  } catch (err) {
    console.error("[/api/recommendations]", err);
    return apiError("Erreur serveur", 500, { code: "internal_error" });
  }
}
