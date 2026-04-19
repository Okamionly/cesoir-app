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
import { springs, micro, easings } from "@/lib/motion-design";
import { useAuth } from "@/context/AuthContext";
import { useNotifications, type AppNotification } from "@/lib/useNotifications";
import { Magnetic } from "@/components/motion/Magnetic";

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

function getTypeConfig(type: ExtendedNotifType): TypeConfig {
  switch (type) {
    case "match":
      return {
        icon: (
          <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        ),
        color: "#8B5CF6",
        bgColor: "rgba(139,92,246,0.12)",
      };
    case "like":
      return {
        icon: (
          <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        ),
        color: "#EC4899",
        bgColor: "rgba(236,72,153,0.12)",
      };
    case "message":
      return {
        icon: (
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
        ),
        color: "#3B82F6",
        bgColor: "rgba(59,130,246,0.12)",
      };
    case "event":
      return {
        icon: (
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <rect x={3} y={4} width={18} height={18} rx={2} ry={2} />
            <line x1={16} y1={2} x2={16} y2={6} />
            <line x1={8} y1={2} x2={8} y2={6} />
            <line x1={3} y1={10} x2={21} y2={10} />
          </svg>
        ),
        color: "#F59E0B",
        bgColor: "rgba(245,158,11,0.12)",
      };
    case "challenge":
      return {
        icon: (
          <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor">
            <path d="M5 3h14l-1.5 5H6.5L5 3zM12 15a3 3 0 100-6 3 3 0 000 6zm-7 6v-2c0-1.1.9-2 2-2h10a2 2 0 012 2v2H5z" />
          </svg>
        ),
        color: "#00FF88",
        bgColor: "rgba(0,255,136,0.12)",
      };
    case "review":
      return {
        icon: (
          <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ),
        color: "#FBBF24",
        bgColor: "rgba(251,191,36,0.12)",
      };
    case "system":
    case "feed":
    default:
      return {
        icon: (
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
          </svg>
        ),
        color: "#6B7280",
        bgColor: "rgba(107,114,128,0.12)",
      };
  }
}

// ---------- Mock data ----------

function photo(gender: "women" | "men", id: number): string {
  return `https://randomuser.me/api/portraits/${gender}/${id}.jpg`;
}

