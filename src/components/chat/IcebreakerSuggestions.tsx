"use client";

/**
 * IcebreakerSuggestions — Wave 17, AI conversation starter from bio.
 *
 * Renders 3 chip buttons with AI-generated icebreakers tailored to the
 * peer's bio + the shared conversation mode. The component:
 *
 *   1. Mounts only when the message thread is empty (no own messages
 *      yet AND total message count is 0). Hides itself once the user
 *      sends their first message — handled by the parent gate
 *      (`messageCount === 0`) AND the local `hasSentMessage` prop.
 *   2. On mount, calls POST /api/chat/icebreakers with { peerId,
 *      conversationId } and a Bearer token. The endpoint caches results
 *      24h server-side, so subsequent opens hit the cache and return
 *      instantly.
 *   3. On tap, fills the parent's message input via `onSelectSuggestion`
 *      and self-hides for the rest of the session (the user has acted).
 *   4. Loading state: 3 skeleton chips with `animate-pulse`.
 *   5. Error / no-bio state: gracefully shows the server-provided
 *      generic icebreakers (the API always returns 3 entries).
 *
 * The static, mode-based AIWingman starters still mount above this
 * component as a fallback in case the AI list never resolves; they are
 * gated by the same `messageCount` so they disappear once the user
 * starts typing.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { m, AnimatePresence } from "motion/react";
import { supabase } from "@/lib/supabase";
import { springs, micro } from "@/lib/motion-design";
import { logger } from "@/lib/logger";

// --- Types -------------------------------------------------------------

interface IcebreakerSuggestionsProps {
  /** Active conversation id (UUID). */
  conversationId: string;
  /** Peer profile id (UUID). The other participant in the conversation. */
  peerId: string | null | undefined;
  /** Total number of messages in the thread. We hide once > 0. */
  messageCount: number;
  /** Fill the message input with the chosen icebreaker. */
  onSelectSuggestion: (text: string) => void;
}

interface ApiResponse {
  ok?: boolean;
  data?: {
    icebreakers: [string, string, string];
    cached: boolean;
    fallbackUsed: boolean;
  };
  error?: string;
  code?: string;
}

// --- Component ---------------------------------------------------------

export default function IcebreakerSuggestions({
  conversationId,
  peerId,
  messageCount,
  onSelectSuggestion,
}: IcebreakerSuggestionsProps) {
  const [chips, setChips] = useState<[string, string, string] | null>(null);
  const [loading, setLoading] = useState(true);
  const [usedOnce, setUsedOnce] = useState(false);
  /** Guard against double-fetch in React strict mode + remounts. */
  const fetchedRef = useRef<string | null>(null);

  const fetchIcebreakers = useCallback(async () => {
    if (!peerId || !conversationId) return;

    // Pull the current session bearer token to send with the API call.
    // Same auth path as other client → /api/* calls (see IRLConfirm).
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    try {
      const res = await fetch("/api/chat/icebreakers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ peerId, conversationId }),
      });
      const payload = (await res.json().catch(() => null)) as ApiResponse | null;

      if (!res.ok || !payload?.data?.icebreakers) {
        logger.warn("icebreakers_client_api_rejected", {
          status: res.status,
          code: payload?.code,
        });
        setChips(null);
        return;
      }

      setChips(payload.data.icebreakers);
    } catch (err) {
      logger.warn("icebreakers_client_fetch_failed", { err: String(err) });
      setChips(null);
    } finally {
      setLoading(false);
    }
  }, [peerId, conversationId]);

  // Fire the API call exactly once per (conversationId, peerId) pair.
  useEffect(() => {
    if (!peerId || !conversationId) return;
    // Only fetch when the thread is empty — saves a round-trip on
    // re-opens of an active conversation.
    if (messageCount > 0) return;

    const key = `${conversationId}:${peerId}`;
    if (fetchedRef.current === key) return;
    fetchedRef.current = key;

    setLoading(true);
    void fetchIcebreakers();
  }, [conversationId, peerId, messageCount, fetchIcebreakers]);

  // Hide once the user has sent (or started sending) any message.
  if (messageCount > 0 || usedOnce) return null;

  // Don't render the block at all without a peer — there is nothing
  // to base the suggestions on.
  if (!peerId) return null;

  const handleTap = (text: string) => {
    onSelectSuggestion(text);
    setUsedOnce(true);
  };

  return (
    <AnimatePresence mode="wait">
      <m.div
        key="icebreaker-ai"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        transition={springs.elastic}
        className="px-3 pb-2"
        role="region"
        aria-label="Icebreakers IA suggeres"
      >
        <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider mb-2 px-1">
          ✨ Icebreakers IA
        </p>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {loading || !chips ? (
            // ── Skeleton chips ──────────────────────────────────────
            // Three pulsing pills sized to common icebreaker lengths.
            // We keep aria-busy so screen readers know to hold off.
            <div
              className="flex gap-2"
              aria-busy="true"
              aria-label="Generation des icebreakers"
            >
              {[140, 180, 160].map((width, i) => (
                <div
                  key={i}
                  className="shrink-0 h-8 rounded-full bg-accent/10 border border-accent/15 animate-pulse"
                  style={{ width }}
                />
              ))}
            </div>
          ) : (
            chips.map((chip, i) => (
              <m.button
                key={`${chip}-${i}`}
                type="button"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  ...springs.elastic,
                  delay: i * 0.06,
                }}
                whileTap={micro.tapScale}
                onClick={() => handleTap(chip)}
                className="shrink-0 px-3.5 py-2 rounded-full border border-accent/30 bg-accent/10 text-[12px] text-accent font-medium tap-target whitespace-nowrap hover:bg-accent/15 transition-colors"
              >
                {chip}
              </m.button>
            ))
          )}
        </div>
      </m.div>
    </AnimatePresence>
  );
}
