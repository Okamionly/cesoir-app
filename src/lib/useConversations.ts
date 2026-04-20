"use client";

/**
 * useConversations — standalone hook for the conversation list.
 *
 * Uses the unified useAsyncResource + useRealtimeChannel primitives.
 * See src/lib/hooks/README.md for pattern docs.
 */

import { useId, useRef } from "react";
import { supabase } from "./supabase";
import type { DbConversation, DbProfile } from "./supabase-types";
import { useAuth } from "@/context/AuthContext";
import { useAsyncResource } from "@/lib/hooks/useAsyncResource";
import {
  namespacedChannelName,
  useRealtimeChannel,
} from "@/lib/hooks/useSupabaseQuery";

// ---------- Types ----------

export interface ConversationPreview {
  id: string;
  peer: {
    id: string;
    name: string;
    avatar_url: string | null;
    is_online: boolean;
  };
  mode: string | null;
  lastMessage: string | null;
  lastMessageSenderId: string | null;
  lastMessageAt: string;
  unreadCount: number;
  createdAt: string;
}

export interface UseConversationsReturn {
  conversations: ConversationPreview[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  totalUnread: number;
}

// ---------- Hook ----------

export function useConversations(): UseConversationsReturn {
  const { user } = useAuth();
  const userId = user?.id;
  // Unique-per-component-instance suffix so multiple consumers of this hook
  // don't collide on Supabase channel names.
  const instanceId = useId();

  const { data, loading, error, refetch } = useAsyncResource<ConversationPreview[]>(
    async (signal) => {
      if (!userId) return [];

      // 1. Fetch conversations where user is a participant
      const { data: convos, error: convError } = await supabase
        .from("conversations")
        .select("*")
        .or(`user_a.eq.${userId},user_b.eq.${userId}`)
        .order("last_message_at", { ascending: false })
        .abortSignal(signal);

      if (convError) throw new Error(convError.message);
      if (!convos || convos.length === 0) return [];

      // 2. Collect peer IDs
      const peerIds = convos.map((c: DbConversation) =>
        c.user_a === userId ? c.user_b : c.user_a,
      );

      // 3. Fetch peer profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, avatar_url, is_online")
        .in("id", peerIds)
        .abortSignal(signal);

      const profileMap = new Map<
        string,
        Pick<DbProfile, "id" | "name" | "avatar_url" | "is_online">
      >((profiles ?? []).map((p) => [p.id, p]));

      // 4. Fetch the latest message per conversation
      const convoIds = convos.map((c: DbConversation) => c.id);

      const { data: latestMessages } = await supabase
        .from("messages")
        .select("conversation_id, sender_id, content, created_at")
        .in("conversation_id", convoIds)
        .order("created_at", { ascending: false })
        .abortSignal(signal);

      const latestMap = new Map<
        string,
        { sender_id: string; content: string; created_at: string }
      >();
      for (const m of latestMessages ?? []) {
        if (!latestMap.has(m.conversation_id)) {
          latestMap.set(m.conversation_id, m);
        }
      }

      // 5. Count unread messages per conversation
      const { data: unreadRows } = await supabase
        .from("messages")
        .select("conversation_id, id")
        .in("conversation_id", convoIds)
        .neq("sender_id", userId)
        .is("read_at", null)
        .abortSignal(signal);

      const unreadMap = new Map<string, number>();
      for (const row of unreadRows ?? []) {
        unreadMap.set(
          row.conversation_id,
          (unreadMap.get(row.conversation_id) ?? 0) + 1,
        );
      }

      // 6. Assemble the results
      const results: ConversationPreview[] = convos.map((c: DbConversation) => {
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
      });

      results.sort(
        (a, b) =>
          new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
      );

      return results;
    },
    [userId],
  );

  const conversations = data ?? [];
  // Ref to current conversations so realtime handler can check relevance without
  // causing subscribe/unsubscribe loops.
  const conversationsRef = useRef(conversations);
  conversationsRef.current = conversations;

  // Real-time subscriptions: new conversations + new/updated messages.
  // Channel name: base "conversations" + userId + instanceId so that
  // multiple mounts of this hook (e.g. StrictMode double-mount, multi-tab)
  // never collide on the Supabase realtime global namespace.
  useRealtimeChannel(
    (client) =>
      userId
        ? client
            .channel(
              namespacedChannelName(
                `conversations-${instanceId}`,
                userId,
              ),
            )
            .on(
              "postgres_changes",
              {
                event: "INSERT",
                schema: "public",
                table: "conversations",
                filter: `user_a=eq.${userId}`,
              },
              () => {
                void refetch();
              },
            )
            .on(
              "postgres_changes",
              {
                event: "INSERT",
                schema: "public",
                table: "conversations",
                filter: `user_b=eq.${userId}`,
              },
              () => {
                void refetch();
              },
            )
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
                  void refetch();
                }
              },
            )
            .on(
              "postgres_changes",
              {
                event: "INSERT",
                schema: "public",
                table: "messages",
              },
              (payload) => {
                const msg = payload.new as { conversation_id: string };
                const isRelevant = conversationsRef.current.some(
                  (c) => c.id === msg.conversation_id,
                );
                if (isRelevant) {
                  void refetch();
                }
              },
            )
        : null,
    [userId, instanceId, refetch],
  );

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return {
    conversations,
    loading,
    error: error?.message ?? null,
    refresh: async () => {
      await refetch();
    },
    totalUnread,
  };
}
