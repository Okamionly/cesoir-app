import { findMatches } from "@/lib/matching";
import type { ModeKey } from "@/lib/modes";
import type { RecommendationsResponse } from "@/types/matching";
import { requireUser, AuthError } from "@/lib/api/auth";
import { apiError, apiRaw } from "@/lib/api/response";
import { recommendationsQuerySchema } from "@/lib/validation";
import { logger } from "@/lib/logger";

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
  const rawQuery = Object.fromEntries(searchParams.entries());

  const parsed = recommendationsQuerySchema.safeParse(rawQuery);
  if (!parsed.success) {
    logger.warn("api_recommendations_validation_failed", { fields: parsed.error.flatten().fieldErrors });
    return apiError("Parametres invalides", 400, {
      code: "validation_failed",
      details: { issues: parsed.error.flatten() },
    });
  }

  const { lat, lng, mode: rawMode, maxDistance, minAge, maxAge, limit, genderFilter } =
    parsed.data;

  const mode: ModeKey | null = rawMode ? (rawMode as ModeKey) : null;
  const effMaxDistance = Math.min(maxDistance ?? 10, 50);
  const effLimit = Math.min(limit ?? 10, 50);
  const effGender: string | null =
    genderFilter && genderFilter !== "all" ? genderFilter : null;

  try {
    const candidates = await findMatches(user.id, lat, lng, {
      mode,
      maxDistance: effMaxDistance,
      minAge,
      maxAge,
      limit: effLimit,
      genderFilter: effGender,
    });

    const body: RecommendationsResponse = { candidates };
    return apiRaw(body);
  } catch (err) {
    logger.error("api_recommendations_failed", { err: String(err) });
    return apiError("Erreur serveur", 500, { code: "internal_error" });
  }
}
