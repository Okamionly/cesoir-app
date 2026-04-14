"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabase";
import type { DbConversation, DbMessage, DbProfile } from "./supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

// ---------- Types ----------

export interface ConversationWithPeer {
  id: string;
  peer: Pick<DbProfile, "id" | "name" | "avatar_url" | "is_online">;
  mode: string | null;
  lastMessage: string | null;
  lastMessageAt: string;
  unreadCount: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  readAt: string | null;
  isOwn: boolean;
}

// ---------- Hook : conversation list ----------

export function useConversations(userId: string | undefined) {
  const [conversations, setConversations] = useState<ConversationWithPeer[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const fetchConversations = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    // 1 - fetch conversations where user is participant
    const { data: convos, error } = await supabase
      .from("conversations")
      .select("*")
      .or(`user_a.eq.${userId},user_b.eq.${userId}`)
      .order("last_message_at", { ascending: false });

    if (error || !convos) {
      setLoading(false);
      return;
    }

    // 2 - collect peer ids
    const peerIds = convos.map((c: DbConversation) =>
      c.user_a === userId ? c.user_b : c.user_a,
    );

    // 3 - fetch peer profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, avatar_url, is_online")
      .in("id", peerIds);

    const profileMap = new Map(
      (profiles ?? []).map((p: Pick<DbProfile, "id" | "name" | "avatar_url" | "is_online">) => [p.id, p]),
    );

    // 4 - fetch latest message per conversation
    const { data: latestMessages } = await supabase
      .from("messages")
      .select("conversation_id, content, created_at")
      .in(
        "conversation_id",
        convos.map((c: DbConversation) => c.id),
      )
      .order("created_at", { ascending: false });

    const latestMap = new Map<string, { content: string; created_at: string }>();
    for (const m of latestMessages ?? []) {
      if (!latestMap.has(m.conversation_id)) {
        latestMap.set(m.conversation_id, m);
      }
    }

    // 5 - count unread per conversation
    const { data: unreadRows } = await supabase
      .from("messages")
      .select("conversation_id, id")
      .in(
        "conversation_id",
        convos.map((c: DbConversation) => c.id),
      )
      .neq("sender_id", userId)
      .is("read_at", null);

    const unreadMap = new Map<string, number>();
    for (const row of unreadRows ?? []) {
      unreadMap.set(row.conversation_id, (unreadMap.get(row.conversation_id) ?? 0) + 1);
    }

    // 6 - assemble
    const results: ConversationWithPeer[] = convos.map((c: DbConversation) => {
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
        lastMessageAt: latest?.created_at ?? c.last_message_at,
        unreadCount: unreadMap.get(c.id) ?? 0,
      };
    });

    setConversations(results);
    setLoading(false);
  }, [userId]);

  // initial fetch
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // realtime: refresh list when any related message arrives
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`conv-list-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "conversations",
          filter: `user_a=eq.${userId}` },
        () => fetchConversations(),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "conversations",
          filter: `user_b=eq.${userId}` },
        () => fetchConversations(),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "conversations" },
        (payload) => {
          const conv = payload.new as { user_a: string; user_b: string };
          if (conv.user_a === userId || conv.user_b === userId) {
            fetchConversations();
          }
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [userId, fetchConversations]);

  /** Soft-delete: archive a conversation (sets archived_at, keeps data) */
  const archiveConversation = useCallback(async (conversationId: string) => {
    if (!userId) return;
    await supabase
      .from("conversations")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", conversationId)
      .or(`user_a.eq.${userId},user_b.eq.${userId}`);

    // Remove from local state immediately
    setConversations((prev) => prev.filter((c) => c.id !== conversationId));
  }, [userId]);

  /** Hard-delete: permanently remove conversation and all its messages */
  const deleteConversation = useCallback(async (conversationId: string) => {
    if (!userId) return;

    // Delete messages first (FK constraint)
    await supabase
      .from("messages")
      .delete()
      .eq("conversation_id", conversationId);

    // Delete conversation
    await supabase
      .from("conversations")
      .delete()
      .eq("id", conversationId)
      .or(`user_a.eq.${userId},user_b.eq.${userId}`);

    // Remove from local state
    setConversations((prev) => prev.filter((c) => c.id !== conversationId));
  }, [userId]);

  return { conversations, loading, refresh: fetchConversations, archiveConversation, deleteConversation };
}

// ---------- Hook : single conversation messages ----------

const PAGE_SIZE = 50;

export function useChat(conversationId: string | undefined, userId: string | undefined) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [sending, setSending] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const offsetRef = useRef(0);

  // fetch last PAGE_SIZE messages (most recent first, then reverse for display)
  useEffect(() => {
    if (!conversationId || !userId) return;

    let cancelled = false;
    offsetRef.current = 0;

    (async () => {
      setLoading(true);
      setHasMore(true);

      // count total messages for this conversation
      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", conversationId);

      const total = count ?? 0;
      const start = Math.max(0, total - PAGE_SIZE);
      const end = total - 1;

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .range(start, end);

      if (!cancelled && !error && data) {
        offsetRef.current = start;
        setHasMore(start > 0);
        setMessages(
          data.map((m: DbMessage) => ({
            id: m.id,
            senderId: m.sender_id,
            content: m.content,
            createdAt: m.created_at,
            readAt: m.read_at,
            isOwn: m.sender_id === userId,
          })),
        );
      }
      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [conversationId, userId]);

  // load older messages (previous PAGE_SIZE)
  const loadMore = useCallback(async () => {
    if (!conversationId || !userId || loadingMore || !hasMore) return;

    setLoadingMore(true);
    const currentStart = offsetRef.current;
    const newStart = Math.max(0, currentStart - PAGE_SIZE);
    const newEnd = currentStart - 1;

    if (newEnd < 0) {
      setHasMore(false);
      setLoadingMore(false);
      return;
    }

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .range(newStart, newEnd);

    if (!error && data && data.length > 0) {
      offsetRef.current = newStart;
      setHasMore(newStart > 0);
      const older = data.map((m: DbMessage) => ({
        id: m.id,
        senderId: m.sender_id,
        content: m.content,
        createdAt: m.created_at,
        readAt: m.read_at,
        isOwn: m.sender_id === userId,
      }));
      setMessages((prev) => {
        // dedupe
        const existingIds = new Set(prev.map((p) => p.id));
        const unique = older.filter((m) => !existingIds.has(m.id));
        return [...unique, ...prev];
      });
    } else {
      setHasMore(false);
    }

    setLoadingMore(false);
  }, [conversationId, userId, loadingMore, hasMore]);

  // subscribe to new messages in this conversation
  useEffect(() => {
    if (!conversationId || !userId) return;

    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const m = payload.new as DbMessage;
          setMessages((prev) => {
            // avoid dupes (optimistic insert)
            if (prev.some((p) => p.id === m.id)) return prev;
            return [
              ...prev,
              {
                id: m.id,
                senderId: m.sender_id,
                content: m.content,
                createdAt: m.created_at,
                readAt: m.read_at,
                isOwn: m.sender_id === userId,
              },
            ];
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const m = payload.new as DbMessage;
          setMessages((prev) =>
            prev.map((p) =>
              p.id === m.id ? { ...p, readAt: m.read_at } : p,
            ),
          );
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [conversationId, userId]);

  // send a message
  const sendMessage = useCallback(
    async (content: string) => {
      if (!conversationId || !userId || !content.trim()) return;
      setSending(true);

      const trimmed = content.trim();

      // optimistic insert
      const optimisticId = `opt-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: optimisticId,
          senderId: userId,
          content: trimmed,
          createdAt: new Date().toISOString(),
          readAt: null,
          isOwn: true,
        },
      ]);

      const { data, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: userId,
          content: trimmed,
        })
        .select()
        .single();

      if (data) {
        // replace optimistic with real
        setMessages((prev) =>
          prev.map((m) =>
            m.id === optimisticId
              ? {
                  id: data.id,
                  senderId: data.sender_id,
                  content: data.content,
                  createdAt: data.created_at,
                  readAt: data.read_at,
                  isOwn: true,
                }
              : m,
          ),
        );
        // update conversation last_message_at
        await supabase
          .from("conversations")
          .update({ last_message_at: data.created_at })
          .eq("id", conversationId);
      } else if (error) {
        // remove optimistic on failure
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      }

      setSending(false);
    },
    [conversationId, userId],
  );

  // mark all messages as read
  const markAsRead = useCallback(async () => {
    if (!conversationId || !userId) return;

    await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .neq("sender_id", userId)
      .is("read_at", null);
  }, [conversationId, userId]);

  return { messages, loading, loadingMore, hasMore, sending, sendMessage, markAsRead, loadMore };
}

