"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabase";
import { playSound } from "./sounds";
import { useRealtimeChannel } from "@/lib/hooks/useSupabaseQuery";

// ---------- Types ----------

/**
 * Canonical notification types.
 *
 * Wave 16 (2026-04-27) — extended with `new_match`, `new_message`,
 * `mode_activated`, `badge_unlocked`, `level_up` per the Notifications
 * Center page spec. The legacy short forms (`message`, `like`, `match`,
 * `feed`, `system`) remain valid so existing realtime emitters keep
 * compiling — `getCanonicalType()` below maps them through.
 */
export type NotifType =
  | "message"
  | "like"
  | "match"
  | "feed"
  | "system"
  | "new_match"
  | "new_message"
  | "mode_activated"
  | "badge_unlocked"
  | "level_up";

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
const READ_STATE_KEY = "cesoir_notif_read_state";

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

/**
 * Read-state for hydrated (Supabase-derived) notifications is tracked
 * separately from the realtime localStorage cache, because hydrated
 * entries are reconstructed on every refresh from canonical DB rows.
 */
function loadReadState(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(READ_STATE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveReadState(set: Set<string>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(READ_STATE_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // localStorage unavailable
  }
}

// ---------- Mode label helper ----------

const MODE_LABELS: Record<string, string> = {
  "solo-diner": "Solo Diner",
  "plus-one": "Plus One",
  tourist: "Touriste",
  "night-owl": "Night Owl",
  breakup: "Breakup Recovery",
  "new-in-town": "New in Town",
  langue: "Langue",
  "dog-date": "Dog Date",
  seasonal: "Seasonal",
};

function modeLabel(mode: string): string {
  return MODE_LABELS[mode] ?? mode;
}

// ---------- Achievement label helper ----------

const ACHIEVEMENT_LABELS: Record<string, string> = {
  first_match: "Premier match",
  first_message: "Premier message",
  first_meet: "Premier rendez-vous",
  five_matches: "Cinq matchs",
  ten_matches: "Dix matchs",
  streak_7: "Streak de 7 jours",
  streak_30: "Streak de 30 jours",
  trusted: "Profil de confiance",
};

function achievementLabel(key: string): string {
  return ACHIEVEMENT_LABELS[key] ?? key.replace(/_/g, " ");
}

// ---------- Hydration from Supabase ----------

interface HydrateOptions {
  userId: string;
  signal?: AbortSignal;
}

/**
 * Pull recent activity from canonical tables and shape it into
 * `AppNotification[]`. Used both on initial mount and on refresh.
 *
 * Sources (per spec):
 *   - conversations  → new_match (when conversation row appears)
 *                    + new_message (when last_message_at moves)
 *   - achievements   → badge_unlocked
 *   - mode_activations → mode_activated
 */
async function hydrateFromSupabase({
  userId,
}: HydrateOptions): Promise<AppNotification[]> {
  const out: AppNotification[] = [];

  // -------- conversations: matches + last message ----------
  try {
    const { data: convs } = await supabase
      .from("conversations")
      .select("id, user_a, user_b, mode, last_message_at, created_at")
      .or(`user_a.eq.${userId},user_b.eq.${userId}`)
      .order("created_at", { ascending: false })
      .limit(50);

    if (Array.isArray(convs) && convs.length) {
      const otherIds = Array.from(
        new Set(
          convs.map((c) => (c.user_a === userId ? c.user_b : c.user_a)),
        ),
      );

      const profileMap = new Map<string, string>();
      if (otherIds.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, name")
          .in("id", otherIds);
        for (const p of profs ?? []) {
          profileMap.set(p.id as string, (p.name as string) ?? "Quelqu'un");
        }
      }

      for (const c of convs) {
        const otherId = c.user_a === userId ? c.user_b : c.user_a;
        const name = profileMap.get(otherId as string) ?? "Quelqu'un";

        out.push({
          id: `conv-match-${c.id}`,
          type: "new_match",
          title: `Nouveau match avec ${name}`,
          body: c.mode
            ? `Mode ${modeLabel(c.mode as string)}`
            : "C'est un match !",
          timestamp: (c.created_at as string) ?? new Date().toISOString(),
          read: false,
          data: { conversationId: c.id, otherUserId: otherId, mode: c.mode },
        });

        // If last_message_at differs from created_at, surface a message notif too.
        if (
          c.last_message_at &&
          c.last_message_at !== c.created_at
        ) {
          out.push({
            id: `conv-msg-${c.id}`,
            type: "new_message",
            title: `${name} t'a envoyé un message`,
            body: "Ouvre la conversation pour répondre.",
            timestamp: c.last_message_at as string,
            read: false,
            data: { conversationId: c.id, otherUserId: otherId },
          });
        }
      }
    }
  } catch {
    // table absent / RLS denial — skip silently, hook still returns realtime data
  }

  // -------- achievements: badges ----------
  try {
    const { data: achievs } = await supabase
      .from("achievements")
      .select("id, achievement_key, earned_at")
      .eq("user_id", userId)
      .order("earned_at", { ascending: false })
      .limit(20);

    for (const a of achievs ?? []) {
      out.push({
        id: `achiev-${a.id}`,
        type: "badge_unlocked",
        title: `Badge débloqué : ${achievementLabel(a.achievement_key as string)}`,
        body: "Ouvre ton profil pour voir ta collection.",
        timestamp: (a.earned_at as string) ?? new Date().toISOString(),
        read: false,
        data: { achievementKey: a.achievement_key },
      });
    }
  } catch {
    // skip
  }

  // -------- mode_activations: mode events ----------
  try {
    const { data: modes } = await supabase
      .from("mode_activations")
      .select("id, mode, is_active, expires_at, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    for (const m of modes ?? []) {
      if (!m.is_active) continue;
      out.push({
        id: `mode-${m.id}`,
        type: "mode_activated",
        title: `Ton mode ${modeLabel(m.mode as string)} est actif`,
        body: m.expires_at
          ? `Expire le ${new Date(m.expires_at as string).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}`
          : "Profite-en pour rencontrer du monde.",
        timestamp: (m.created_at as string) ?? new Date().toISOString(),
        read: false,
        data: { mode: m.mode, modeActivationId: m.id },
      });
    }
  } catch {
    // skip
  }

  // Sort by timestamp desc, limit MAX_NOTIFICATIONS
  out.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
  return out.slice(0, MAX_NOTIFICATIONS);
}

// ---------- Hook ----------

export function useNotifications(userId: string | undefined) {
  // Realtime cache (persisted, mutated by realtime subscriptions)
  const [realtime, setRealtime] = useState<AppNotification[]>(() =>
    loadNotifications(),
  );
  // Hydrated cache (from Supabase tables)
  const [hydrated, setHydrated] = useState<AppNotification[]>([]);
  const [readSet, setReadSet] = useState<Set<string>>(() => loadReadState());
  const [loading, setLoading] = useState<boolean>(true);

  // Persist realtime cache
  useEffect(() => {
    saveNotifications(realtime);
  }, [realtime]);

  // Persist read state
  useEffect(() => {
    saveReadState(readSet);
  }, [readSet]);

  // ---------- Initial hydration + refresh handler ----------

  const hydrationToken = useRef(0);
  const refresh = useCallback(async (): Promise<void> => {
    if (!userId) {
      setHydrated([]);
      setLoading(false);
      return;
    }
    const my = ++hydrationToken.current;
    setLoading(true);
    try {
      const rows = await hydrateFromSupabase({ userId });
      // Discard if a newer refresh started in between.
      if (hydrationToken.current !== my) return;
      setHydrated(rows);
    } finally {
      if (hydrationToken.current === my) setLoading(false);
    }
  }, [userId]);

  // Run on mount + when userId changes.
  useEffect(() => {
    refresh();
  }, [refresh]);

  // ---------- Merge + read-state ----------

  // Realtime entries take precedence by id (they may have richer data).
  // Both lists are then sorted by timestamp desc, deduplicated, and capped.
  const mergedRaw: AppNotification[] = (() => {
    const byId = new Map<string, AppNotification>();
    for (const n of hydrated) byId.set(n.id, n);
    for (const n of realtime) byId.set(n.id, n); // overwrite if collision
    const list = Array.from(byId.values());
    list.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
    return list.slice(0, MAX_NOTIFICATIONS);
  })();

  // Apply read overlay (persisted across refresh / app restart).
  const notifications: AppNotification[] = mergedRaw.map((n) =>
    readSet.has(n.id) ? { ...n, read: true } : n,
  );

  // Derived: unread count
  const unreadCount = notifications.filter((n) => !n.read).length;

  // ---------- Mutators ----------

  const addNotification = useCallback(
    (notif: Omit<AppNotification, "id" | "timestamp" | "read">) => {
      const entry: AppNotification = {
        ...notif,
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: new Date().toISOString(),
        read: false,
      };

      setRealtime((prev) => {
        const next = [entry, ...prev];
        return next.slice(0, MAX_NOTIFICATIONS);
      });
    },
    [],
  );

  const markAsRead = useCallback((notifId: string) => {
    setRealtime((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, read: true } : n)),
    );
    setReadSet((prev) => {
      if (prev.has(notifId)) return prev;
      const next = new Set(prev);
      next.add(notifId);
      return next;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setRealtime((prev) => prev.map((n) => ({ ...n, read: true })));
    setReadSet((prev) => {
      const next = new Set(prev);
      for (const n of mergedRaw) next.add(n.id);
      return next;
    });
  }, [mergedRaw]);

  const clearAll = useCallback(() => {
    setRealtime([]);
    setHydrated([]);
  }, []);

  // ---------- Realtime subscriptions (unified cleanup via useRealtimeChannel) ----------

  // --- 1. Messages: new message in any conversation involving this user ---
  useRealtimeChannel(
    (client) =>
      userId
        ? client.channel(`notif-messages-${userId}`).on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "messages" },
            async (payload) => {
              const msg = payload.new as {
                id: string;
                conversation_id: string;
                sender_id: string;
                content: string;
                created_at: string;
              };

              if (msg.sender_id === userId) return;

              const { data: conv } = await supabase
                .from("conversations")
                .select("user_a, user_b")
                .eq("id", msg.conversation_id)
                .single();

              if (!conv) return;
              if (conv.user_a !== userId && conv.user_b !== userId) return;

              const { data: profile } = await supabase
                .from("profiles")
                .select("name")
                .eq("id", msg.sender_id)
                .single();

              const senderName = profile?.name ?? "Quelqu'un";
              const title = `${senderName} t'a envoyé un message`;
              const body =
                msg.content.length > 60 ? msg.content.slice(0, 57) + "..." : msg.content;

              addNotification({
                type: "new_message",
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
        : null,
    [userId, addNotification],
  );

  // --- 2. Interactions: someone liked / superliked us ---
  useRealtimeChannel(
    (client) =>
      userId
        ? client.channel(`notif-interactions-${userId}`).on(
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

              if (interaction.action !== "like" && interaction.action !== "superlike") return;

              const { data: profile } = await supabase
                .from("profiles")
                .select("name")
                .eq("id", interaction.from_user)
                .single();

              const likerName = profile?.name ?? "Quelqu'un";

              const { data: reverse } = await supabase
                .from("interactions")
                .select("id")
                .eq("from_user", userId)
                .eq("to_user", interaction.from_user)
                .in("action", ["like", "superlike"])
                .single();

              const isMutualMatch = !!reverse;

              if (isMutualMatch) {
                const title = `Nouveau match avec ${likerName}`;
                const body = "C'est un match ! Dis bonjour.";

                addNotification({
                  type: "new_match",
                  title,
                  body,
                  data: {
                    matchedUserId: interaction.from_user,
                    mode: interaction.mode,
                  },
                });

                playSound("match");
                emitToast(title, body);

                // Refresh hydrated cache so the new conversation row shows up
                // immediately (the trigger that creates it runs server-side).
                refresh();
              } else {
                const title = `${likerName} t'a liké !`;
                const body =
                  interaction.action === "superlike"
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
        : null,
    [userId, addNotification, refresh],
  );

  // --- 3. Achievements: badge unlocked ---
  useRealtimeChannel(
    (client) =>
      userId
        ? client.channel(`notif-achievements-${userId}`).on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "achievements",
              filter: `user_id=eq.${userId}`,
            },
            (payload) => {
              const a = payload.new as {
                id: string;
                achievement_key: string;
                earned_at: string;
              };
              const label = achievementLabel(a.achievement_key);
              const title = `Badge débloqué : ${label}`;
              const body = "Ouvre ton profil pour voir ta collection.";

              addNotification({
                type: "badge_unlocked",
                title,
                body,
                data: { achievementKey: a.achievement_key, achievementId: a.id },
              });

              playSound("notification");
              emitToast(title, body);
              refresh();
            },
          )
        : null,
    [userId, addNotification, refresh],
  );

  // --- 4. Feed activities: new activity from people nearby / in same mode ---
  useRealtimeChannel(
    (client) =>
      userId
        ? client.channel(`notif-feed-${userId}`).on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "feed_activities" },
            async (payload) => {
              const activity = payload.new as {
                id: string;
                user_id: string;
                type: string;
                content: string;
                mode: string | null;
                created_at: string;
              };

              if (activity.user_id === userId) return;

              const { data: profile } = await supabase
                .from("profiles")
                .select("name")
                .eq("id", activity.user_id)
                .single();

              const posterName = profile?.name ?? "Quelqu'un";
              const title = `${posterName} est actif${activity.mode ? ` en mode ${modeLabel(activity.mode)}` : ""}`;
              const body =
                activity.content.length > 60
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
        : null,
    [userId, addNotification],
  );

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    refresh,
  };
}
