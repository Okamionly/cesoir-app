import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/api/auth";
import { logger } from "@/lib/logger";

/**
 * GET /api/moments/feed — return the caller's moment feed.
 *
 * Auth: required.
 *
 * Returns moments from users the caller is matched with (via the
 * `conversations` table — same definition as everywhere else in the
 * app: a conversation row exists ⇔ mutual like). Filters out:
 *   - expired rows (`expires_at <= now()`)
 *   - the caller's own moments (the feed shows OTHER people's moments;
 *     the caller's own moments are surfaced via a separate "My moment"
 *     UI entry point)
 *
 * Ordered by `posted_at DESC` so the freshest moments come first.
 *
 * Each row carries a 1h signed URL the client can render immediately
 * — saves a per-row signing round trip on the chat page.
 *
 * Response shape:
 *   {
 *     moments: [
 *       {
 *         id, userId, mediaPath, mediaUrl, caption, postedAt, expiresAt,
 *         user: { id, name, avatarUrl }
 *       }, ...
 *     ]
 *   }
 *
 * Why the join with `profiles` lives in the API and not in the DB
 * trigger / view: the feed is small (matches × moments) and the join
 * is cheap, but a DB view would lock the feature into a specific
 * profile shape. Keeping it in the route lets us evolve the projection
 * without a migration.
 */

export const runtime = "nodejs";

interface MomentRow {
  id: string;
  user_id: string;
  media_path: string;
  caption: string | null;
  posted_at: string;
  expires_at: string;
}

interface ProfileRow {
  id: string;
  name: string | null;
  avatar_url: string | null;
}

export async function GET(request: Request) {
  // ─── Auth ──────────────────────────────────────────────────────────
  let ctx;
  try {
    ctx = await requireUser(request);
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
  const { user, supabase: db } = ctx;
  const userId = user.id;

  // ─── Resolve matched-user set ──────────────────────────────────────
  // Supabase's RLS already filters `moments` to "owner OR matched", so
  // a naive `.from('moments').select('*').neq('user_id', userId)` would
  // technically work — but issuing the matched-user set explicitly lets
  // us also fan out the profile join and is significantly faster (one
  // index lookup + one IN scan vs the per-row matched-pair check the
  // RLS does on every read).
  const { data: convos, error: convoError } = await db
    .from("conversations")
    .select("user_a, user_b")
    .or(`user_a.eq.${userId},user_b.eq.${userId}`);

  if (convoError) {
    logger.error("api_moments_feed_conversations_failed", {
      err: convoError.message,
      userId,
    });
    return NextResponse.json(
      // 2026-05-07 (code review H1): never echo Supabase error string to client.
      { error: "feed_failed", message: "Erreur serveur" },
      { status: 500 },
    );
  }

  const matchedIds = new Set<string>();
  for (const c of (convos ?? []) as Array<{ user_a: string; user_b: string }>) {
    if (c.user_a === userId) matchedIds.add(c.user_b);
    else if (c.user_b === userId) matchedIds.add(c.user_a);
  }

  if (matchedIds.size === 0) {
    return NextResponse.json({ moments: [] });
  }

  // ─── Fetch unexpired moments from those users ──────────────────────
  const matchedArray = Array.from(matchedIds);
  const nowIso = new Date().toISOString();

  const { data: rows, error: momentsError } = await db
    .from("moments")
    .select("id, user_id, media_path, caption, posted_at, expires_at")
    .in("user_id", matchedArray)
    .gt("expires_at", nowIso)
    .order("posted_at", { ascending: false })
    .limit(100);

  if (momentsError) {
    logger.error("api_moments_feed_query_failed", {
      err: momentsError.message,
      userId,
    });
    return NextResponse.json(
      { error: "feed_failed", message: "Erreur serveur" },
      { status: 500 },
    );
  }

  const moments = (rows ?? []) as MomentRow[];

  if (moments.length === 0) {
    return NextResponse.json({ moments: [] });
  }

  // ─── Join profile snapshots ────────────────────────────────────────
  const ownerIds = Array.from(new Set(moments.map((m) => m.user_id)));
  const { data: profiles, error: profilesError } = await db
    .from("profiles")
    .select("id, name, avatar_url")
    .in("id", ownerIds);

  if (profilesError) {
    logger.warn("api_moments_feed_profiles_failed", {
      err: profilesError.message,
      userId,
    });
    // Non-fatal — we still return moments without the profile snapshot.
  }

  const profileById = new Map<string, ProfileRow>();
  for (const p of (profiles ?? []) as ProfileRow[]) {
    profileById.set(p.id, p);
  }

  // ─── Sign URLs in parallel ─────────────────────────────────────────
  // We sign each path with a 1h TTL — the chat page mounts these into
  // <Image> tags so a single TTL refresh per session is fine.
  const signed = await Promise.all(
    moments.map(async (m) => {
      const { data: signedData, error: signError } = await db.storage
        .from("moments")
        .createSignedUrl(m.media_path, 3600);
      if (signError || !signedData) {
        logger.warn("api_moments_feed_sign_failed", {
          err: signError?.message ?? "no_data",
          path: m.media_path,
        });
        return { moment: m, url: null as string | null };
      }
      return { moment: m, url: signedData.signedUrl };
    }),
  );

  // ─── Shape response ────────────────────────────────────────────────
  const payload = signed.map(({ moment: m, url }) => {
    const profile = profileById.get(m.user_id);
    return {
      id: m.id,
      userId: m.user_id,
      mediaPath: m.media_path,
      mediaUrl: url,
      caption: m.caption,
      postedAt: m.posted_at,
      expiresAt: m.expires_at,
      user: {
        id: m.user_id,
        name: profile?.name ?? null,
        avatarUrl: profile?.avatar_url ?? null,
      },
    };
  });

  return NextResponse.json({ moments: payload });
}
