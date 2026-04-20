"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
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
import PageHeader from "@/components/ui/PageHeader";
import { Heart, MessageCircle, Calendar, Star, Bell, X } from "@/components/ui/lucide";
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
  | "feed";

interface NotificationItem {
  id: string;
  type: ExtendedNotifType;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  data: Record<string, unknown>;
}

// ---------- Filter tabs ----------

type FilterTab = "all" | "matchs" | "messages" | "system";

const TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "Toutes" },
  { key: "matchs", label: "Matchs" },
  { key: "messages", label: "Messages" },
  { key: "system", label: "Systeme" },
];

function getFilterTypes(tab: FilterTab): ExtendedNotifType[] | null {
  switch (tab) {
    case "all":
      return null;
    case "matchs":
      return ["match", "like"];
    case "messages":
      return ["message"];
    case "system":
      return ["system", "challenge", "event", "review", "feed"];
  }
}

// ---------- Type config (icons + colors) ----------

interface TypeConfig {
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

// Per-notification-type icon + colors. Colors come from the domain-meta
// config in lib/notification-config.ts (see that file for the semantic
// rationale). Icons live here because they are JSX, not data.
function getTypeConfig(type: ExtendedNotifType): TypeConfig {
  const palette = NOTIFICATION_TYPE_COLORS[type];
  switch (type) {
    case "match":
      return { icon: <Heart size={18} fill="currentColor" strokeWidth={0} />, ...palette };
    case "like":
      return { icon: <Heart size={18} fill="currentColor" strokeWidth={0} />, ...palette };
    case "message":
      return { icon: <MessageCircle size={18} />, ...palette };
    case "event":
      return { icon: <Calendar size={18} />, ...palette };
    case "challenge":
      return { icon: <Star size={18} fill="currentColor" strokeWidth={0} />, ...palette };
    case "review":
      return { icon: <Star size={18} fill="currentColor" strokeWidth={0} />, ...palette };
    case "system":
    case "feed":
    default:
      return { icon: <Bell size={18} />, ...palette };
  }
}

// ---------- Mock data ----------

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

  if (diffMin < 1) return "a l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `il y a ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  return `il y a ${diffD}j`;
}

// ---------- Navigation resolver ----------

function getNotifRoute(notif: NotificationItem): string {
  switch (notif.type) {
    case "match":
      return `/browse`;
    case "like":
      return `/browse`;
    case "message":
      return notif.data.conversationId
        ? `/chat/${notif.data.conversationId}`
        : `/chat`;
    case "event":
      return `/plans`;
    case "challenge":
      return `/progress`;
    case "review":
      return `/profile`;
    case "system":
    case "feed":
    default:
      return `/feed`;
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
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mt-0.5"
          style={{ backgroundColor: config.bgColor, color: config.color }}
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

// ---------- Empty state ----------

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springs.gentle}
      className="flex flex-col items-center justify-center py-24 px-8"
    >
      <motion.div
        animate={{
          y: [0, -8, 0, 5, 0],
          rotate: [0, 2, 0, -2, 0],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="mb-6"
      >
        <div className="w-20 h-20 rounded-full bg-border/30 flex items-center justify-center">
          <Bell size={36} strokeWidth={1.5} className="text-text-muted/40" />
        </div>
      </motion.div>
      <p className="text-[17px] font-bold text-text-muted mb-1">Aucune notification</p>
      <p className="text-[13px] text-text-muted/60 text-center">
        Tes matchs, messages et activites apparaitront ici
      </p>
    </motion.div>
  );
}

// ---------- Main page ----------

export default function NotificationsPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Real notifications hook.
  const realNotifs = useNotifications(user?.id);

  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  // Normalize real notifications into view shape.
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
      router.push(getNotifRoute(notif));
    },
    [router],
  );

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
          <div className="flex gap-1 p-1 rounded-xl bg-bg-card border border-border">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="relative flex-1 py-2 text-[13px] font-semibold text-center rounded-lg transition-colors"
              >
                {activeTab === tab.key && (
                  <motion.div
                    layoutId="notif-tab-indicator"
                    className="absolute inset-0 rounded-lg bg-accent/10 border border-accent/20"
                    transition={springs.snap}
                  />
                )}
                <span
                  className={`relative z-10 ${
                    activeTab === tab.key ? "text-accent" : "text-text-muted"
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            ))}
          </div>
        }
      />

      {/* Notification list */}
      {filtered.length === 0 ? (
        <EmptyState />
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
    </div>
  );
}
