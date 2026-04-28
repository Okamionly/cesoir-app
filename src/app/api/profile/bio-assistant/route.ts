/**
 * POST /api/profile/bio-assistant — AI bio drafting assistant (Wave 17).
 *
 * The user answers 5 short questions on /profile (cuisine, ideal Saturday,
 * recent emotional moment, dream travel companion, fun fact). We pass those
 * answers to Claude Haiku 3.5 with a coaching prompt that produces a warm,
 * authentic French bio (max 150 mots, ton "tu", invite a engager).
 *
 * Body: { answers: { question: string, answer: string }[] }
 * Response success:
 *   { ok: true, data: { bio: string, fallbackUsed: boolean } }
 *
 * Response on missing key / API error: graceful fallback — we still return a
 * 200 with `fallbackUsed: true` and a generic bio stitched from the answers
 * so the UI keeps flowing rather than failing the wizard.
 *
 * Auth: Bearer or SSR cookie via requireUser.
 * Rate limit: per-(user,ip) on the shared "api" budget — Anthropic spend
 * stays bounded if a token leaks.
 */

import { requireUser, AuthError } from "@/lib/api/auth";
import { apiError, apiOk } from "@/lib/api/response";
import {
  checkRateLimitByAction,
  getClientIp,
  rateLimitResponse,
} from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ── Constants ────────────────────────────────────────────────────────────────

/**
 * Anthropic model — small + fast for short structured generation. Same tier
 * the icebreakers route already uses (claude-haiku-3-5).
 */
const CLAUDE_MODEL = "claude-haiku-3-5";

/** Cap output so Claude can't pile up tokens on a runaway bio draft. */
const MAX_TOKENS = 500;

/** Each user answer is capped client-side at 100 chars; defence-in-depth here. */
const ANSWER_CHAR_CAP = 100;

/** Each question label is at most ~120 chars (we control the prompts client-side). */
const QUESTION_CHAR_CAP = 200;

/** We expect exactly 5 Q&A pairs for a complete wizard pass. */
const EXPECTED_ANSWER_COUNT = 5;

/** Hard cap on the generated bio so it fits the profiles.bio column comfortably. */
const BIO_CHAR_CAP = 1200;

// ── Helpers ──────────────────────────────────────────────────────────────────

interface AnswerPair {
  question: string;
  answer: string;
}

function isAnswerPair(v: unknown): v is AnswerPair {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return typeof o.question === "string" && typeof o.answer === "string";
}

/**
 * Build a deterministic fallback bio from the user's answers when the
 * Claude call is unavailable. Plain + safe — we still want a valid draft
 * the user can edit rather than blocking the UX.
 */
function fallbackBio(answers: AnswerPair[]): string {
  const lines = answers
    .map((p) => p.answer.trim())
    .filter((s) => s.length > 0);
  if (lines.length === 0) {
    return "Bio en construction — ajoute quelques mots sur toi !";
  }
  // Stitch into 1–2 short sentences without inventing claims about the user.
  const head = lines.slice(0, 2).join(". ");
  const tail = lines.slice(2).join(", ");
  const joined = tail ? `${head}. ${tail}.` : `${head}.`;
  return joined.slice(0, BIO_CHAR_CAP);
}

/**
 * Call Claude with the 5 Q&A pairs and parse a JSON {bio: string} response.
 * Returns null on any failure — caller falls back to a stitched bio.
 */
