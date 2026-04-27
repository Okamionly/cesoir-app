"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { m, AnimatePresence, type Transition } from "motion/react";
import { IconSearch, IconMap, IconChat, IconMoon, IconUser } from "@/components/ui/Icons";
import { Bell } from "@/components/ui/lucide";
import { springs } from "@/lib/motion-design";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/lib/useNotifications";

/**
 * TopNav — desktop-only top navigation (md+).
 *
 * Counterpart to BottomNav (mobile-only, md:hidden). Added 2026-04-19
 * after user report "plus de UI de navigation sur le navigateur" — the
 * Sprint 5 md:hidden on BottomNav was correct but left desktop with no
 * nav at all. This component fills that gap.
 *
 * Wave 16 (2026-04-27): adds a bell icon at the right edge linking to
 * `/notifications`, with an unread count badge sourced from the
 * `useNotifications` hook.
 */

type TabKey = "feed" | "map" | "chat" | "modes" | "profile";

const tabs: {
  href: `/${TabKey}`;
  key: TabKey;
  Icon: typeof IconSearch;
  label: string;
}[] = [
  { href: "/feed", key: "feed", Icon: IconSearch, label: "Explorer" },
  { href: "/map", key: "map", Icon: IconMap, label: "Carte" },
  { href: "/chat", key: "chat", Icon: IconChat, label: "Chat" },
  { href: "/modes", key: "modes", Icon: IconMoon, label: "Modes" },
  { href: "/profile", key: "profile", Icon: IconUser, label: "Profil" },
];

function DotBadge({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <span className="absolute -top-1 -right-1 w-3 h-3 flex items-center justify-center pointer-events-none" aria-hidden="true">
          <m.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={springs.micro as Transition}
            className="w-1.5 h-1.5 rounded-full bg-red-500"
            role="status"
            aria-label="Notification"
          />
        </span>
      )}
    </AnimatePresence>
  );
}

/**
 * Bell with a numeric badge (unreadCount). Renders nothing extra when
 * count is 0. Caps display at "9+" so layout stays stable.
 */
function NotifBellBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  const label = count > 9 ? "9+" : String(count);
  return (
    <m.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      transition={springs.micro as Transition}
      className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full text-[9px] font-bold text-white bg-red-500"
      role="status"
      aria-label={`${count} notifications non lues`}
    >
      {label}
    </m.span>
  );
}

interface TopNavProps {
  chatUnread?: number;
  newMatches?: number;
  dailyChallengeAvailable?: boolean;
}

export default function TopNav({
  chatUnread = 0,
  newMatches = 0,
  dailyChallengeAvailable = false,
}: TopNavProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  // Pull notification unread count for the bell badge.
  // Safe even if AuthContext returns null user — hook handles undefined id.
  const { unreadCount } = useNotifications(user?.id);

  // Try to pull badge data with fallback
  let chatCount = chatUnread;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useConversations } = require("@/lib/useConversations") as {
      useConversations: () => { totalUnread: number };
    };
    const { totalUnread } = useConversations();
    chatCount = totalUnread;
  } catch {
    // Context not available
  }

  const badges: Record<TabKey, boolean> = {
    feed: newMatches > 0,
    map: false,
    chat: chatCount > 0,
    modes: dailyChallengeAvailable,
    profile: false,
  };

  const notifActive = pathname?.startsWith("/notifications");

  return (
    <nav
      aria-label="Navigation principale"
      className="hidden md:flex fixed top-0 left-0 right-0 z-50 h-14 items-center justify-center backdrop-blur-xl bg-bg/70 border-b border-border"
    >
      <div className="flex items-center gap-1 px-4 max-w-5xl w-full mx-auto">
        {/* Brand */}
        <Link
          href="/feed"
          className="flex items-center gap-2 mr-auto tap-target focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none rounded-lg"
          aria-label="CeSoir — Accueil"
        >
          <span className="text-accent text-lg" aria-hidden="true">☾</span>
          <span className="text-[15px] font-bold tracking-tight text-text">CeSoir</span>
        </Link>

        {/* Tabs */}
        <div className="flex items-center gap-1">
          {tabs.map((tab) => {
            const active = pathname?.startsWith(tab.href);
            const hasBadge = badges[tab.key];

            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex items-center gap-2 px-3 py-2 rounded-full tap-target transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
                  active
                    ? "bg-accent/10 text-accent"
                    : "text-text-muted hover:text-text hover:bg-bg-card"
                }`}
              >
                <m.span className="relative" whileTap={{ scale: 0.92 }} transition={springs.micro as Transition}>
                  <tab.Icon size={18} />
                  {hasBadge && <DotBadge visible />}
                </m.span>
                <span className="text-[13px] font-semibold tracking-tight">
                  {tab.label}
                </span>
              </Link>
            );
          })}

          {/* Notifications bell — separated from main tabs so it reads as a
              utility action rather than a primary destination. */}
          <Link
            href="/notifications"
            aria-current={notifActive ? "page" : undefined}
            aria-label={
              unreadCount > 0
                ? `Notifications (${unreadCount} non lues)`
                : "Notifications"
            }
            className={`relative ml-2 flex items-center justify-center w-9 h-9 rounded-full tap-target transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
              notifActive
                ? "bg-accent/10 text-accent"
                : "text-text-muted hover:text-text hover:bg-bg-card"
            }`}
          >
            <m.span
              className="relative"
              whileTap={{ scale: 0.92 }}
              transition={springs.micro as Transition}
            >
              <Bell size={18} />
              <NotifBellBadge count={unreadCount} />
            </m.span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
