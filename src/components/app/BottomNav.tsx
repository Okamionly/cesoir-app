"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconSearch, IconMap, IconChat, IconMoon, IconUser } from "@/components/ui/Icons";

const tabs = [
  { href: "/browse", Icon: IconSearch, label: "Explorer" },
  { href: "/map", Icon: IconMap, label: "Carte" },
  { href: "/chat", Icon: IconChat, label: "Chat" },
  { href: "/modes", Icon: IconMoon, label: "Modes" },
  { href: "/profile", Icon: IconUser, label: "Profil" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-bg/95 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-around h-[60px] max-w-lg mx-auto">
        {tabs.map((tab) => {
          const active = pathname?.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center gap-[2px] tap-target justify-center transition-all ${
                active ? "text-accent" : "text-text-muted hover:text-text-soft"
              }`}
            >
              <tab.Icon size={22} className={active ? "text-accent" : ""} />
              <span className="text-[9px] font-semibold tracking-wide">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