async function generateWithClaude(
  answers: AnswerPair[],
): Promise<string | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;

  const qaBlock = answers
    .map(
      (p, i) =>
        `Q${i + 1}: ${p.question.slice(0, QUESTION_CHAR_CAP)}\n` +
        `R${i + 1}: ${p.answer.slice(0, ANSWER_CHAR_CAP)}`,
    )
    .join("\n\n");

  const userPrompt =
    `Voici 5 reponses du membre :\n\n${qaBlock}\n\n` +
    `Genere une bio chaleureuse et authentique, max 150 mots, en francais, ` +
    `ton "tu", qui donne envie d'engager la conversation. Evite le generique. ` +
    `Inspire-toi des details concrets dans ses reponses (cuisine preferee, ` +
    `samedi ideal, etc.) sans recopier les reponses brutes. Pas d'emoji. ` +
    `Reponds UNIQUEMENT en JSON valide au format: {"bio": "..."}`;

  const systemPrompt =
    "Tu es un coach pour app de rencontre. Tu generes uniquement du JSON " +
    "valide, sans texte avant ou apres. Aucun emoji. Francais informel mais " +
    "respectueux. Tu ecris a la premiere personne du membre, ton chaleureux, " +
    "qui invite a la conversation.";

  let res: Response;
  try {
    res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: MAX_TOKENS,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });
  } catch (err) {
    logger.warn("bio_assistant_claude_fetch_failed", { err: String(err) });
    return null;
  }

  if (!res.ok) {
    logger.warn("bio_assistant_claude_http_error", { status: res.status });
    return null;
  }

  let payload: unknown;
  try {
    payload = await res.json();
  } catch {
    return null;
  }

  // Anthropic Messages API returns { content: [{ type: "text", text: "..." }] }.
  const content = (payload as { content?: unknown }).content;
  if (!Array.isArray(content)) return null;
  const textBlock = content.find(
    (b): b is { type: string; text: string } =>
      typeof b === "object" &&
      b !== null &&
      (b as { type?: unknown }).type === "text" &&
      typeof (b as { text?: unknown }).text === "string",
  );
  if (!textBlock) return null;

  // Strip markdown fences just in case the model wrapped the JSON.
  const raw = textBlock.text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    logger.warn("bio_assistant_claude_json_parse_failed");
    return null;
  }

  const bio = (parsed as { bio?: unknown }).bio;
  if (typeof bio !== "string") return null;

  const cleaned = bio.trim().slice(0, BIO_CHAR_CAP);
  if (cleaned.length === 0) return null;
  return cleaned;
}

// ── Handler ──────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  // 1) Auth ────────────────────────────────────────────────────────────────
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
  const ownerId = user.id;

  // 2) Rate limit — share the "api" budget. Per-(user,ip).
  const rate = await checkRateLimitByAction(
    `bio-assistant:${ownerId}:${getClientIp(request)}`,
    "api",
  );
  if (!rate.ok) {
    return rateLimitResponse(rate);
  }

  // 3) Body parse ─────────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Corps JSON invalide", 400, { code: "invalid_json" });
  }

  const rawAnswers =
    typeof body === "object" && body !== null && "answers" in body
      ? (body as { answers: unknown }).answers
      : null;

  if (!Array.isArray(rawAnswers)) {
    return apiError("answers doit etre un tableau", 400, {
      code: "invalid_answers",
    });
  }

  // Coerce + sanitise — strict enough to reject malformed input but generous
  // enough to ignore extra keys the client may send.
  const answers: AnswerPair[] = [];
  for (const item of rawAnswers) {
    if (!isAnswerPair(item)) continue;
    const q = item.question.trim().slice(0, QUESTION_CHAR_CAP);
    const a = item.answer.trim().slice(0, ANSWER_CHAR_CAP);
    if (q.length === 0 || a.length === 0) continue;
    answers.push({ question: q, answer: a });
  }

  if (answers.length !== EXPECTED_ANSWER_COUNT) {
    return apiError(
      `Il faut exactement ${EXPECTED_ANSWER_COUNT} reponses non vides.`,
      400,
      { code: "wrong_answer_count" },
    );
  }

  // 4) Try Claude — fall back to stitched bio on any failure ──────────────
  let bio = await generateWithClaude(answers);
  let fallbackUsed = false;
  if (!bio) {
    bio = fallbackBio(answers);
    fallbackUsed = true;
  }

  return apiOk({
    bio,
    fallbackUsed,
  });
}
