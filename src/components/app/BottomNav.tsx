"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";
import { m, AnimatePresence, type Transition } from "motion/react";
import { IconSearch, IconMap, IconChat, IconMoon, IconUser } from "@/components/ui/Icons";
import { Music } from "@/components/ui/lucide";
import { springs } from "@/lib/motion-design";

// Small wrapper so the lucide icon matches the `{ size, className }` API the
// custom Icons barrel exposes. Thin strokeWidth to sit next to the other
// custom SVGs harmoniously.
function IconSoirees({
  size = 24,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Music
      size={size}
      strokeWidth={1.8}
      className={className}
      aria-hidden="true"
    />
  );
}

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

type TabKey = "feed" | "map" | "events" | "chat" | "modes" | "profile";

// 2026-04-23 Wave14 — "events" slot injected between map & chat.
// 6 tabs still fit in the 440px phone-frame; the BottomNav already uses
// `justify-around` + `tap-target` utilities so each tab keeps >=44px touch.
//
// `dataTour` opts the tab into the first-time onboarding spotlight tour
// (see `src/components/onboarding/Tour.tsx`). Only the tabs that the
// tour actually highlights need this — the selectors are stable strings
// so the tour file owns the source of truth.
const tabs: {
  href: `/${TabKey}`;
  key: TabKey;
  Icon: typeof IconSearch;
  label: string;
  dataTour?: string;
}[] = [
  { href: "/feed", key: "feed", Icon: IconSearch, label: "Explorer" },
  { href: "/map", key: "map", Icon: IconMap, label: "Carte" },
  { href: "/events", key: "events", Icon: IconSoirees, label: "Soirées" },
  { href: "/chat", key: "chat", Icon: IconChat, label: "Chat" },
  { href: "/modes", key: "modes", Icon: IconMoon, label: "Modes", dataTour: "modes-tab" },
  { href: "/profile", key: "profile", Icon: IconUser, label: "Profil", dataTour: "profile-tab" },
];

// ---------- Badge sub-component ----------

/**
 * Small 6px red dot badge. The dot itself stays 6px for visual polish, but
 * the badge is rendered inside an invisible 12x12 hit-area wrapper so it
 * meets minimum 44px combined tap area when paired with the surrounding
 * icon (WCAG 2.5.5 — large-enough target via enclosing Link which is
 * already 44px min via tap-target utility).
 */
function DotBadge({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <span
          className="absolute -top-1 -right-1 w-3 h-3 flex items-center justify-center pointer-events-none"
          aria-hidden="true"
        >
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

  // Internal badge data (fallback if props not provided)
  const internal = useSafeBadgeData();

  // Resolve badge values: props override internal state
  const chatCount = chatBadgeCount ?? internal.chatUnread;
  const matchCount = newMatchCount ?? internal.newMatches;
  const challengeAvailable = dailyChallengeReady ?? internal.dailyChallengeAvailable;

  // Build badge map
  const badges: Record<TabKey, boolean> = {
    feed: matchCount > 0,
    map: false,
    events: false,
    chat: chatCount > 0,
    modes: challengeAvailable,
    profile: false,
  };

  // Haptic tap handler (no sound)
  const handleTap = useCallback(() => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(10);
    }
  }, []);

  return (
    <nav
      aria-label="Navigation principale"
      // User choice 2026-04-20: BottomNav partout (mobile-like on desktop).
      // 2026-04-20 v2: on desktop, clamp width to the AppShell phone-frame
      // (440px) and snap bottom-corners to match the frame's rounded radius.
      // Mobile stays full-width. Transform + left-1/2 centers the clamped
      // version under the frame without disturbing mobile behaviour.
      className="fixed bottom-0 left-0 right-0 z-50 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-full md:max-w-[440px] md:mb-6 md:rounded-b-[44px] md:overflow-hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* Subtle top border */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px] bg-border"
        aria-hidden="true"
      />

      {/* Glass background */}
      <div className="bg-[rgba(255,255,255,0.7)] dark:bg-[rgba(10,10,10,0.8)] backdrop-blur-xl">
        <div className="flex items-center justify-around h-[60px] max-w-lg mx-auto">
          {tabs.map((tab) => {
            const active = pathname?.startsWith(tab.href);
            const hasBadge = badges[tab.key];

            return (
              <Link
                key={tab.href}
                href={tab.href}
                onClick={handleTap}
                data-tour={tab.dataTour}
                aria-current={active ? "page" : undefined}
                className={`relative flex flex-col items-center gap-[2px] tap-target justify-center transition-colors ${
                  active ? "text-accent" : "text-text-muted hover:text-text-soft"
                }`}
              >
                {/* Icon with badge container */}
                <m.span
                  className="relative"
                  whileTap={{ scale: 0.85 }}
                  transition={springs.micro as Transition}
                >
                  <tab.Icon size={22} />

                  {/* Small red dot badge */}
                  {hasBadge && <DotBadge visible />}
                </m.span>

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
