"use client";

import { MODES, MODE_KEYS } from "@/lib/modes";
import Link from "next/link";

const badgeStyles: Record<string, string> = {
  default: "bg-accent/15 border-accent/30 text-accent",
  pink: "bg-accent-2/15 border-accent-2/30 text-accent-2",
  indigo: "bg-owl/15 border-owl/30 text-owl",
  green: "bg-safe/15 border-safe/30 text-safe",
  amber: "bg-warn/15 border-warn/30 text-warn",
};

export default function ModesPage() {
  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-bg/90 backdrop-blur-xl border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl text-accent">☾</span>
          <h1 className="text-xl font-extrabold">Modes</h1>
        </div>
        <p className="text-xs text-text-muted mt-0.5">9 facons de connecter ce soir</p>
      </div>

      {/* Mode cards */}
      <div className="px-4 py-4 space-y-3">
        {MODE_KEYS.map((key, i) => {
          const mode = MODES[key];
          const badgeStyle = badgeStyles[mode.badgeColor || "default"];

          return (
            <Link
              key={key}
              href={`/browse?mode=${key}`}
              className="block bg-bg-card border border-border rounded-2xl p-5 active:scale-[0.98] transition-all animate-fade-up"
              style={{ animationDelay: `${i * 0.04}s` }}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-3xl">{mode.icon}</span>
                {mode.badge && (
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${badgeStyle}`}>
                    {mode.badge}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-extrabold mb-1">{mode.name}</h3>
              <p className="text-sm text-text-muted leading-relaxed mb-3">{mode.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {mode.tags.slice(0, 4).map((tag) => (
                  <span key={tag} className="text-[10px] bg-accent/10 border border-accent/15 px-2.5 py-0.5 rounded-full text-accent font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
