"use client";

import { useState } from "react";
import { ModeKey } from "@/lib/modes";
import { MOCK_PROFILES, Profile } from "@/lib/mock-profiles";
import ModeFilter from "@/components/ui/ModeFilter";
import ProfileCard from "@/components/ui/ProfileCard";

export default function BrowsePage() {
  const [filter, setFilter] = useState<ModeKey | "all">("all");
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

  const filtered = filter === "all"
    ? MOCK_PROFILES
    : MOCK_PROFILES.filter((p) => p.mode === filter);

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-bg/90 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl text-accent">☾</span>
            <h1 className="text-xl font-extrabold">CeSoir</h1>
          </div>
          <span className="text-xs text-text-muted font-medium">
            {filtered.length} dispo{filtered.length > 1 ? "s" : ""}
          </span>
        </div>
        <ModeFilter active={filter} onChange={setFilter} />
      </div>

      {/* Profiles */}
      <div className="px-4 py-4 space-y-3">
        {filtered.map((p, i) => (
          <div key={p.id} style={{ animationDelay: `${i * 0.05}s` }} className="animate-fade-up">
            <ProfileCard profile={p} onClick={() => setSelectedProfile(p)} />
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">😴</p>
            <p className="text-text-muted">Personne dans ce mode pour le moment</p>
          </div>
        )}
      </div>

      {/* Profile Detail Sheet */}
      {selectedProfile && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end justify-center"
          onClick={() => setSelectedProfile(null)}
        >
          <div
            className="w-full max-w-lg bg-bg-card border-t border-border rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-6" />

            {/* Profile header */}
            <div className="flex items-center gap-4 mb-5">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white"
                style={{ background: selectedProfile.color }}
              >
                {selectedProfile.name[0]}
              </div>
              <div>
                <h2 className="text-2xl font-extrabold">{selectedProfile.name}, {selectedProfile.age}</h2>
                <p className="text-sm text-text-muted">📍 {selectedProfile.distance} km · {selectedProfile.time}</p>
              </div>
            </div>

            {/* Bio */}
            <div className="mb-5">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Ce soir</h3>
              <p className="text-[15px] leading-relaxed">{selectedProfile.bio}</p>
            </div>

            {/* Mode-specific details */}
            {selectedProfile.dog && (
              <div className="mb-5">
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Compagnon</h3>
                <p className="text-sm">🐶 {selectedProfile.dog} — {selectedProfile.breed}, {selectedProfile.dogAge}</p>
              </div>
            )}
            {selectedProfile.speaks && (
              <div className="mb-5">
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Langues</h3>
                <div className="flex flex-wrap gap-1.5">
                  {selectedProfile.speaks.map((l) => (
                    <span key={l} className="text-xs bg-[#06b6d4]/10 border border-[#06b6d4]/20 px-3 py-1 rounded-full text-[#06b6d4] font-semibold">{l}</span>
                  ))}
                  {selectedProfile.learns && (
                    <span className="text-xs bg-accent/10 border border-accent/20 px-3 py-1 rounded-full text-accent font-semibold">→ {selectedProfile.learns} ({selectedProfile.level})</span>
                  )}
                </div>
              </div>
            )}
            {selectedProfile.event && (
              <div className="mb-5">
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Event</h3>
                <p className="text-sm">🎫 {selectedProfile.event}</p>
              </div>
            )}

            {/* CTA */}
            <button className="w-full gradient-bg text-white font-semibold py-4 rounded-full text-base shadow-glow-sm active:scale-[0.98] transition-transform">
              {selectedProfile.safe ? "Envoyer un message bienveillant" : "Envoyer un message"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
