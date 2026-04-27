"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  type PanInfo,
} from "motion/react";
import { springs, micro } from "@/lib/motion-design";
import { useAuth } from "@/context/AuthContext";
import { useNotifications, type AppNotification } from "@/lib/useNotifications";
import { Magnetic } from "@/components/motion/Magnetic";
import { PullToRefresh } from "@/components/ui/PullToRefresh";
import { SkeletonList } from "@/components/ui/skeletons";
import EmptyStateShared from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import { X } from "@/components/ui/lucide";
import { NOTIFICATION_TYPE_COLORS } from "@/lib/notification-config";

// ---------- Extended notification types ----------

type ExtendedNotifType =
  | "match"
  | "like"
  | "message"
  | "event"
  | "challenge"
  | "system"
  | "review"
  | "feed"
  | "new_match"
  | "new_message"
  | "mode_activated"
  | "badge_unlocked"
  | "level_up";

interface NotificationItem {
  id: string;
  type: ExtendedNotifType;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  data: Record<string, unknown>;
}

// ---------- Filter tabs (segmented control, NOT scrollable) ----------

type FilterTab = "all" | "matchs" | "messages" | "system";

const TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "Tout" },
  { key: "matchs", label: "Matchs" },
  { key: "messages", label: "Messages" },
  { key: "system", label: "Système" },
];

function getFilterTypes(tab: FilterTab): ExtendedNotifType[] | null {
  switch (tab) {
    case "all":
      return null;
    case "matchs":
      return ["match", "new_match", "like"];
    case "messages":
      return ["message", "new_message"];
    case "system":
      return [
        "system",
        "challenge",
        "event",
        "review",
        "feed",
        "mode_activated",
        "badge_unlocked",
        "level_up",
      ];
  }
}

// ---------- Type config (icons + colors) ----------

interface TypeConfig {
  icon: string;
  color: string;
  bgColor: string;
}

/**
 * Per-notification-type icon (emoji per spec) + colors.
 * Colors come from the domain-meta config in lib/notification-config.ts.
 */
function getTypeConfig(type: ExtendedNotifType): TypeConfig {
  const palette = NOTIFICATION_TYPE_COLORS[type];
  switch (type) {
    case "match":
    case "new_match":
      return { icon: "\u{1F49C}", ...palette }; // 💜
    case "like":
      return { icon: "\u{1F49C}", ...palette }; // 💜
    case "message":
    case "new_message":
      return { icon: "\u{1F4AC}", ...palette }; // 💬
    case "mode_activated":
      return { icon: "✨", ...palette }; // ✨
    case "badge_unlocked":
      return { icon: "\u{1F3C6}", ...palette }; // 🏆
    case "level_up":
      return { icon: "\u{1F389}", ...palette }; // 🎉
    case "event":
      return { icon: "\u{1F4C5}", ...palette }; // 📅
    case "challenge":
      return { icon: "⭐", ...palette }; // ⭐
    case "review":
      return { icon: "\u{1F31F}", ...palette }; // 🌟
    case "feed":
      return { icon: "\u{1F4F0}", ...palette }; // 📰
    case "system":
    default:
      return { icon: "☾", ...palette }; // ☾
  }
}

// ---------- Date grouping ----------

type DayGroup = "today" | "yesterday" | "week";

const DAY_LABELS: Record<DayGroup, string> = {
  today: "Aujourd'hui",
  yesterday: "Hier",
  week: "Cette semaine",
};

function getDayGroup(timestamp: string): DayGroup {
  const d = new Date(timestamp);
  const n = new Date();

  const startOfToday = new Date(n.getFullYear(), n.getMonth(), n.getDate());
  const startOfYesterday = new Date(startOfToday.getTime() - 86400000);

  if (d >= startOfToday) return "today";
  if (d >= startOfYesterday) return "yesterday";
  return "week";
}

function groupByDay(notifs: NotificationItem[]): [DayGroup, NotificationItem[]][] {
  const groups: Map<DayGroup, NotificationItem[]> = new Map();

  for (const n of notifs) {
    const group = getDayGroup(n.timestamp);
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push(n);
  }

  const order: DayGroup[] = ["today", "yesterday", "week"];
  return order.filter((g) => groups.has(g)).map((g) => [g, groups.get(g)!]);
}

// ---------- Relative time ----------

