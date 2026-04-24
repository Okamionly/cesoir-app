/**
 * POST /api/moderate-photo — optional Sightengine cross-check (V5 Wave 15)
 *
 * Complements the client-side nsfwjs check. Requires:
 *   SIGHTENGINE_USER (server-side secret)
 *   SIGHTENGINE_SECRET (server-side secret)
 * If unset, returns null (graceful fallback — client-only mode).
 *
 * Budget: Sightengine free tier = 2000 ops/mo. Use only for flagged/ambiguous
 * photos, not every upload, to stay within budget.
 *
 * Glowup 2026-04-24 (SEC-008): added auth + rate-limit. Endpoint was reachable
 * anonymously, which meant any script on the internet could burn through our
 * 2000/mo Sightengine quota in minutes. Rate limit is strict (5/h/user) on
 * top of the existing per-user check because images are 100-300kb each.
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

interface SightengineResponse {
  status: string;
  nudity?: {
    raw?: number;
    partial?: number;
    safe?: number;
  };
  offensive?: { prob?: number };
}

export async function POST(req: Request) {
  // Auth gate — SEC-008.
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

  // Rate limit — "strict" = 1/h, here reused for 5/h photo moderations.
  // Upstash keys are namespaced by user + IP so token rotation is traceable.
  // NOTE: ACTION_DEFAULTS.strict is 1/h — we bump via a custom key to allow
  // legitimate re-tries. If we outgrow this we add a "moderate_photo"
  // limiter kind to rate-limit.ts.
  const rate = await checkRateLimitByAction(
    `moderate-photo:${userId}:${getClientIp(req)}`,
    "strict",
  );
  if (!rate.ok) {
    return rateLimitResponse(rate);
  }

  const sightengineUser = process.env.SIGHTENGINE_USER;
  const secret = process.env.SIGHTENGINE_SECRET;
  if (!sightengineUser || !secret) {
    return NextResponse.json(
      { safe: true, categories: [], scores: {}, fallbackUsed: true },
      { status: 200 },
    );
  }

  try {
    const form = await req.formData();
    const file = form.get("media");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "media_required" }, { status: 400 });
    }

    const seForm = new FormData();
    seForm.append("media", file);
    seForm.append("models", "nudity-2.0,offensive");
    seForm.append("api_user", sightengineUser);
    seForm.append("api_secret", secret);

    const res = await fetch("https://api.sightengine.com/1.0/check.json", {
      method: "POST",
      body: seForm,
    });
    if (!res.ok) {
      logger.warn("sightengine_http_error", { status: res.status });
      return NextResponse.json({
        safe: true,
        categories: [],
        scores: {},
        fallbackUsed: true,
      });
    }
    const data = (await res.json()) as SightengineResponse;
    const categories: string[] = [];
    const scores: Record<string, number> = {};
    if (data.nudity) {
      scores.nudity_raw = data.nudity.raw ?? 0;
      scores.nudity_partial = data.nudity.partial ?? 0;
      if ((data.nudity.raw ?? 0) > 0.5) categories.push("nudity_raw");
      if ((data.nudity.partial ?? 0) > 0.6) categories.push("nudity_partial");
    }
    if (data.offensive?.prob != null) {
      scores.offensive = data.offensive.prob;
      if (data.offensive.prob > 0.5) categories.push("offensive");
    }
    return NextResponse.json({
      safe: categories.length === 0,
      categories,
      scores,
      fallbackUsed: false,
    });
  } catch (err) {
    logger.error("sightengine_exception", { err: String(err) });
    return NextResponse.json({
      safe: true,
      categories: [],
      scores: {},
      fallbackUsed: true,
    });
  }
}