const now = Date.now();

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  // Today
  { id: "n1", type: "match", title: "Match avec Sarah !", body: "Vous vous plaisez mutuellement. Dites bonjour !", timestamp: new Date(now - 12 * 60 * 1000).toISOString(), read: false, data: { matchedUserId: "u1", photo: photo("women", 90) } },
  { id: "n2", type: "message", title: "Nouveau message de Claire", body: "Rex est trop content ! A tout a l'heure au parc", timestamp: new Date(now - 35 * 60 * 1000).toISOString(), read: false, data: { conversationId: "c2", photo: photo("women", 67) } },
  { id: "n3", type: "like", title: "Marta t'a like", body: "Tu lui plais. Swipe pour voir !", timestamp: new Date(now - 2 * 3600 * 1000).toISOString(), read: false, data: { likerId: "u3", photo: photo("women", 42) } },
  { id: "n4", type: "challenge", title: "Defi complete ! +50 XP", body: "Tu as complete le defi 'Premier Message'", timestamp: new Date(now - 3 * 3600 * 1000).toISOString(), read: true, data: {} },
  { id: "n5", type: "event", title: "Thomas organise Soiree Ciné", body: "Ce soir a 20h au MK2 Bastille, 4 places restantes", timestamp: new Date(now - 4 * 3600 * 1000).toISOString(), read: false, data: { eventId: "e1", photo: photo("men", 75) } },

  // Yesterday
  { id: "n6", type: "message", title: "Nouveau message de Lucas", body: "On se retrouve devant l'entree principale ?", timestamp: new Date(now - 26 * 3600 * 1000).toISOString(), read: true, data: { conversationId: "c3", photo: photo("men", 24) } },
  { id: "n7", type: "match", title: "Match avec Ines !", body: "Vous adorez tous les deux les balades avec chien", timestamp: new Date(now - 28 * 3600 * 1000).toISOString(), read: true, data: { matchedUserId: "u5", photo: photo("women", 52) } },
  { id: "n8", type: "system", title: "Profil verifie", body: "Ta verification par selfie est validee. Bravo !", timestamp: new Date(now - 30 * 3600 * 1000).toISOString(), read: true, data: {} },
  { id: "n9", type: "like", title: "Hugo t'a like", body: "Un superlike ! Tu lui plais vraiment.", timestamp: new Date(now - 32 * 3600 * 1000).toISOString(), read: true, data: { likerId: "u6", photo: photo("men", 41) } },
  { id: "n10", type: "review", title: "Nouvel avis de Marie", body: "Marie t'a laisse 5 etoiles. Superbe soiree !", timestamp: new Date(now - 36 * 3600 * 1000).toISOString(), read: true, data: { reviewerId: "u7", photo: photo("women", 90) } },

  // This week
  { id: "n11", type: "challenge", title: "Defi complete ! +100 XP", body: "Tu as complete le defi 'Globe-Trotter' : 5 modes", timestamp: new Date(now - 3 * 24 * 3600 * 1000).toISOString(), read: true, data: {} },
  { id: "n12", type: "match", title: "Match avec Priya !", body: "Un match en mode Foodie Quest. Bon appetit !", timestamp: new Date(now - 3 * 24 * 3600 * 1000).toISOString(), read: true, data: { matchedUserId: "u8", photo: photo("women", 64) } },
  { id: "n13", type: "event", title: "Lea organise Yoga Session", body: "Samedi 10h au Jardin du Luxembourg", timestamp: new Date(now - 4 * 24 * 3600 * 1000).toISOString(), read: true, data: { eventId: "e2", photo: photo("women", 42) } },
  { id: "n14", type: "system", title: "Bienvenue sur CeSoir !", body: "Ton aventure commence. Explore les 14 modes !", timestamp: new Date(now - 5 * 24 * 3600 * 1000).toISOString(), read: true, data: {} },
  { id: "n15", type: "message", title: "Nouveau message de Axel", body: "J'ai reserve l'escape game pour samedi !", timestamp: new Date(now - 4 * 24 * 3600 * 1000).toISOString(), read: true, data: { conversationId: "c5", photo: photo("men", 39) } },
  { id: "n16", type: "like", title: "Chloe t'a like", body: "Tu lui plais. Swipe pour voir !", timestamp: new Date(now - 5 * 24 * 3600 * 1000).toISOString(), read: true, data: { likerId: "u10", photo: photo("women", 67) } },
  { id: "n17", type: "match", title: "Match avec Jules !", body: "Vous etes tous les deux en mode Gamer Night", timestamp: new Date(now - 5 * 24 * 3600 * 1000).toISOString(), read: true, data: { matchedUserId: "u11", photo: photo("men", 33) } },
  { id: "n18", type: "review", title: "Nouvel avis de Thomas", body: "Thomas t'a laisse 4 etoiles. Belle soiree !", timestamp: new Date(now - 6 * 24 * 3600 * 1000).toISOString(), read: true, data: { reviewerId: "u4", photo: photo("men", 75) } },
  { id: "n19", type: "challenge", title: "Defi complete ! +80 XP", body: "100 messages envoyes. Tu es un vrai bavard !", timestamp: new Date(now - 6 * 24 * 3600 * 1000).toISOString(), read: true, data: {} },
  { id: "n20", type: "system", title: "Mise a jour disponible", body: "Decouvre les nouveaux modes et fonctionnalites", timestamp: new Date(now - 6 * 24 * 3600 * 1000).toISOString(), read: true, data: {} },
];

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
      return `/flash-plans`;
    case "challenge":
      return `/achievements`;
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
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <line x1={18} y1={6} x2={6} y2={18} />
            <line x1={6} y1={6} x2={18} y2={18} />
          </svg>
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
          <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="text-text-muted/40">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
          </svg>
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

  // Try real hook, fall back to mock
  const realNotifs = useNotifications(user?.id);
  const hasRealData = realNotifs.notifications.length > 0;

  // Local state for mock data management
  const [mockNotifs, setMockNotifs] = useState<NotificationItem[]>(MOCK_NOTIFICATIONS);
  const [mockAllRead, setMockAllRead] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  // Merge real + mock into unified list
  const notifications: NotificationItem[] = useMemo(() => {
    if (hasRealData) {
      return realNotifs.notifications.map((n: AppNotification) => ({
        ...n,
        type: n.type as ExtendedNotifType,
      }));
    }
    return mockNotifs.map((n) => ({
      ...n,
      read: mockAllRead ? true : n.read,
    }));
  }, [hasRealData, realNotifs.notifications, mockNotifs, mockAllRead]);

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
    if (hasRealData) {
      realNotifs.markAllAsRead();
    } else {
      setMockAllRead(true);
    }
  }, [hasRealData, realNotifs]);

  const handleMarkRead = useCallback(
    (id: string) => {
      if (hasRealData) {
        realNotifs.markAsRead(id);
      } else {
        setMockNotifs((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
        );
      }
    },
    [hasRealData, realNotifs],
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
      {/* Header */}
      <header className="px-5 pt-6 pb-4">
        <motion.div
          className="flex items-center justify-between gap-2 flex-wrap"
          initial={{ opacity: 0, y: -8, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.5, ease: easings.out }}
        >
          <div className="flex items-center gap-3">
            <h1 className="text-[22px] font-black text-text font-display">
              Notifications
            </h1>
            <AnimatePresence>
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={springs.elastic}
                  className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full text-[11px] font-bold text-white"
                  style={{ backgroundColor: "#8B5CF6" }}
                >
                  {unreadCount}
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {unreadCount > 0 && (
            <Magnetic strength={0.18} radius={70}>
              <motion.button
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={springs.snap}
                onClick={handleMarkAllRead}
                whileTap={micro.tapScale}
                whileHover={{ color: "#8B5CF6", transition: springs.gentle }}
                className="text-[13px] font-semibold text-accent whitespace-nowrap"
              >
                <span className="hidden sm:inline">Tout marquer comme lu</span>
                <span className="sm:hidden">Tout marquer</span>
              </motion.button>
            </Magnetic>
          )}
        </motion.div>
      </header>

      {/* Filter tabs */}
      <div className="px-5 mb-4">
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
      </div>

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
                  allRead={mockAllRead && !hasRealData}
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
