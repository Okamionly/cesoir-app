/**
 * CeSoir NSFW photo moderation (V5 Wave 15)
 * Client-side NSFW detection via nsfwjs (MobileNet).
 * Falls back to "safe" if dependencies are missing (graceful degradation).
 *
 * Budget: 0€ (runs in browser). Optional server-side cross-check via Sightengine.
 */

import { logger } from "@/lib/logger";

export interface NsfwResult {
  safe: boolean;
  categories: string[];
  scores: Record<string, number>;
  /** When the library is missing or fails — we allow upload but flag for review. */
  fallbackUsed: boolean;
}

// Categories we block outright
const BLOCKED_CATEGORIES = new Set(["Porn", "Hentai"]);
const BLOCK_THRESHOLD = 0.7;
const SEXY_THRESHOLD = 0.85; // "Sexy" tolerated unless very high

// Lazy-loaded model (singleton)
let modelPromise: Promise<unknown> | null = null;

async function loadModel(): Promise<unknown> {
  if (modelPromise) return modelPromise;
  modelPromise = (async () => {
    try {
      // Dynamic imports — allow app to run even if deps aren't installed yet
      const nsfwjs = await import("nsfwjs").catch(() => null);
      if (!nsfwjs) {
        logger.warn("nsfw_lib_missing");
        return null;
      }
      // @tensorflow/tfjs is a peer dep of nsfwjs; loaded automatically
      await import("@tensorflow/tfjs").catch(() => null);
      return await nsfwjs.load();
    } catch (err) {
      logger.error("nsfw_model_load_failed", { err: String(err) });
      return null;
    }
  })();
  return modelPromise;
}

async function fileToImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image_load_failed"));
    img.src = URL.createObjectURL(file);
  });
}

/** Check a photo for NSFW content. Safe fallback if deps missing. */
export async function checkPhoto(file: File): Promise<NsfwResult> {
  try {
    const model = await loadModel();
    if (!model) {
      return { safe: true, categories: [], scores: {}, fallbackUsed: true };
    }
    const img = await fileToImage(file);
    // @ts-expect-error — nsfwjs types are loose when dynamically imported
    const predictions: Array<{ className: string; probability: number }> = await model.classify(img);

    const scores: Record<string, number> = {};
    const flagged: string[] = [];
    for (const p of predictions) {
      scores[p.className] = p.probability;
      if (BLOCKED_CATEGORIES.has(p.className) && p.probability > BLOCK_THRESHOLD) {
        flagged.push(p.className);
      }
      if (p.className === "Sexy" && p.probability > SEXY_THRESHOLD) {
        flagged.push("Sexy");
      }
    }

    URL.revokeObjectURL(img.src);

    return {
      safe: flagged.length === 0,
      categories: flagged,
      scores,
      fallbackUsed: false,
    };
  } catch (err) {
    logger.error("nsfw_check_failed", { err: String(err) });
    return { safe: true, categories: [], scores: {}, fallbackUsed: true };
  }
}

/**
 * Optional server-side cross-check via Sightengine.
 * Requires NEXT_PUBLIC_SIGHTENGINE_USER and server-secret SIGHTENGINE_SECRET.
 * Called via /api/moderate-photo route (not implemented here — stub).
 */
export async function crossCheckPhotoServer(file: File): Promise<NsfwResult | null> {
  if (!process.env.NEXT_PUBLIC_SIGHTENGINE_USER) return null;
  try {
    const form = new FormData();
    form.append("media", file);
    const res = await fetch("/api/moderate-photo", { method: "POST", body: form });
    if (!res.ok) return null;
    return (await res.json()) as NsfwResult;
  } catch (err) {
    logger.error("nsfw_server_check_failed", { err: String(err) });
    return null;
  }
}
