"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence, type Transition } from "motion/react";
import { IconSearch, IconMap, IconChat, IconMoon, IconUser } from "@/components/ui/Icons";
import { springs } from "@/lib/motion-design";
import { playSound } from "@/lib/sounds";

// ---------- Badge data hooks (safe imports) ----------

/**
 * Tries to pull badge data from hooks/localStorage.
 * Falls back gracefully — badges stay at 0 if context isn't available.
 */
function useSafeBadgeData(): {
  chatUnread: number;
  newMatches: number;
  dailyChallengeAvailable: boolean;
} {
  const [dailyChallengeAvailable, setDailyChallengeAvailable] = useState(false);

  // Try calling useConversations for totalUnread.
  // Wrapped in try/catch because the AuthContext it depends on may not be mounted.
  let chatUnread = 0;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useConversations } = require("@/lib/useConversations") as {
      useConversations: () => { totalUnread: number };
    };
    const { totalUnread } = useConversations();
    chatUnread = totalUnread;
  } catch {
    // Context not available — stays at 0
  }

  // Try calling useSmartQueue for remaining matches.
  let newMatches = 0;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useSmartQueue } = require("@/lib/useSmartQueue") as {
      useSmartQueue: () => { remaining: number };
    };
    const { remaining } = useSmartQueue();
    newMatches = remaining;
  } catch {
    // Context not available — stays at 0
  }

  // Daily challenge: check localStorage for today's completion
  useEffect(() => {
    try {
      const lastChallengeDate = localStorage.getItem("cesoir_last_challenge_date");
      const today = new Date().toISOString().slice(0, 10);
      if (lastChallengeDate !== today) {
        setDailyChallengeAvailable(true);
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  return { chatUnread, newMatches, dailyChallengeAvailable };
}

// ---------- Tab configuration ----------

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

// ---------- Badge sub-components ----------

/** Red numbered badge (chat unread, new matches) */
function CountBadge({ count }: { count: number }) {
  return (
    <AnimatePresence mode="wait">
      {count > 0 && (
        <motion.span
          key={count}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={springs.elastic as Transition}
          className="absolute -top-1.5 -right-2.5 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full gradient-bg text-[9px] font-bold text-white pointer-events-none"
          aria-label={`${count} non lus`}
        >
          {count > 99 ? "99+" : count}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

/** Green dot badge (daily challenge) */
function DotBadge({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{
            scale: 1,
            boxShadow: [
              "0 0 0px rgba(0,255,136,0.4)",
              "0 0 8px rgba(0,255,136,0.6)",
              "0 0 0px rgba(0,255,136,0.4)",
            ],
          }}
          exit={{ scale: 0 }}
          transition={{
            scale: springs.elastic as Transition,
            boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" },
          }}
          className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#00FF88] pointer-events-none"
          aria-label="Défi quotidien disponible"
        />
      )}
    </AnimatePresence>
  );
}

// ---------- Main component ----------

interface BottomNavProps {
  chatBadgeCount?: number;
  newMatchCount?: number;
  dailyChallengeReady?: boolean;
}

export default function BottomNav({
  chatBadgeCount,
  newMatchCount,
  dailyChallengeReady,
}: BottomNavProps) {
  const pathname = usePathname();
  const prevBadgesRef = useRef<Record<TabKey, number>>({
    feed: 0,
    map: 0,
    chat: 0,
    modes: 0,
    profile: 0,
  });
  const hasInitRef = useRef(false);

  // Internal badge data (fallback if props not provided)
  const internal = useSafeBadgeData();

  // Resolve badge values: props override internal state
  const chatCount = chatBadgeCount ?? internal.chatUnread;
  const matchCount = newMatchCount ?? internal.newMatches;
  const challengeAvailable = dailyChallengeReady ?? internal.dailyChallengeAvailable;

  // Build badge map
  const badges: Record<TabKey, number> = {
    feed: matchCount,
    map: 0,
    chat: chatCount,
    modes: challengeAvailable ? 1 : 0,
    profile: 0,
  };

  // Play notification sound when a new badge appears (only after initial render)
  useEffect(() => {
    if (!hasInitRef.current) {
      // Store initial values without playing sound
      hasInitRef.current = true;
      prevBadgesRef.current = { ...badges };
      return;
    }

    for (const key of Object.keys(badges) as TabKey[]) {
      const prev = prevBadgesRef.current[key];
      const curr = badges[key];
      // Badge appeared where there was none before
      if (prev === 0 && curr > 0) {
        playSound("notification");
        break; // Only play once per render
      }
    }

    prevBadgesRef.current = { ...badges };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatCount, matchCount, challengeAvailable]);

  // Haptic tap handler
  const handleTap = useCallback(() => {
    playSound("tap");
    // Trigger haptic feedback on supported devices
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(10);
    }
  }, []);

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* Gradient border-top line */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px]"
        style={{ background: "linear-gradient(90deg, #8B5CF6, #00FF88)" }}
        aria-hidden="true"
      />

      {/* Glass background */}
      <div className="bg-[rgba(255,255,255,0.7)] dark:bg-[rgba(10,10,10,0.8)] backdrop-blur-xl">
        <div className="flex items-center justify-around h-[60px] max-w-lg mx-auto relative">
          {tabs.map((tab) => {
            const active = pathname?.startsWith(tab.href);
            const badgeCount = badges[tab.key];
            const showCountBadge =
              (tab.key === "chat" || tab.key === "feed") && badgeCount > 0;
            const showDotBadge = tab.key === "modes" && challengeAvailable;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                onClick={handleTap}
                aria-current={active ? "page" : undefined}
                className={`relative flex flex-col items-center gap-[2px] tap-target justify-center transition-colors ${
                  active ? "text-accent" : "text-text-muted hover:text-text-soft"
                }`}
              >
                {/* Active tab indicator — slides between tabs */}
                {active && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-8 h-[2px] rounded-full"
                    style={{ background: "linear-gradient(90deg, #8B5CF6, #00FF88)" }}
                    transition={springs.snap as Transition}
                    aria-hidden="true"
                  />
                )}

                {/* Icon with badge container */}
                <motion.span
                  className="relative"
                  whileTap={{ scale: 0.85 }}
                  transition={springs.micro as Transition}
                >
                  <tab.Icon
                    size={22}
                    className={
                      active
                        ? "text-accent drop-shadow-[0_0_6px_rgba(139,92,246,0.5)]"
                        : ""
                    }
                  />

                  {/* Notification badges */}
                  {showCountBadge && <CountBadge count={badgeCount} />}
                  {showDotBadge && <DotBadge visible />}
                </motion.span>

                <span className="text-[9px] font-semibold tracking-wide">
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
