"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { ModeKey, MODES, MODE_KEYS } from "@/lib/modes";
import { MOCK_PROFILES } from "@/lib/mock-profiles";
import { useSwipe } from "@/lib/useSwipe";
import { MODE_ICONS, IconHeart, IconX, IconStar } from "@/components/ui/Icons";
import PulseClock from "@/components/app/PulseClock";
import SwipeCard from "@/components/app/SwipeCard";

export default function BrowsePage() {
  const [filter, setFilter] = useState<ModeKey | "all">("all");
  const [idx, setIdx] = useState(0);
  const [info, setInfo] = useState(false);
  const [match, setMatch] = useState<typeof MOCK_PROFILES[0] | null>(null);
  const [showPulse, setShowPulse] = useState(true);

  const list = filter === "all" ? MOCK_PROFILES : MOCK_PROFILES.filter(p => p.mode === filter);
  const card = list[idx];
  const next1 = list[idx + 1];

  useEffect(() => {
    if (match) {
      const t = setTimeout(() => setMatch(null), 4000);
      return () => clearTimeout(t);
    }
  }, [match]);

  const handleAction = useCallback((action: "like" | "pass") => {
    if (action === "like" && card && Math.random() > 0.6) setMatch(card);
    setIdx(i => Math.min(i + 1, list.length));
    setInfo(false);
    setShowPulse(false);
  }, [card, list.length]);

  const swipe = useSwipe(handleAction);

  return (
    <div className="h-screen bg-bg flex flex-col">
      {/* Header */}
      <header className="shrink-0 px-5 pt-3 pb-2">
        <div className="flex items-center justify-between">
          <h1 className="text-[18px] font-black tracking-tight text-text">CeSoir</h1>
          <button onClick={() => setShowPulse(!showPulse)} className="text-[11px] text-accent font-semibold tap-target py-1">
            {showPulse ? "Masquer" : "Pulse"} · {list.length}
          </button>
        </div>
      </header>

      {/* Mode filter */}
      <ModeFilter active={filter} onChange={(m) => { setFilter(m); setIdx(0); }} />

      {/* Pulse Clock */}
      {showPulse && (
        <motion.div className="shrink-0 px-4 pb-2" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}>
          <PulseClock />
        </motion.div>
      )}

      {/* Card area */}
      <main className="flex-1 relative px-4 pb-1 overflow-hidden">
        {card ? (
          <>
            {next1 && (
              <motion.div className="absolute inset-x-5 top-1 bottom-2 rounded-[28px] overflow-hidden z-[1]" style={{ scale: swipe.nextScale }}>
                <div className="absolute inset-0 bg-[#111]" />
                <img src={next1.photo} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 blur-[4px]" />
              </motion.div>
            )}
            <SwipeCard
              profile={card}
              index={idx}
              total={list.length}
              expanded={info}
              onToggleExpand={() => setInfo(!info)}
              x={swipe.x}
              rotate={swipe.rotate}
              likeOpacity={swipe.likeOpacity}
              nopeOpacity={swipe.nopeOpacity}
              onDragEnd={swipe.onDragEnd}
              onLike={swipe.triggerLike}
              onPass={swipe.triggerPass}
            />
          </>
        ) : (
          <EmptyState onReset={() => { setIdx(0); setFilter("all"); }} />
        )}
      </main>

      {/* Actions */}
      {card && <ActionButtons onPass={swipe.triggerPass} onLike={swipe.triggerLike} />}

      {/* Match toast */}
      {match && <MatchToast profile={match} onDismiss={() => setMatch(null)} />}
    </div>
  );
}

// --- Extracted Components ---

function ModeFilter({ active, onChange }: { active: ModeKey | "all"; onChange: (m: ModeKey | "all") => void }) {
  return (
    <div className="shrink-0 flex gap-3 px-5 pb-3 overflow-x-auto no-scrollbar">
      <FilterButton active={active === "all"} onClick={() => onChange("all")} label="Tous les modes">
        <IconStar size={16} />
      </FilterButton>
      {MODE_KEYS.map(k => {
        const Icon = MODE_ICONS[k];
        return (
          <FilterButton key={k} active={active === k} onClick={() => onChange(k)} label={MODES[k].name}>
            {Icon && <Icon size={16} />}
          </FilterButton>
        );
      })}
    </div>
  );
}

function FilterButton({ active, onClick, label, children }: { active: boolean; onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
        active ? "border-accent bg-accent/10 text-accent" : "border-border text-text-muted hover:text-text-soft"
      }`}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}

function ActionButtons({ onPass, onLike }: { onPass: () => void; onLike: () => void }) {
  return (
    <div className="shrink-0 flex items-center justify-center gap-6 pt-2 pb-[76px]" role="group" aria-label="Actions">
      <motion.button onClick={onPass} aria-label="Passer" className="w-[54px] h-[54px] rounded-full bg-bg border-2 border-border flex items-center justify-center text-text-muted" whileTap={{ scale: 0.8 }}>
        <IconX size={22} />
      </motion.button>
      <motion.button aria-label="Super like" className="w-[44px] h-[44px] rounded-full bg-bg border-2 border-border flex items-center justify-center text-text-muted" whileTap={{ scale: 0.8 }}>
        <IconStar size={18} />
      </motion.button>
      <motion.button onClick={onLike} aria-label="Liker" className="w-[54px] h-[54px] rounded-full gradient-bg flex items-center justify-center text-white shadow-glow" whileTap={{ scale: 0.8 }}>
        <IconHeart size={22} />
      </motion.button>
    </div>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <div className="w-16 h-16 rounded-full gradient-bg flex items-center justify-center mb-5">
        <IconStar size={24} className="text-white" />
      </div>
      <p className="text-[17px] font-bold mb-1 text-text">C&apos;est tout pour ce soir</p>
      <p className="text-[13px] text-text-muted mb-8">Reviens plus tard ou change de mode</p>
      <button onClick={onReset} className="gradient-bg text-white px-8 py-3 rounded-full text-[14px] font-semibold">
        Recommencer
      </button>
    </div>
  );
}

function MatchToast({ profile, onDismiss }: { profile: typeof MOCK_PROFILES[0]; onDismiss: () => void }) {
  return (
    <motion.div
      role="alert" aria-live="assertive"
      className="fixed bottom-24 left-4 right-4 z-50"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <div className="bg-bg border border-accent/20 rounded-2xl p-4 shadow-glow">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-3">
            <div className="w-12 h-12 rounded-full gradient-bg p-[2px] z-10">
              <div className="w-full h-full rounded-full bg-bg flex items-center justify-center text-[14px] font-bold text-accent">Y</div>
            </div>
            <img src={profile.photo} alt={profile.name} className="w-12 h-12 rounded-full object-cover border-2 border-bg" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-bold text-text"><span className="gradient-text">Match !</span> {profile.name}</p>
            <p className="text-[11px] text-text-muted">Vous etes dispos ce soir</p>
          </div>
          <button onClick={onDismiss} className="gradient-bg text-white px-4 py-2 rounded-full text-[12px] font-bold">Ecrire</button>
        </div>
      </div>
    </motion.div>
  );
}
