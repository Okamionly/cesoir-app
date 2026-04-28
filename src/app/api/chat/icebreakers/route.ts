/**
 * POST /api/chat/icebreakers
 *
 * Wave 17 — AI conversation starter from the match's bio.
 *
 * When a user opens a NEW conversation in /chat/[id] for the first time
 * and the message thread is empty, the client requests 3 short,
 * contextualised icebreakers based on the match's bio + the shared
 * conversation mode. The call is paid + slow (Anthropic Claude) so we
 * cache the result for 24h in `icebreakers_cache`, keyed by
 * (owner_id, peer_id).
 *
 * Body: { peerId: UUID, conversationId: UUID }
 *
 * Response success:
 *   { ok: true, data: { icebreakers: [string, string, string], cached: boolean } }
 *
 * Response on missing key / API error / no bio: graceful fallback to 3
 * generic French icebreakers, still 200 OK with `fallbackUsed: true`.
 *
 * Auth: Bearer or SSR cookie via requireUser (which also enforces the
 * Origin/Referer CSRF check on cookie-bound mutations).
 */
import { requireUser, AuthError } from "@/lib/api/auth";
import { apiError, apiOk } from "@/lib/api/response";
import {
  checkRateLimitByAction,
  getClientIp,
  rateLimitResponse,
} from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { MODES, type ModeKey } from "@/lib/modes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// --- Constants ----------------------------------------------------------

/** Cache TTL — regenerate after this duration. */
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

/**
 * Anthropic model — small + fast for short structured generation.
 * Haiku is the cheapest tier. We don't need the long context of Sonnet.
 */
const CLAUDE_MODEL = "claude-haiku-3-5";

/** Cap output so Claude can't pile up tokens on a runaway response. */
const MAX_TOKENS = 300;

/** Fallback icebreakers when the API key is missing, the call fails,
 * or the peer has no bio. Kept in French to match the app voice. */
const FALLBACK_ICEBREAKERS: [string, string, string] = [
  "Salut ! Quel est ton plan pour ce soir ?",
  "Tu connais un bon endroit dans le coin ?",
  "Ca fait longtemps que tu es sur CeSoir ?",
];

/** Cheap UUID-shape sanity (defence-in-depth — RLS would reject anyway). */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// --- Helpers -----------------------------------------------------------

/** Sanitise a free-form Claude response into a 3-string tuple. */
function pickThree(arr: unknown): [string, string, string] | null {
  if (!Array.isArray(arr)) return null;
  const cleaned = arr
    .filter((s): s is string => typeof s === "string")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s.length <= 200);
  if (cleaned.length < 3) return null;
  return [cleaned[0], cleaned[1], cleaned[2]];
}

/**
 * Call Claude with the bio + mode context and parse a JSON response.
 * Returns null on any failure — caller falls back to generic starters.
 */
async function generateWithClaude(
  bio: string,
  modeName: string | null,
): Promise<[string, string, string] | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;

  const modeLine = modeName
    ? `Mode partage: "${modeName}".`
    : "Pas de mode partage specifique.";
  const userPrompt =
    `Bio du match: "${bio.slice(0, 800)}".\n${modeLine}\n\n` +
    `Genere exactement 3 icebreakers courts (max 15 mots chacun), chaleureux, ` +
    `contextualises sur la bio + mode partage. Reponds UNIQUEMENT en JSON ` +
    `valide au format: {"icebreakers": ["...", "...", "..."]}`;

  const systemPrompt =
    "Tu es un assistant pour app de rencontre. Tu generes uniquement du JSON " +
    "valide, sans texte avant ou apres. Aucun emoji. Francais informel mais " +
    "respectueux. Tu ne juges pas la bio.";

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
    logger.warn("icebreakers_claude_fetch_failed", { err: String(err) });
    return null;
  }

  if (!res.ok) {
    logger.warn("icebreakers_claude_http_error", { status: res.status });
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
    logger.warn("icebreakers_claude_json_parse_failed");
    return null;
  }

  const arr = (parsed as { icebreakers?: unknown }).icebreakers;
  return pickThree(arr);
}

// --- Handler -----------------------------------------------------------

