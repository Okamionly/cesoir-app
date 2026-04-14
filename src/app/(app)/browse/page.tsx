"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { ModeKey, MODES, MODE_KEYS } from "@/lib/modes";
import { MOCK_PROFILES, Profile } from "@/lib/mock-profiles";
import PulseClock from "@/components/app/PulseClock";

export default function BrowsePage() {
  const [filter, setFilter] = useState<ModeKey | "all">("all");
  const [idx, setIdx] = useState(0);
  const [info, setInfo] = useState(false);
  const [match, setMatch] = useState<Profile | null>(null);
  const [gone, setGone] = useState(false);

  const list = filter === "all" ? MOCK_PROFILES : MOCK_PROFILES.filter(p => p.mode === filter);
  const card = list[idx];
  const next1 = list[idx + 1];
  const next2 = list[idx + 2];

  // Motion values for spring physics
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-15, 0, 15]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);
  // Next card scales up as current card moves
  const nextScale = useTransform(x, [-200, 0, 200], [1, 0.95, 1]);
  const nextY = useTransform(x, [-200, 0, 200], [0, 8, 0]);

  useEffect(() => { if (match) { const t = setTimeout(() => setMatch(null), 4000); return () => clearTimeout(t); } }, [match]);

  const goNext = useCallback((action: "like" | "pass") => {
    setGone(true);
    const target = action === "like" ? 500 : -500;
    animate(x, target, { type: "spring", stiffness: 300, damping: 30 });
    setTimeout(() => {
      if (action === "like" && Math.random() > 0.6) setMatch(card);
      setIdx(i => Math.min(i + 1, list.length));
      x.set(0);
      setGone(false);
      setInfo(false);
    }, 300);
  }, [card, list.length, x]);

  const onDragEnd = useCallback((_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
    if (info.offset.x > 120 || info.velocity.x > 500) goNext("like");
    else if (info.offset.x < -120 || info.velocity.x < -500) goNext("pass");
  }, [goNext]);

  const extras = (p: Profile) => {
    const tags: React.ReactNode[] = [];
    if (p.cuisine) tags.push(<span key="c" className="bg-white/10 px-2.5 py-1 rounded-lg text-[11px]">🍽️ {p.cuisine}</span>);
    if (p.event) tags.push(<span key="e" className="bg-accent/10 px-2.5 py-1 rounded-lg text-[11px] text-[#8B5CF6]">🎫 {p.event}</span>);
    if (p.dog) tags.push(<span key="d" className="bg-white/10 px-2.5 py-1 rounded-lg text-[11px]">🐶 {p.dog} · {p.breed}</span>);
    if (p.speaks) tags.push(<span key="l" className="bg-white/10 px-2.5 py-1 rounded-lg text-[11px]">🗣️ {p.speaks.join(", ")} → {p.learns}</span>);
    if (p.safe) tags.push(<span key="s" className="bg-[#22c55e]/15 px-2.5 py-1 rounded-lg text-[11px] text-[#22c55e]">💚 Safe Space</span>);
    if (p.from) tags.push(<span key="f" className="bg-white/10 px-2.5 py-1 rounded-lg text-[11px]">✈️ {p.from}</span>);
    if (p.ambassador) tags.push(<span key="a" className="bg-amber-500/15 px-2.5 py-1 rounded-lg text-[11px] text-amber-400">🏅 Ambassadeur</span>);
    return tags;
  };

  return (
    <div className="h-screen bg-bg flex flex-col">
      {/* Header */}
      <header className="shrink-0 px-4 pt-2 pb-1 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg text-accent" aria-hidden="true">☾</span>
            <span className="text-base font-bold text-text">CeSoir</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-safe" aria-hidden="true" />
            Dispos pres de toi
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2" role="tablist" aria-label="Filtrer par mode">
          <button role="tab" aria-selected={filter === "all"} onClick={() => { setFilter("all"); setIdx(0); }} className="shrink-0 flex flex-col items-center gap-1">
            <div className={filter === "all" ? "story-ring" : "story-ring-off"}>
              <div className="w-11 h-11 rounded-full bg-bg flex items-center justify-center text-sm">⭐</div>
            </div>
            <span className={`text-[9px] font-medium ${filter === "all" ? "text-text" : "text-text-muted"}`}>Tout</span>
          </button>
          {MODE_KEYS.map(k => (
            <button role="tab" aria-selected={filter === k} key={k} onClick={() => { setFilter(k); setIdx(0); }} className="shrink-0 flex flex-col items-center gap-1">
              <div className={filter === k ? "story-ring" : "story-ring-off"}>
                <div className="w-11 h-11 rounded-full bg-bg flex items-center justify-center text-sm">{MODES[k].icon}</div>
              </div>
              <span className={`text-[9px] font-medium max-w-[44px] truncate ${filter === k ? "text-text" : "text-text-muted"}`}>{MODES[k].name}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Pulse Clock */}
      <div className="shrink-0 px-3 pt-2">
        <PulseClock />
      </div>

      {/* Card stack */}
      <main className="flex-1 relative px-3 pb-1 overflow-hidden" aria-label="Profils disponibles">
        {card ? (
          <>
            {/* Card 3 (back) */}
            {next2 && (
              <div className="absolute inset-x-5 top-2 bottom-3 rounded-[24px] bg-[#1a1a1a] scale-[0.9] translate-y-4 opacity-30 z-0" />
            )}

            {/* Card 2 (behind) */}
            {next1 && (
              <motion.div
                className="absolute inset-x-4 top-1 bottom-2 rounded-[24px] bg-[#141414] z-[1] overflow-hidden"
                style={{ scale: nextScale, y: nextY }}
              >
                <img src={next1.photo} alt="" className="absolute top-[6%] left-1/2 -translate-x-1/2 w-[55%] max-w-[200px] opacity-40 blur-[2px]" />
              </motion.div>
            )}

            {/* Card 1 (active — draggable) */}
            <motion.div
              className="relative w-full h-full rounded-[24px] overflow-hidden select-none z-[2] card-dark"
              style={{ x, rotate, cursor: "grab" }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.9}
              onDragEnd={onDragEnd}
              onClick={() => setInfo(!info)}
              whileDrag={{ cursor: "grabbing" }}
              role="button"
              tabIndex={0}
              aria-label={`Profil de ${card.name}, ${card.age} ans`}
              aria-expanded={info}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight") goNext("like");
                else if (e.key === "ArrowLeft") goNext("pass");
                else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setInfo(!info); }
              }}
            >
              {/* BG */}
              <div className="absolute inset-0" style={{ background: `linear-gradient(160deg, ${card.color}20 0%, #0a0a0a 50%)` }} />

              {/* Photo */}
              <img
                src={card.photo}
                alt={`Photo de ${card.name}`}
                className="absolute top-[4%] left-1/2 -translate-x-1/2 w-[65%] max-w-[260px] rounded-2xl object-cover pointer-events-none"
                style={{ filter: "drop-shadow(0 16px 32px rgba(0,0,0,0.5))" }}
              />

              {/* LIKE label */}
              <motion.div className="absolute top-6 left-4 z-10" style={{ opacity: likeOpacity }}>
                <div className="px-5 py-2 rounded-2xl border-2 border-[#00FF88] bg-[#00FF88]/10 -rotate-6">
                  <span className="text-[#00FF88] text-xl font-black tracking-wider">LIKE</span>
                </div>
              </motion.div>

              {/* NOPE label */}
              <motion.div className="absolute top-6 right-4 z-10" style={{ opacity: nopeOpacity }}>
                <div className="px-5 py-2 rounded-2xl border-2 border-danger bg-danger/10 rotate-6">
                  <span className="text-danger text-xl font-black tracking-wider">NOPE</span>
                </div>
              </motion.div>

              {/* Counter */}
              <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-1 text-[10px] text-white/70 font-medium z-10">
                {idx + 1}/{list.length}
              </div>

              {/* Info panel */}
              <div className={`absolute bottom-0 left-0 right-0 transition-all duration-300 ${info ? "h-[60%]" : "h-[40%]"}`}>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
                <div className={`relative h-full flex flex-col justify-end p-5 ${info ? "overflow-y-auto" : ""}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-white/10 px-2.5 py-1 rounded-lg text-[10px] font-medium text-white">{MODES[card.mode].icon} {MODES[card.mode].name}</span>
                    {card.time === "Dispo maintenant" && <span className="flex items-center gap-1 bg-[#00FF88]/15 px-2 py-1 rounded-lg text-[10px] text-[#00FF88] font-medium"><span className="w-1.5 h-1.5 rounded-full bg-[#00FF88]" />Now</span>}
                  </div>

                  <h2 className="font-display text-[32px] font-bold leading-none mb-1 text-white">
                    {card.name}<span className="font-sans text-xl font-light text-white/50">, {card.age}</span>
                  </h2>

                  <p className="text-[12px] text-white/50 mb-3">📍 {card.distance} km · <span className="text-[#00FF88]">{card.time}</span></p>

                  <p className={`text-[13px] text-white/70 leading-relaxed mb-3 ${info ? "" : "line-clamp-2"}`}>{card.bio}</p>

                  <div className="flex flex-wrap gap-1.5">{extras(card)}</div>

                  {info && card.speaks && (
                    <div className="mt-4 pt-3 border-t border-white/10">
                      <p className="text-[9px] text-white/40 uppercase tracking-widest font-bold mb-2">Langues</p>
                      <div className="flex gap-1.5">
                        {card.speaks.map(l => <span key={l} className="text-[10px] bg-cyan-500/10 px-2 py-0.5 rounded text-cyan-400">{l}</span>)}
                        {card.learns && <span className="text-[10px] bg-accent/10 px-2 py-0.5 rounded text-accent">→ {card.learns}</span>}
                      </div>
                    </div>
                  )}
                  {info && card.dog && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <p className="text-[9px] text-white/40 uppercase tracking-widest font-bold mb-1">Compagnon</p>
                      <p className="text-[12px] text-white">🐶 {card.dog} — {card.breed}, {card.dogAge}</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center animate-fade-up">
            <p className="text-3xl mb-4" aria-hidden="true">✨</p>
            <p className="font-bold mb-1">C&apos;est tout pour ce soir</p>
            <p className="text-sm text-text-muted mb-6">Reviens plus tard ou change de mode</p>
            <button onClick={() => { setIdx(0); setFilter("all"); }} className="gradient-bg text-white px-6 py-3 rounded-full text-sm font-semibold">Recommencer</button>
          </div>
        )}
      </main>

      {/* Actions */}
      {card && (
        <div className="shrink-0 flex items-center justify-center gap-5 pt-2 pb-20" role="group" aria-label="Actions">
          <motion.button
            onClick={() => goNext("pass")}
            aria-label="Passer"
            className="w-14 h-14 rounded-full bg-bg border border-border flex items-center justify-center text-lg text-text-muted"
            whileTap={{ scale: 0.75 }}
            whileHover={{ borderColor: "#ef4444", color: "#ef4444" }}
          >
            ✕
          </motion.button>
          <motion.button
            aria-label="Super like"
            className="w-11 h-11 rounded-full bg-bg border border-border flex items-center justify-center text-sm text-text-muted"
            whileTap={{ scale: 0.75 }}
          >
            ⭐
          </motion.button>
          <motion.button
            onClick={() => goNext("like")}
            aria-label="Liker"
            className="w-14 h-14 rounded-full gradient-bg flex items-center justify-center text-xl text-white shadow-glow"
            whileTap={{ scale: 0.75 }}
          >
            ♥
          </motion.button>
        </div>
      )}

      {/* Match toast */}
      {match && (
        <motion.div
          role="alert"
          aria-live="assertive"
          className="fixed bottom-24 left-4 right-4 z-50"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <div className="bg-bg border border-accent/30 rounded-2xl p-3.5 shadow-glow">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                <div className="w-10 h-10 rounded-full gradient-bg p-[2px] z-10"><div className="w-full h-full rounded-full bg-bg flex items-center justify-center text-sm font-bold text-accent">Y</div></div>
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-bg"><img src={match.photo} alt={match.name} className="w-full h-full object-cover" /></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-text"><span className="gradient-text">Match</span> avec {match.name}</p>
                <p className="text-[10px] text-text-muted">Dispos ce soir</p>
              </div>
              <button onClick={() => setMatch(null)} className="gradient-bg text-white px-3.5 py-1.5 rounded-full text-[11px] font-bold">Ecrire</button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
