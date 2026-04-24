/**
 * POST /api/moderate-message — server-side message moderation (V5 Wave 15)
 *
 * Calls OpenAI's `omni-moderation-latest` to classify message text.
 * Falls back to { flagged: false } when OPENAI_API_KEY is not set, so the
 * client-side keyword screening (messageScreening.ts) remains the source of
 * truth in that case.
 *
 * Budget: OpenAI Moderation API is FREE for production use (per openai.com).
 * Note: Glowup 2026-04-24 — even though the upstream is free, we still require
 * auth + rate-limit to defend against DoS and to prevent anonymous traffic
 * from triggering OpenAI abuse flags against our account. Flagged by SEC-008.
 *
 * Response body:
 *   { flagged: boolean, categories: string[], scores: Record<string, number> }
 */

import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { AuthError, requireUser } from "@/lib/api/auth";
import {
  checkRateLimitByAction,
  getClientIp,
  rateLimitResponse,
} from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface OpenAIModerationCategory {
  [key: string]: boolean;
}
interface OpenAIModerationScores {
  [key: string]: number;
}
interface OpenAIModerationResult {
  flagged: boolean;
  categories: OpenAIModerationCategory;
  category_scores: OpenAIModerationScores;
}
interface OpenAIModerationResponse {
  id: string;
  model: string;
  results: OpenAIModerationResult[];
}

function flaggedCategoryNames(res: OpenAIModerationResult): string[] {
  return Object.entries(res.categories)
    .filter(([, v]) => v === true)
    .map(([k]) => k);
}

export async function POST(req: Request) {
  // Auth gate — SEC-008. Endpoint had no auth before 2026-04-24 and was
  // reachable by anyone. Now rejects anonymous traffic before touching
  // OpenAI to avoid burning quota / triggering abuse flags.
  let userId: string;
  try {
    const ctx = await requireUser(req);
    userId = ctx.user.id;
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json(
        { error: err.code, message: err.message },
        { status: err.status },
      );
    }
    throw err;
  }

  // Rate limit — 60 calls / min / user. Shares the "api" budget with
  // other mutating endpoints. IP is kept in the key so a compromised
  // token can't be amplified across hosts.
  const rate = await checkRateLimitByAction(
    `moderate-msg:${userId}:${getClientIp(req)}`,
    "api",
  );
  if (!rate.ok) {
    return rateLimitResponse(rate);
  }

  let text: string;
  try {
    const body = (await req.json()) as { text?: unknown };
    if (typeof body.text !== "string") {
      return NextResponse.json({ error: "text_required" }, { status: 400 });
    }
    text = body.text.slice(0, 4000); // cap input
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    // Graceful fallback — client-side keyword screen will still apply
    return NextResponse.json({
      flagged: false,
      categories: [],
      scores: {},
      fallbackUsed: true,
    });
  }

  try {
    const res = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ model: "omni-moderation-latest", input: text }),
    });
    if (!res.ok) {
      logger.warn("openai_mod_http_error", { status: res.status });
      return NextResponse.json({
        flagged: false,
        categories: [],
        scores: {},
        fallbackUsed: true,
      });
    }
    const data = (await res.json()) as OpenAIModerationResponse;
    const first = data.results[0];
    if (!first) {
      return NextResponse.json({
        flagged: false,
        categories: [],
        scores: {},
        fallbackUsed: true,
      });
    }
    return NextResponse.json({
      flagged: first.flagged,
      categories: flaggedCategoryNames(first),
      scores: first.category_scores,
      fallbackUsed: false,
    });
  } catch (err) {
    logger.error("openai_mod_exception", { err: String(err) });
    return NextResponse.json({
      flagged: false,
      categories: [],
      scores: {},
      fallbackUsed: true,
    });
  }
}
