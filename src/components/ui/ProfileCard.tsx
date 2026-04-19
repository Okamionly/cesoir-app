"use client";

import { Profile } from "@/lib/mock-profiles";
import { MODES } from "@/lib/modes";

export default function ProfileCard({ profile, onClick }: { profile: Profile; onClick?: () => void }) {
  const mode = MODES[profile.mode];

  return (
    <div
      onClick={onClick}
      className="relative bg-bg-card border border-border rounded-2xl p-5 cursor-pointer transition-all active:scale-[0.98] hover:border-accent group overflow-hidden"
    >
      {/* Top gradient line */}
      <div className="absolute top-0 left-0 right-0 h-[3px] gradient-bg opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white shrink-0"
          style={{ background: profile.color }}
        >
          {profile.name[0]}
        </div>
        <div>
          <div className="font-bold text-base">
            {profile.name}, {profile.age}
            <span className="inline-block w-2 h-2 rounded-full bg-safe ml-1.5 shadow-[0_0_6px_var(--color-safe)]" />
          </div>
        </div>
      </div>

      {/* Mode badge */}
      <div className="inline-flex items-center gap-1.5 gradient-bg-subtle border border-accent/20 px-3 py-1 rounded-full text-xs font-medium text-accent mb-2.5">
        <span>{mode.icon}</span>
        <span>{mode.name}</span>
      </div>

      {/* Mode-specific extras */}
      {profile.cuisine && (
        <div className="mb-2">
          <span className="text-xs bg-accent/10 border border-accent/15 px-2.5 py-0.5 rounded-full text-accent">🍽️ {profile.cuisine}</span>
        </div>
      )}
      {profile.event && (
        <div className="mb-2">
          <span className="text-xs bg-accent-2/10 border border-accent-2/20 px-2.5 py-0.5 rounded-full text-accent-2">🎫 {profile.event}</span>
        </div>
      )}
      {profile.dog && (
        <div className="mb-2">
          <span className="text-xs bg-warn/10 border border-warn/20 px-2.5 py-0.5 rounded-full text-warn">🐶 {profile.dog}</span>
          <span className="text-xs text-text-muted ml-1.5">{profile.breed}, {profile.dogAge}</span>
        </div>
      )}
      {profile.safe && (
        <div className="mb-2">
          <span className="text-xs bg-safe/10 border border-safe/20 px-2.5 py-0.5 rounded-full text-safe">💚 Safe Space</span>
        </div>
      )}
      {profile.speaks && (
        <div className="flex flex-wrap gap-1 mb-2">
          {profile.speaks.map((l) => (
            <span key={l} className="text-[10px] bg-accent/10 border border-accent/20 px-2 py-0.5 rounded-full text-accent font-semibold">{l}</span>
          ))}
          {profile.learns && (
            <span className="text-[10px] bg-accent/10 border border-accent/20 px-2 py-0.5 rounded-full text-accent font-semibold">→ {profile.learns} ({profile.level})</span>
          )}
        </div>
      )}
      {profile.ambassador && (
        <div className="mb-2">
          <span className="text-xs bg-warn/10 border border-warn/20 px-2.5 py-0.5 rounded-full text-warn">🏅 Ambassadeur</span>
          <span className="text-xs text-text-muted ml-1.5">{profile.neighborhood}</span>
        </div>
      )}
      {profile.since && !profile.ambassador && (
        <div className="mb-2">
          <span className="text-xs bg-accent/10 border border-accent/15 px-2.5 py-0.5 rounded-full text-accent">📦 Ici depuis {profile.since}</span>
          <span className="text-xs text-text-muted ml-1.5">{profile.neighborhood}</span>
        </div>
      )}
      {profile.from && (
        <div className="mb-2 flex items-center gap-1.5 flex-wrap">
          <span className="text-xs bg-accent/10 border border-accent/20 px-2.5 py-0.5 rounded-full text-accent">
            {profile.badge === "Guide local" ? "🏅" : "✈️"} {profile.badge}
          </span>
          <span className="text-xs text-text-muted">{profile.from}</span>
        </div>
      )}

      {/* Bio */}
      <p className="text-sm text-text-muted leading-relaxed mb-3 line-clamp-2">{profile.bio}</p>

      {/* Footer */}
      <div className="flex justify-between items-center">
        <span className="text-xs text-text-muted">📍 {profile.distance} km</span>
        <span className="text-xs text-accent font-semibold">{profile.time}</span>
      </div>
    </div>
  );
}