function formatRelative(timestamp: string): string {
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `il y a ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `il y a ${diffD}j`;
  return new Date(timestamp).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

// ---------- Navigation resolver ----------

function getNotifRoute(notif: NotificationItem): string {
  const convId = notif.data.conversationId as string | undefined;

  switch (notif.type) {
    case "match":
    case "new_match":
      return convId ? `/chat/${convId}` : "/matches";
    case "like":
      return "/browse";
    case "message":
    case "new_message":
      return convId ? `/chat/${convId}` : "/chat";
    case "event":
      return "/plans";
    case "challenge":
      return "/progress";
    case "review":
      return "/profile";
    case "mode_activated":
      return "/modes";
    case "badge_unlocked":
      return "/progress";
    case "level_up":
      return "/progress";
    case "system":
    case "feed":
    default:
      return "/feed";
  }
}

// ---------- SwipeableNotification ----------

function SwipeableNotification({
  notif,
  index,
  onDismiss,
  onTap,
  onMarkRead,
  allRead,
}: {
  notif: NotificationItem;
  index: number;
  onDismiss: (id: string) => void;
  onTap: (notif: NotificationItem) => void;
  onMarkRead: (id: string) => void;
  allRead: boolean;
}) {
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-200, -100, 0], [0, 0.5, 1]);
  const config = getTypeConfig(notif.type);

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (info.offset.x < -100) {
        onDismiss(notif.id);
      }
    },
    [notif.id, onDismiss],
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: -40, filter: "blur(4px)" }}
      animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
      exit={{ x: -300, opacity: 0, transition: springs.rubber }}
      transition={{ ...springs.heavy, delay: index * 0.04 }}
      layout
    >
      <motion.button
        className="w-full flex items-start gap-3 px-5 py-3.5 text-left relative group"
        style={{ x, opacity }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.4}
        onDragEnd={handleDragEnd}
        onClick={() => {
          if (!notif.read) onMarkRead(notif.id);
          onTap(notif);
        }}
        whileTap={micro.tapScale}
      >
        {/* Icon */}
        <div
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mt-0.5 text-[18px]"
          style={{ backgroundColor: config.bgColor, color: config.color }}
          aria-hidden="true"
        >
          {config.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p
              className={`text-[14px] leading-tight truncate ${
                notif.read
                  ? "font-semibold text-text-muted"
                  : "font-bold text-text"
              }`}
            >
              {notif.title}
            </p>
          </div>
          <p className="text-[13px] text-text-muted leading-snug mt-0.5 line-clamp-2">
            {notif.body}
          </p>
          <p className="text-[11px] text-text-muted/60 mt-1">
            {formatRelative(notif.timestamp)}
          </p>
        </div>

        {/* Unread dot */}
        <div className="flex-shrink-0 flex items-center h-10 mt-0.5">
          <AnimatePresence>
            {!notif.read && !allRead && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={springs.elastic}
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: config.color }}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Dismiss hint on hover */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-40 transition-opacity">
          <X size={16} />
        </div>
      </motion.button>
    </motion.div>
  );
}

// ---------- Empty state (per tab) ----------

const EMPTY_COPY: Record<FilterTab, { title: string; body: string; icon: string }> = {
  all: {
    title: "Aucune notification",
    body: "Tes matchs, messages et activités apparaîtront ici",
    icon: "☾", // ☾
  },
  matchs: {
    title: "Pas encore de match",
    body: "Continue à explorer — un match peut tomber à tout moment",
    icon: "\u{1F49C}", // 💜
  },
  messages: {
    title: "Pas de message",
    body: "Tes conversations s'afficheront ici dès qu'une discussion démarre",
    icon: "\u{1F4AC}", // 💬
  },
  system: {
    title: "Tout est calme",
    body: "Tes badges, modes et événements système apparaîtront ici",
    icon: "✨", // ✨
  },
};

function EmptyState({ tab }: { tab: FilterTab }) {
  const copy = EMPTY_COPY[tab];
  // Use the shared EmptyState component but render the icon as a soft
  // disc to keep the notifications-specific visual rhythm. Float + a11y
  // are handled inside the shared component.
  const iconNode = (
    <div
      className="w-20 h-20 rounded-full bg-border/30 flex items-center justify-center text-[36px]"
      aria-hidden="true"
    >
      {copy.icon}
    </div>
  );
  return (
    <EmptyStateShared
      icon={iconNode}
      title={copy.title}
      subtitle={copy.body}
      ariaLive="polite"
    />
  );
}

// ---------- Loading skeleton ----------

function NotificationsSkeleton() {
  return (
    <div className="px-5 pt-4 pb-8">
      <SkeletonList count={6} itemHeight={72} />
    </div>
  );
}

// ---------- Main page ----------

export default function NotificationsPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Real notifications hook (Supabase + realtime + read-state).
  const realNotifs = useNotifications(user?.id);

  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  // Normalize hook entries into the page view shape.
  const notifications: NotificationItem[] = useMemo(() => {
    return realNotifs.notifications.map((n: AppNotification) => ({
      ...n,
      type: n.type as ExtendedNotifType,
    }));
  }, [realNotifs.notifications]);

  // Filter by tab + dismissed
  const filtered = useMemo(() => {
    const types = getFilterTypes(activeTab);
    return notifications
      .filter((n) => !dismissed.has(n.id))
      .filter((n) => (types ? types.includes(n.type) : true));
  }, [notifications, activeTab, dismissed]);

  // Group by day
  const grouped = useMemo(() => groupByDay(filtered), [filtered]);

  // Unread count
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read && !dismissed.has(n.id)).length,
    [notifications, dismissed],
  );

  // Handlers
  const handleMarkAllRead = useCallback(() => {
    realNotifs.markAllAsRead();
  }, [realNotifs]);

  const handleMarkRead = useCallback(
    (id: string) => {
      realNotifs.markAsRead(id);
    },
    [realNotifs],
  );

  const handleDismiss = useCallback((id: string) => {
    setDismissed((prev) => new Set(prev).add(id));
  }, []);

  const handleTap = useCallback(
    (notif: NotificationItem) => {
      router.push(getNotifRoute(notif) as Route);
    },
    [router],
  );

  // Pull-to-refresh handler
  const handleRefresh = useCallback(async () => {
    await realNotifs.refresh();
  }, [realNotifs]);

  // Running index for stagger across groups
  let runningIndex = 0;

  return (
    <div className="min-h-screen bg-bg max-w-lg mx-auto pb-safe">
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            Notifications
            <AnimatePresence>
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={springs.elastic}
                  className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full text-[11px] font-bold text-white"
                  style={{ backgroundColor: "var(--color-accent)" }}
                >
                  {unreadCount}
                </motion.span>
              )}
            </AnimatePresence>
          </span>
        }
        titleClassName="text-[22px] font-black font-display"
        actions={
          unreadCount > 0 ? (
            <Magnetic strength={0.18} radius={70}>
              <motion.button
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={springs.snap}
                onClick={handleMarkAllRead}
                whileTap={micro.tapScale}
                whileHover={{ color: "var(--color-accent)", transition: springs.gentle }}
                className="text-[13px] font-semibold text-accent whitespace-nowrap"
              >
                <span className="hidden sm:inline">Tout marquer comme lu</span>
                <span className="sm:hidden">Tout marquer</span>
              </motion.button>
            </Magnetic>
          ) : undefined
        }
        slotBelowTitle={
          // Segmented control (NOT a scrollable tab bar) — fixed 4 slots.
          <div
            className="flex gap-1 p-1 rounded-xl bg-bg-card border border-border"
            role="tablist"
            aria-label="Filtrer les notifications"
          >
            {TABS.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTab(tab.key)}
                  className="relative flex-1 py-2 text-[13px] font-semibold text-center rounded-lg transition-colors min-w-0"
                >
                  {active && (
                    <motion.div
                      layoutId="notif-tab-indicator"
                      className="absolute inset-0 rounded-lg bg-accent/10 border border-accent/20"
                      transition={springs.snap}
                    />
                  )}
                  <span
                    className={`relative z-10 truncate block ${
                      active ? "text-accent" : "text-text-muted"
                    }`}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        }
      />

      {/* Body — pull-to-refresh wraps the list area */}
      <PullToRefresh onRefresh={handleRefresh}>
        {realNotifs.loading && notifications.length === 0 ? (
          <NotificationsSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState tab={activeTab} />
        ) : (
          <div className="pb-8">
            {grouped.map(([group, items], groupIndex) => {
              const header = (
                <motion.div
                  key={`header-${group}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: groupIndex * 0.1 }}
                  className="px-5 pt-4 pb-2"
                >
                  <p className="text-[12px] font-bold text-text-muted/60 uppercase tracking-wider">
                    {DAY_LABELS[group]}
                  </p>
                </motion.div>
              );

              const notifElements = items.map((notif) => {
                const idx = runningIndex++;
                return (
                  <SwipeableNotification
                    key={notif.id}
                    notif={notif}
                    index={idx}
                    onDismiss={handleDismiss}
                    onTap={handleTap}
                    onMarkRead={handleMarkRead}
                    allRead={false}
                  />
                );
              });

              return (
                <div key={group}>
                  {header}
                  <AnimatePresence mode="popLayout">
                    {notifElements}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </PullToRefresh>
    </div>
  );
}