// ---------- Hook : typing indicator via Presence ----------

export function useTypingIndicator(
  conversationId: string | undefined,
  userId: string | undefined,
  userName: string | undefined,
) {
  const [peerTyping, setPeerTyping] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!conversationId || !userId) return;

    const channel = supabase.channel(`typing-${conversationId}`, {
      config: { presence: { key: userId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        let typing: string | null = null;
        for (const key of Object.keys(state)) {
          if (key !== userId) {
            const presences = state[key] as Array<{ is_typing?: boolean; name?: string }>;
            const active = presences.find((p) => p.is_typing);
            if (active) {
              typing = active.name ?? "...";
            }
          }
        }
        setPeerTyping(typing);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ is_typing: false, name: userName ?? "Utilisateur" });
        }
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [conversationId, userId, userName]);

  const sendTyping = useCallback(() => {
    const channel = channelRef.current;
    if (!channel) return;

    channel.track({ is_typing: true, name: userName ?? "Utilisateur" });

    // Auto-clear typing after 3 seconds of inactivity
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      channel.track({ is_typing: false, name: userName ?? "Utilisateur" });
    }, 3000);
  }, [userName]);

  const stopTyping = useCallback(() => {
    const channel = channelRef.current;
    if (!channel) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    channel.track({ is_typing: false, name: userName ?? "Utilisateur" });
  }, [userName]);

  return { peerTyping, sendTyping, stopTyping };
}

// ---------- Helper : create conversation + send first message ----------

export async function createConversation(
  userId: string,
  peerId: string,
  mode: string | null,
  firstMessage: string,
): Promise<string | null> {
  // check if conversation already exists between these two users
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .or(
      `and(user_a.eq.${userId},user_b.eq.${peerId}),and(user_a.eq.${peerId},user_b.eq.${userId})`,
    )
    .limit(1)
    .single();

  if (existing) {
    // send message into existing conversation
    await supabase.from("messages").insert({
      conversation_id: existing.id,
      sender_id: userId,
      content: firstMessage.trim(),
    });
    await supabase
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", existing.id);
    return existing.id;
  }

  // create new conversation
  const { data: convo, error } = await supabase
    .from("conversations")
    .insert({
      user_a: userId,
      user_b: peerId,
      mode,
      last_message_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error || !convo) return null;

  // send first message
  await supabase.from("messages").insert({
    conversation_id: convo.id,
    sender_id: userId,
    content: firstMessage.trim(),
  });

  return convo.id;
}
