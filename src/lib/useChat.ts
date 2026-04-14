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

  return { conversations, loading, refresh: fetchConversations };
}

// ---------- Hook : single conversation messages ----------

export function useChat(conversationId: string | undefined, userId: string | undefined) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // fetch existing messages
  useEffect(() => {
    if (!conversationId || !userId) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (!cancelled && !error && data) {
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

  return { messages, loading, sending, sendMessage, markAsRead };
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
