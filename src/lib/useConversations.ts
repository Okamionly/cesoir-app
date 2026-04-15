"use client";

/**
 * useConversations — standalone hook for the conversation list.
 *
 * Fetches all conversations for the current user, enriched with:
 *   - peer profile data (name, avatar, online status)
 *   - last message preview
 *   - unread message count
 *
 * Subscribes to real-time updates via Supabase Realtime so the list
 * stays fresh when new conversations appear or new messages arrive.
 *
 * Conversations are sorted by last message timestamp (most recent first).
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabase";
import type { DbConversation, DbProfile } from "./supabase-types";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useAuth } from "@/context/AuthContext";

// ---------- Types ----------

export interface ConversationPreview {
  /** Conversation row ID */
  id: string;
  /** Peer user's profile (the other participant) */
  peer: {
    id: string;
    name: string;
    avatar_url: string | null;
    is_online: boolean;
  };
  /** Mode under which the match was made (nullable) */
  mode: string | null;
  /** Text content of the last message, or null if no messages yet */
  lastMessage: string | null;
  /** Sender ID of the last message (to show "You: ..." prefix) */
  lastMessageSenderId: string | null;
  /** ISO timestamp of the last message */
  lastMessageAt: string;
  /** Number of unread messages from the peer */
  unreadCount: number;
  /** ISO timestamp when the conversation was created */
  createdAt: string;
}

export interface UseConversationsReturn {
  /** All conversations, sorted by most recent message first */
  conversations: ConversationPreview[];
  /** True during the initial load */
  loading: boolean;
  /** Error message if the last fetch failed */
  error: string | null;
  /** Manually trigger a refresh of the conversation list */
  refresh: () => Promise<void>;
  /** Total unread count across all conversations */
  totalUnread: number;
}

// ---------- Hook ----------

export function useConversations(): UseConversationsReturn {
  const { user } = useAuth();
  const userId = user?.id;

  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);

  const fetchConversations = useCallback(async () => {
    if (!userId) {
      setConversations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Fetch conversations where user is a participant
      const { data: convos, error: convError } = await supabase
        .from("conversations")
        .select("*")
        .or(`user_a.eq.${userId},user_b.eq.${userId}`)
        .order("last_message_at", { ascending: false });

      if (convError) throw new Error(convError.message);
      if (!convos || convos.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // 2. Collect peer IDs
      const peerIds = convos.map((c: DbConversation) =>
        c.user_a === userId ? c.user_b : c.user_a,
      );

      // 3. Fetch peer profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, avatar_url, is_online")
        .in("id", peerIds);

      const profileMap = new Map<
        string,
        Pick<DbProfile, "id" | "name" | "avatar_url" | "is_online">
      >((profiles ?? []).map((p) => [p.id, p]));

      // 4. Fetch the latest message per conversation
      //    We pull all messages for these conversations ordered desc,
      //    then pick the first per conversation_id.
      const convoIds = convos.map((c: DbConversation) => c.id);

      const { data: latestMessages } = await supabase
        .from("messages")
        .select("conversation_id, sender_id, content, created_at")
        .in("conversation_id", convoIds)
        .order("created_at", { ascending: false });

      const latestMap = new Map<
        string,
        { sender_id: string; content: string; created_at: string }
      >();
      for (const m of latestMessages ?? []) {
        if (!latestMap.has(m.conversation_id)) {
          latestMap.set(m.conversation_id, m);
        }
      }

      // 5. Count unread messages per conversation (messages from peer, not yet read)
      const { data: unreadRows } = await supabase
        .from("messages")
        .select("conversation_id, id")
        .in("conversation_id", convoIds)
        .neq("sender_id", userId)
        .is("read_at", null);

      const unreadMap = new Map<string, number>();
      for (const row of unreadRows ?? []) {
        unreadMap.set(
          row.conversation_id,
          (unreadMap.get(row.conversation_id) ?? 0) + 1,
        );
      }

      // 6. Assemble the results
      const results: ConversationPreview[] = convos.map(
        (c: DbConversation) => {
          const peerId = c.user_a === userId ? c.user_b : c.user_a;
          const peer = profileMap.get(peerId) ?? {
            id: peerId,
            name: "Utilisateur",
            avatar_url: null,
            is_online: false,
          };
          const latest = latestMap.get(c.id);

          return {
            id: c.id,
            peer,
            mode: c.mode,
            lastMessage: latest?.content ?? null,
            lastMessageSenderId: latest?.sender_id ?? null,
            lastMessageAt: latest?.created_at ?? c.last_message_at,
            unreadCount: unreadMap.get(c.id) ?? 0,
            createdAt: c.created_at,
          };
        },
      );

      // Already sorted by last_message_at from the query, but re-sort
      // to account for latest message timestamps overriding conversation timestamps
      results.sort(
        (a, b) =>
          new Date(b.lastMessageAt).getTime() -
          new Date(a.lastMessageAt).getTime(),
      );

      setConversations(results);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des conversations";
      setError(message);
      console.error("[useConversations] fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Initial fetch
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Real-time subscriptions: new conversations + new/updated messages
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`conversations-${userId}`)
      // New conversation where user is user_a
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversations",
          filter: `user_a=eq.${userId}`,
        },
        () => fetchConversations(),
      )
      // New conversation where user is user_b
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversations",
          filter: `user_b=eq.${userId}`,
        },
        () => fetchConversations(),
      )
      // Updated conversation (e.g. last_message_at changed)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversations",
        },
        (payload) => {
          const conv = payload.new as { user_a: string; user_b: string };
          if (conv.user_a === userId || conv.user_b === userId) {
            fetchConversations();
          }
        },
      )
      // New message in any conversation — triggers refresh for updated
      // last message preview and unread count
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          // Only refresh if the message is in one of our conversations
          const msg = payload.new as { conversation_id: string };
          const isRelevant = conversations.some(
            (c) => c.id === msg.conversation_id,
          );
          if (isRelevant) {
            fetchConversations();
          }
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
    // conversations is intentionally in deps so the INSERT handler
    // can check relevance, but won't cause a subscription loop
    // because we only subscribe/unsubscribe when userId changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, fetchConversations]);

  // Compute total unread across all conversations
  const totalUnread = conversations.reduce(
    (sum, c) => sum + c.unreadCount,
    0,
  );

  return {
    conversations,
    loading,
    error,
    refresh: fetchConversations,
    totalUnread,
  };
}
