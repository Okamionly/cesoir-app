"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconSearch, IconMap, IconChat, IconMoon, IconUser } from "@/components/ui/Icons";

const tabs = [
  { href: "/browse", Icon: IconSearch, label: "Explorer", badge: false },
  { href: "/map", Icon: IconMap, label: "Carte", badge: false },
  { href: "/chat", Icon: IconChat, label: "Chat", badge: true },
  { href: "/modes", Icon: IconMoon, label: "Modes", badge: false },
  { href: "/profile", Icon: IconUser, label: "Profil", badge: false },
];

interface BottomNavProps {
  chatBadgeCount?: number;
}

export default function BottomNav({ chatBadgeCount = 0 }: BottomNavProps) {
  const pathname = usePathname();

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
        <div className="flex items-center justify-around h-[60px] max-w-lg mx-auto">
          {tabs.map((tab) => {
            const active = pathname?.startsWith(tab.href);
            const showBadge = tab.badge && chatBadgeCount > 0;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex flex-col items-center gap-[2px] tap-target justify-center transition-all ${
                  active ? "text-accent" : "text-text-muted hover:text-text-soft"
                }`}
              >
                <span className="relative">
                  <tab.Icon
                    size={22}
                    className={active ? "text-accent drop-shadow-[0_0_6px_rgba(139,92,246,0.5)]" : ""}
                  />
                  {/* Notification badge */}
                  {showBadge && (
                    <span
                      className="absolute -top-1.5 -right-2.5 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full gradient-bg text-[9px] font-bold text-white"
                      style={{ animation: "pulse-dot 2s ease-in-out infinite" }}
                      aria-label={`${chatBadgeCount} messages non lus`}
                    >
                      {chatBadgeCount > 99 ? "99+" : chatBadgeCount}
                    </span>
                  )}
                </span>
                <span className="text-[9px] font-semibold tracking-wide">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