export async function POST(request: Request) {
  // 1) Auth ------------------------------------------------------------
  let ctx;
  try {
    ctx = await requireUser(request);
  } catch (err) {
    if (err instanceof AuthError) {
      return apiError(err.message, err.status, { code: err.code });
    }
    throw err;
  }
  const { user, supabase: db } = ctx;
  const ownerId = user.id;

  // 2) Rate limit — share the "api" budget. Per-(user,ip) so a leaked
  //    token can't be amplified across hosts and Anthropic spend stays
  //    bounded. Wave 17.
  const rate = await checkRateLimitByAction(
    `icebreakers:${ownerId}:${getClientIp(request)}`,
    "api",
  );
  if (!rate.ok) {
    return rateLimitResponse(rate);
  }

  // 3) Body parse -----------------------------------------------------
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Corps JSON invalide", 400, { code: "invalid_json" });
  }

  const peerId =
    typeof body === "object" && body !== null && "peerId" in body
      ? String((body as { peerId: unknown }).peerId)
      : "";
  const conversationId =
    typeof body === "object" && body !== null && "conversationId" in body
      ? String((body as { conversationId: unknown }).conversationId)
      : "";

  if (!UUID_RE.test(peerId)) {
    return apiError("peerId invalide", 400, { code: "invalid_peer_id" });
  }
  if (!UUID_RE.test(conversationId)) {
    return apiError("conversationId invalide", 400, {
      code: "invalid_conversation_id",
    });
  }

  // 4) Conversation lookup + membership check --------------------------
  //    We want to read `mode` from the conversation row AND verify the
  //    caller is a participant + the peer is the OTHER participant.
  const { data: convo, error: convoErr } = await db
    .from("conversations")
    .select("id, user_a, user_b, mode")
    .eq("id", conversationId)
    .maybeSingle();

  if (convoErr) {
    logger.error("icebreakers_convo_lookup_failed", { err: convoErr.message });
    return apiError("Erreur serveur", 500, { code: "convo_lookup_failed" });
  }
  if (!convo) {
    return apiError("Conversation introuvable", 404, {
      code: "conversation_not_found",
    });
  }
  if (convo.user_a !== ownerId && convo.user_b !== ownerId) {
    // Don't leak existence — same status as not-found.
    return apiError("Conversation introuvable", 404, {
      code: "conversation_not_found",
    });
  }
  const expectedPeer = convo.user_a === ownerId ? convo.user_b : convo.user_a;
  if (expectedPeer !== peerId) {
    return apiError("peerId ne correspond pas a la conversation", 400, {
      code: "peer_mismatch",
    });
  }

  // 5) Cache hit? -----------------------------------------------------
  const { data: cached } = await db
    .from("icebreakers_cache")
    .select("icebreakers, generated_at")
    .eq("owner_id", ownerId)
    .eq("peer_id", peerId)
    .maybeSingle();

  if (cached?.icebreakers && cached.generated_at) {
    const age = Date.now() - new Date(cached.generated_at).getTime();
    if (age < CACHE_TTL_MS) {
      const tuple = pickThree(cached.icebreakers);
      if (tuple) {
        return apiOk({
          icebreakers: tuple,
          cached: true,
          fallbackUsed: false,
        });
      }
    }
  }

  // 6) Fetch peer profile for bio -------------------------------------
  //    We use the caller's RLS-scoped client so the read is governed by
  //    profile policies (peers visible to matched users).
  const { data: peerProfile } = await db
    .from("profiles")
    .select("bio")
    .eq("id", peerId)
    .maybeSingle();

  const bio =
    typeof peerProfile?.bio === "string" ? peerProfile.bio.trim() : "";

  // Resolve mode display name (the conversation `mode` is the slug).
  const modeKey = (convo.mode ?? null) as ModeKey | null;
  const modeName =
    modeKey && modeKey in MODES ? MODES[modeKey].name : null;

  // 7) Try Claude — fall back to generics on any failure --------------
  let tuple: [string, string, string] | null = null;
  let fallbackUsed = false;

  if (bio.length > 0) {
    tuple = await generateWithClaude(bio, modeName);
  }

  if (!tuple) {
    tuple = FALLBACK_ICEBREAKERS;
    fallbackUsed = true;
  }

  // 8) Upsert into cache (best-effort — failure shouldn't block the
  //    response). Skip the cache write when we used the generic
  //    fallback because there is no point re-reading those.
  if (!fallbackUsed) {
    const { error: upsertErr } = await db
      .from("icebreakers_cache")
      .upsert(
        {
          owner_id: ownerId,
          peer_id: peerId,
          icebreakers: tuple,
          generated_at: new Date().toISOString(),
        },
        { onConflict: "owner_id,peer_id" },
      );
    if (upsertErr) {
      logger.warn("icebreakers_cache_upsert_failed", {
        err: upsertErr.message,
      });
    }
  }

  return apiOk({
    icebreakers: tuple,
    cached: false,
    fallbackUsed,
  });
}
