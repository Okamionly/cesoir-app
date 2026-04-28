"use client";

/**
 * Wave 17 — Real-time typing indicator (boolean variant)
 *
 * `useTypingStatus(conversationId, peerId)` opens a Supabase Realtime
 * broadcast channel `typing-${conversationId}` (namespaced via
 * `namespacedChannelName`) and exposes:
 *
 *   - `peerTyping`: `true` when the peer's last "typing" broadcast was
 *      received less than 4 s ago, `false` otherwise.
 *   - `broadcastTyping()`: debounced 1 s — sends a typing broadcast.
 *      Empty inputs are NOT broadcasted (gate at the call site or via
 *      the optional `text` arg). The local "I'm typing" flag auto-clears
 *      3 s after the last keystroke.
 *
 * Why a separate hook from `useTypingIndicator`?
 *   - `useTypingIndicator` returns the peer's *name* (string|null) and is
 *     consumed by the messages-list `<TypingIndicator />` (peer name
 *     bubble in the scroll log).
 *   - `useTypingStatus` returns a *boolean* and is consumed by the chip
 *     above the input area in `chat/[id]`. Same channel name, additive
 *     `peer_id` filter — supabase broadcast fans out to all subscribers,
 *     so two consumers can coexist on the same channel.
 *
 * Constraints (Wave 17 brief):
 *   - Debounce broadcasts at 1 s to avoid hammering Realtime with one
 *     message per keystroke.
 *   - Track peer's last typing timestamp (ms epoch) and derive
 *     `peerTyping = lastTypingAt > now() - 4000`. We re-evaluate on a
 *     500 ms timer so the chip auto-hides once the peer stops typing,
 *     even if the network drops the eventual `stop` broadcast.
 *   - Use `namespacedChannelName(base, userId, nonce)` to avoid the
 *     supabase-js cached-channel collision (lessons learned PR #43).
 *     `nonce` is the consumer's `useId()` so each mount is unique even
 *     across StrictMode double-mount.
 */

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  namespacedChannelName,
  useRealtimeChannel,
} from "@/lib/hooks/useSupabaseQuery";

/** Public return shape — kept narrow on purpose. */
export interface UseTypingStatusResult {
  /** True iff peer broadcasted typing < 4 s ago. */
  peerTyping: boolean;
  /**
   * Debounced (1 s) broadcast of "I'm typing" to the conversation
   * channel. Re-arms the local 3 s auto-clear timer on every call.
   * Pass an empty/whitespace `text` to skip — we never broadcast on
   * an empty input (avoids "user is typing..." flickering when they
   * just clear the textarea).
   */
  broadcastTyping: (text?: string) => void;
}

const DEBOUNCE_MS = 1000;
const PEER_STALENESS_MS = 4000;
const LOCAL_AUTO_CLEAR_MS = 3000;
/** How often we re-evaluate `peerTyping` so the chip can auto-hide. */
const TICK_MS = 500;

interface TypingPayload {
  user_id: string;
}

export function useTypingStatus(
  conversationId: string | undefined,
  peerId: string | undefined,
): UseTypingStatusResult {
  const nonce = useId();
  const [peerTyping, setPeerTyping] = useState(false);

  // Track peer's last typing timestamp as a ref — we only flip the
  // boolean when the staleness check changes, so re-renders stay rare.
  const peerLastTypingAtRef = useRef<number>(0);

  // Debounce + auto-clear timers for the *local* typing flag.
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastLocalTypingAtRef = useRef<number>(0);

  // Resolve the namespaced channel name once per mount. We pass the
  // peer's user id as the namespace anchor so each peer pair gets
  // its own channel topic, plus the `useId()` nonce so a remount
  // (e.g. StrictMode) doesn't collide with the previous lifecycle's
  // still-tearing-down channel.
  const channelName =
    conversationId
      ? namespacedChannelName(`typing-${conversationId}`, peerId, nonce)
      : "";

  const { channelRef } = useRealtimeChannel(
    (client) =>
      conversationId && peerId
        ? client.channel(channelName).on(
            "broadcast",
            { event: "typing" },
            (msg) => {
              const data = (msg.payload ?? {}) as Partial<TypingPayload>;
              // Only react to broadcasts FROM the peer. We deliberately
              // accept any non-self user id so this same hook works in
              // group chats later — but for now `peerId` matches.
              if (!data.user_id || data.user_id !== peerId) return;
              peerLastTypingAtRef.current = Date.now();
              setPeerTyping(true);
            },
          )
        : null,
    [conversationId, peerId, channelName],
  );

  // Re-evaluate `peerTyping` every TICK_MS so the chip auto-hides 4 s
  // after the last broadcast (independent of any "stop" event).
  useEffect(() => {
    if (!conversationId || !peerId) return;
    const interval = setInterval(() => {
      const fresh =
        peerLastTypingAtRef.current > Date.now() - PEER_STALENESS_MS;
      setPeerTyping((prev) => (prev !== fresh ? fresh : prev));
    }, TICK_MS);
    return () => clearInterval(interval);
  }, [conversationId, peerId]);

  // Cleanup local timers on unmount.
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (autoClearTimerRef.current) clearTimeout(autoClearTimerRef.current);
    };
  }, []);

  const broadcastTyping = useCallback(
    (text?: string) => {
      // Never broadcast on empty input — avoids spurious "typing"
      // states when the user clears the textarea.
      if (text !== undefined && text.trim().length === 0) return;

      const now = Date.now();
      lastLocalTypingAtRef.current = now;

      // (Re-)arm the 3 s auto-clear: this is a local flag — we don't
      // currently broadcast a "stop" event because the peer's
      // 4 s staleness check is our source of truth on the receiving
      // side. Keeping the local timer lets a future "stop" broadcast
      // (or analytics) latch onto the same lifecycle.
      if (autoClearTimerRef.current) clearTimeout(autoClearTimerRef.current);
      autoClearTimerRef.current = setTimeout(() => {
        autoClearTimerRef.current = null;
      }, LOCAL_AUTO_CLEAR_MS);

      // Debounce broadcasts — only the trailing edge fires after 1 s
      // of quiet keystrokes. Combined with the auto-clear, a burst of
      // 50 keystrokes in 5 s yields ~5 broadcasts, not 50.
      if (debounceTimerRef.current) return; // already scheduled
      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null;
        const channel = channelRef.current;
        if (!channel) return;
        // Resolve the local user id at send time — avoids stale
        // closure if the auth user changes mid-session.
        void supabase.auth.getUser().then(({ data }) => {
          const uid = data.user?.id;
          if (!uid) return;
          channel.send({
            type: "broadcast",
            event: "typing",
            payload: { user_id: uid } satisfies TypingPayload,
          });
        });
      }, DEBOUNCE_MS);
    },
    [channelRef],
  );

  return { peerTyping, broadcastTyping };
}

export default useTypingStatus;
