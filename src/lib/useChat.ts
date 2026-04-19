"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabase";
import type { DbConversation, DbMessage, DbProfile } from "./supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useRealtimeChannel } from "@/lib/hooks/useSupabaseQuery";

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

  // realtime: refresh list when any related message arrives (unified cleanup)
  useRealtimeChannel(
    (client) =>
      userId
        ? client
            .channel(`conv-list-${userId}`)
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
        : null,
    [userId, fetchConversations],
  );
  void channelRef; // kept for API stability (previously exposed via ref)

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

  // subscribe to new messages in this conversation (unified cleanup)
  useRealtimeChannel(
    (client) =>
      conversationId && userId
        ? client
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
                  prev.map((p) => (p.id === m.id ? { ...p, readAt: m.read_at } : p)),
                );
              },
            )
        : null,
    [conversationId, userId],
  );
  void channelRef; // kept for API stability

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

// ---------- Hook : typing indicator via Realtime Broadcast ----------

export function useTypingIndicator(
  conversationId: string | undefined,
  userId: string | undefined,
  userName: string | undefined,
) {
  const [peerTyping, setPeerTyping] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const peerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Unified subscription (cleanup handled by useRealtimeChannel)
  const { channelRef } = useRealtimeChannel(
    (client) =>
      conversationId && userId
        ? client
            .channel(`typing-${conversationId}`)
            .on("broadcast", { event: "typing" }, (payload) => {
              const data = payload.payload as { user_id: string; name: string };
              if (data.user_id === userId) return; // ignore own typing

              setPeerTyping(data.name ?? "...");

              // Auto-clear peer typing after 3 seconds of no broadcast
              if (peerTimeoutRef.current) clearTimeout(peerTimeoutRef.current);
              peerTimeoutRef.current = setTimeout(() => {
                setPeerTyping(null);
              }, 3000);
            })
            .on("broadcast", { event: "stop_typing" }, (payload) => {
              const data = payload.payload as { user_id: string };
              if (data.user_id === userId) return;
              if (peerTimeoutRef.current) clearTimeout(peerTimeoutRef.current);
              setPeerTyping(null);
            })
        : null,
    [conversationId, userId],
  );

  // Clear local timeout on unmount (channel cleanup lives in the hook)
  useEffect(() => {
    return () => {
      if (peerTimeoutRef.current) clearTimeout(peerTimeoutRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const sendTyping = useCallback(() => {
    const channel = channelRef.current;
    if (!channel) return;

    channel.send({
      type: "broadcast",
      event: "typing",
      payload: { user_id: userId, name: userName ?? "Utilisateur" },
    });

    // Auto-send stop_typing after 3 seconds of inactivity
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      const current = channelRef.current;
      if (!current) return;
      current.send({
        type: "broadcast",
        event: "stop_typing",
        payload: { user_id: userId },
      });
    }, 3000);
  }, [channelRef, userId, userName]);

  const stopTyping = useCallback(() => {
    const channel = channelRef.current;
    if (!channel) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    channel.send({
      type: "broadcast",
      event: "stop_typing",
      payload: { user_id: userId },
    });
  }, [channelRef, userId]);

  return { peerTyping, sendTyping, stopTyping };
}

// ---------- Hook : online presence per conversation ----------

export interface PeerPresence {
  isOnline: boolean;
  lastSeen: string | null;
}

export function useConversationPresence(
  conversationId: string | undefined,
  userId: string | undefined,
  peerId: string | undefined,
): PeerPresence {
  const [presence, setPresence] = useState<PeerPresence>({
    isOnline: false,
    lastSeen: null,
  });

  // Unified subscription — presence tracking is wired in the factory's
  // own .subscribe callback (invoked once when channel joins). The outer
  // useRealtimeChannel still owns unsubscribe/cleanup on dep change/unmount.
  useRealtimeChannel(
    (client) => {
      if (!conversationId || !userId || !peerId) return null;
      const channel = client.channel(`presence-${conversationId}`, {
        config: { presence: { key: userId } },
      });
      channel.on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const peerPresences = state[peerId] as
          | Array<{ online_at?: string }>
          | undefined;
        if (peerPresences && peerPresences.length > 0) {
          setPresence({ isOnline: true, lastSeen: new Date().toISOString() });
        } else {
          setPresence((prev) => ({
            isOnline: false,
            lastSeen: prev.isOnline ? new Date().toISOString() : prev.lastSeen,
          }));
        }
      });
      // Track self presence once the channel reports SUBSCRIBED.
      // useRealtimeChannel's subsequent no-arg .subscribe() is a no-op
      // when the channel is already joining/joined (supabase-js guards it).
      channel.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });
      return channel;
    },
    [conversationId, userId, peerId],
  );

  return presence;
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
