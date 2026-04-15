"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabase";
import { playSound } from "./sounds";
import type { RealtimeChannel } from "@supabase/supabase-js";

// ---------- Types ----------

export type NotifType = "message" | "like" | "match" | "feed" | "system";

export interface AppNotification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  data: Record<string, unknown>;
}

// ---------- Toast bus (lightweight pub/sub) ----------
// Components can subscribe to this to render toasts however they want.

type ToastListener = (title: string, body: string) => void;

const toastListeners = new Set<ToastListener>();

export function onToast(listener: ToastListener): () => void {
  toastListeners.add(listener);
  return () => toastListeners.delete(listener);
}

function emitToast(title: string, body: string): void {
  toastListeners.forEach((fn) => fn(title, body));
}

// ---------- Constants ----------

const MAX_NOTIFICATIONS = 50;
const STORAGE_KEY = "cesoir_app_notifs";

// ---------- Persistence ----------

function loadNotifications(): AppNotification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AppNotification[]) : [];
  } catch {
    return [];
  }
}

function saveNotifications(notifs: AppNotification[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifs));
  } catch {
    // localStorage unavailable
  }
}

// ---------- Hook ----------

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    loadNotifications(),
  );
  const channelsRef = useRef<RealtimeChannel[]>([]);

  // Derived: unread count
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Persist on change
  useEffect(() => {
    saveNotifications(notifications);
  }, [notifications]);

  // ---------- Helpers ----------

  const addNotification = useCallback(
    (notif: Omit<AppNotification, "id" | "timestamp" | "read">) => {
      const entry: AppNotification = {
        ...notif,
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: new Date().toISOString(),
        read: false,
      };

      setNotifications((prev) => {
        const next = [entry, ...prev];
        return next.slice(0, MAX_NOTIFICATIONS);
      });
    },
    [],
  );

  const markAsRead = useCallback((notifId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, read: true } : n)),
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // ---------- Realtime subscriptions ----------

  useEffect(() => {
    if (!userId) return;

    const channels: RealtimeChannel[] = [];

    // --- 1. Messages: new message in any conversation involving this user ---
    // We listen for INSERTs on messages where sender is NOT the current user.
    // Supabase Realtime filter: we listen broadly and filter client-side for ownership.
    const msgChannel = supabase
      .channel(`notif-messages-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async (payload) => {
          const msg = payload.new as {
            id: string;
            conversation_id: string;
            sender_id: string;
            content: string;
            created_at: string;
          };

          // Skip own messages
          if (msg.sender_id === userId) return;

          // Verify this conversation involves us
          const { data: conv } = await supabase
            .from("conversations")
            .select("user_a, user_b")
            .eq("id", msg.conversation_id)
            .single();

          if (!conv) return;
          if (conv.user_a !== userId && conv.user_b !== userId) return;

          // Get sender name
          const { data: profile } = await supabase
            .from("profiles")
            .select("name")
            .eq("id", msg.sender_id)
            .single();

          const senderName = profile?.name ?? "Quelqu'un";
          const title = `Nouveau message de ${senderName}`;
          const body = msg.content.length > 60
            ? msg.content.slice(0, 57) + "..."
            : msg.content;

          addNotification({
            type: "message",
            title,
            body,
            data: {
              conversationId: msg.conversation_id,
              senderId: msg.sender_id,
              messageId: msg.id,
            },
          });

          playSound("message");
          emitToast(title, body);
        },
      )
      .subscribe();

    channels.push(msgChannel);

    // --- 2. Interactions: someone liked / superliked us ---
    const likeChannel = supabase
      .channel(`notif-interactions-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "interactions",
          filter: `to_user=eq.${userId}`,
        },
        async (payload) => {
          const interaction = payload.new as {
            id: string;
            from_user: string;
            to_user: string;
            action: string;
            mode: string | null;
            created_at: string;
          };

          // Only handle likes and superlikes
          if (interaction.action !== "like" && interaction.action !== "superlike") return;

          // Get liker's name
          const { data: profile } = await supabase
            .from("profiles")
            .select("name")
            .eq("id", interaction.from_user)
            .single();

          const likerName = profile?.name ?? "Quelqu'un";

          // Check if it's a mutual match (we also liked them)
          const { data: reverse } = await supabase
            .from("interactions")
            .select("id")
            .eq("from_user", userId)
            .eq("to_user", interaction.from_user)
            .in("action", ["like", "superlike"])
            .single();

          const isMutualMatch = !!reverse;

          if (isMutualMatch) {
            const title = `\uD83C\uDF89 Match avec ${likerName} !`;
            const body = "Vous vous plaisez mutuellement. Dites bonjour !";

            addNotification({
              type: "match",
              title,
              body,
              data: {
                matchedUserId: interaction.from_user,
                mode: interaction.mode,
              },
            });

            playSound("match");
            emitToast(title, body);
          } else {
            const title = `\uD83D\uDC9C ${likerName} t'a lik\u00E9 !`;
            const body = interaction.action === "superlike"
              ? "Un superlike ! Tu lui plais vraiment."
              : "Tu lui plais. Swipe pour voir !";

            addNotification({
              type: "like",
              title,
              body,
              data: {
                likerId: interaction.from_user,
                action: interaction.action,
                mode: interaction.mode,
              },
            });

            playSound("like");
            emitToast(title, body);
          }
        },
      )
      .subscribe();

    channels.push(likeChannel);

    // --- 3. Feed activities: new activity from people nearby / in same mode ---
    const feedChannel = supabase
      .channel(`notif-feed-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "feed_activities",
        },
        async (payload) => {
          const activity = payload.new as {
            id: string;
            user_id: string;
            type: string;
            content: string;
            mode: string | null;
            created_at: string;
          };

          // Skip own activities
          if (activity.user_id === userId) return;

          // Get poster name
          const { data: profile } = await supabase
            .from("profiles")
            .select("name")
            .eq("id", activity.user_id)
            .single();

          const posterName = profile?.name ?? "Quelqu'un";
          const title = `${posterName} est actif${activity.mode ? ` en mode ${activity.mode}` : ""}`;
          const body = activity.content.length > 60
            ? activity.content.slice(0, 57) + "..."
            : activity.content;

          addNotification({
            type: "feed",
            title,
            body,
            data: {
              activityId: activity.id,
              userId: activity.user_id,
              activityType: activity.type,
              mode: activity.mode,
            },
          });

          playSound("notification");
          emitToast(title, body);
        },
      )
      .subscribe();

    channels.push(feedChannel);

    channelsRef.current = channels;

    return () => {
      channels.forEach((ch) => ch.unsubscribe());
      channelsRef.current = [];
    };
  }, [userId, addNotification]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
  };
}
