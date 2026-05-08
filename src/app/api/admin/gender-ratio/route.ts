/**
 * GET /api/admin/gender-ratio
 *
 * Returns the H/F ratio of signups over the last 7 days.
 * Gated by the ADMIN_API_SECRET env var (Bearer token).
 * Can also be called with the Supabase service-role key as the Bearer token.
 *
 * Response:
 *   200 { male, female, other, ratio_male_pct, total, window_start, throttle_active }
 *   401 if no / wrong token
 *   500 if DB query fails
 */

import { NextResponse } from "next/server";
import { getCurrentRatio } from "@/lib/analytics/genderRatio";

const ADMIN_SECRET = process.env.ADMIN_API_SECRET ?? "";
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get("authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return false;
  const token = authHeader.slice(7).trim();
  if (!token) return false;

  // Accept the dedicated admin secret (preferred) or the service-role key
  // (usable by automated tooling that already holds the key).
  if (ADMIN_SECRET && token === ADMIN_SECRET) return true;
  if (SERVICE_ROLE && token === SERVICE_ROLE) return true;
  return false;
}

export async function GET(request: Request): Promise<NextResponse> {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const ratio = await getCurrentRatio();
    return NextResponse.json({
      ...ratio,
      // Convenience flag: true when new male signups are being throttled
      throttle_active: ratio.ratio_male_pct > 60,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
