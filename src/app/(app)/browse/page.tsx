"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { ModeKey, MODES, MODE_KEYS } from "@/lib/modes";
import { MOCK_PROFILES, Profile } from "@/lib/mock-profiles";
import { MODE_ICONS, IconHeart, IconX, IconStar } from "@/components/ui/Icons";
import PulseClock from "@/components/app/PulseClock";

export default function BrowsePage() {
  const [filter, setFilter] = useState<ModeKey | "all">("all");
  const [idx, setIdx] = useState(0);
  const [info, setInfo] = useState(false);
  const [match, setMatch] = useState<Profile | null>(null);
  const [showPulse, setShowPulse] = useState(true);

  const list = filter === "all" ? MOCK_PROFILES : MOCK_PROFILES.filter(p => p.mode === filter);
  const card = list[idx];
  const next1 = list[idx + 1];

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-12, 0, 12]);
  const likeOp = useTransform(x, [0, 100], [0, 1]);
  const nopeOp = useTransform(x, [-100, 0], [1, 0]);
  const nextScale = useTransform(x, [-200, 0, 200], [1, 0.94, 1]);

  useEffect(() => { if (match) { const t = setTimeout(() => setMatch(null), 4000); return () => clearTimeout(t); } }, [match]);

  const goNext = useCallback((action: "like" | "pass") => {
    animate(x, action === "like" ? 500 : -500, { type: "spring", stiffness: 300, damping: 30 });
    setTimeout(() => {
      if (action === "like" && Math.random() > 0.6) setMatch(card);
      setIdx(i => Math.min(i + 1, list.length));
      x.set(0);
      setInfo(false);
      setShowPulse(false);
    }, 300);
  }, [card, list.length, x]);

  const onDragEnd = useCallback((_: unknown, i: { offset: { x: number }; velocity: { x: number } }) => {
    if (i.offset.x > 120 || i.velocity.x > 500) goNext("like");
    else if (i.offset.x < -120 || i.velocity.x < -500) goNext("pass");
  }, [goNext]);

  const ModeIcon = card ? MODE_ICONS[card.mode] : null;

  return (
    <div className="h-screen bg-bg flex flex-col">
      {/* Header — minimal */}
      <header className="shrink-0 px-5 pt-3 pb-2">
        <div className="flex items-center justify-between">
          <h1 className="text-[18px] font-black tracking-tight text-text">CeSoir</h1>
          <button onClick={() => setShowPulse(!showPulse)} className="text-[11px] text-accent font-semibold tap-target py-1">
            {showPulse ? "Masquer" : "Pulse"} ·  {list.length}
          </button>
        </div>
      </header>

      {/* Mode filter — icon-based, no emojis */}
      <div className="shrink-0 flex gap-3 px-5 pb-3 overflow-x-auto no-scrollbar">
        <button
          onClick={() => { setFilter("all"); setIdx(0); }}
          className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
            filter === "all" ? "border-accent bg-accent/10 text-accent" : "border-border text-text-muted"
          }`}
          aria-label="Tous les modes"
        >
          <IconStar size={16} />
        </button>
        {MODE_KEYS.map(k => {
          const Icon = MODE_ICONS[k];
          const active = filter === k;
          return (
            <button
              key={k}
              onClick={() => { setFilter(k); setIdx(0); }}
              className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                active ? "border-accent bg-accent/10 text-accent" : "border-border text-text-muted hover:text-text-soft"
              }`}
              aria-label={MODES[k].name}
              title={MODES[k].name}
            >
              {Icon && <Icon size={16} />}
            </button>
          );
        })}
      </div>

      {/* Pulse Clock — collapsible */}
      {showPulse && (
        <motion.div
          className="shrink-0 px-4 pb-2"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
        >
          <PulseClock />
        </motion.div>
      )}

      {/* Card area */}
      <main className="flex-1 relative px-4 pb-1 overflow-hidden">
        {card ? (
          <>
            {/* Next card preview */}
            {next1 && (
              <motion.div
                className="absolute inset-x-5 top-1 bottom-2 rounded-[28px] overflow-hidden z-[1]"
                style={{ scale: nextScale }}
              >
                <div className="absolute inset-0 bg-[#111]" />
                <img src={next1.photo} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 blur-[4px]" />
              </motion.div>
            )}

            {/* Active card */}
            <motion.div
              className="relative w-full h-full rounded-[28px] overflow-hidden select-none z-[2]"
              style={{ x, rotate, cursor: "grab" }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.7}
              onDragEnd={onDragEnd}
              onClick={() => setInfo(!info)}
              whileDrag={{ cursor: "grabbing" }}
              role="button"
              tabIndex={0}
              aria-label={`${card.name}, ${card.age} ans`}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight") goNext("like");
                else if (e.key === "ArrowLeft") goNext("pass");
                else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setInfo(!info); }
              }}
            >
              {/* Full-bleed photo */}
              <img
                src={card.photo}
                alt={`Photo de ${card.name}`}
                className="absolute inset-0 w-full h-full object-cover"
              />

              {/* Dark gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

              {/* Swipe indicators */}
              <motion.div className="absolute top-8 left-6 z-10" style={{ opacity: likeOp }}>
                <div className="px-5 py-2 rounded-2xl border-2 border-[#00FF88] bg-[#00FF88]/15 backdrop-blur-sm -rotate-6">
                  <span className="text-[#00FF88] text-[18px] font-black tracking-widest">LIKE</span>
                </div>
              </motion.div>
              <motion.div className="absolute top-8 right-6 z-10" style={{ opacity: nopeOp }}>
                <div className="px-5 py-2 rounded-2xl border-2 border-[#ff4466] bg-[#ff4466]/15 backdrop-blur-sm rotate-6">
                  <span className="text-[#ff4466] text-[18px] font-black tracking-widest">NOPE</span>
                </div>
              </motion.div>

              {/* Counter */}
              <div className="absolute top-5 right-5 bg-black/40 backdrop-blur-md rounded-full px-3 py-1.5 text-[10px] text-white/70 font-semibold z-10">
                {idx + 1} / {list.length}
              </div>

              {/* Mode badge — top left */}
              <div className="absolute top-5 left-5 z-10 flex items-center gap-1.5 bg-black/40 backdrop-blur-md rounded-full px-3 py-1.5">
                {ModeIcon && <ModeIcon size={14} className="text-white/80" />}
                <span className="text-[10px] text-white/80 font-semibold">{MODES[card.mode].name}</span>
              </div>

              {/* Bottom info — editorial layout */}
              <div className={`absolute bottom-0 left-0 right-0 transition-all duration-300 ${info ? "h-[65%]" : "h-[38%]"}`}>
                <div className={`relative h-full flex flex-col justify-end p-6 ${info ? "overflow-y-auto" : ""}`}>

                  {/* Availability pill */}
                  {card.time === "Dispo maintenant" && (
                    <div className="flex items-center gap-1.5 mb-3">
                      <span className="w-2 h-2 rounded-full bg-[#00FF88]" />
                      <span className="text-[11px] text-[#00FF88] font-bold uppercase tracking-widest">Maintenant</span>
                    </div>
                  )}

                  {/* Name — big editorial type */}
                  <h2 className="text-[38px] font-black leading-[0.95] tracking-tight text-white mb-1">
                    {card.name}
                  </h2>
                  <p className="text-[15px] text-white/50 font-light mb-3">
                    {card.age} ans · {card.distance} km · <span className="text-[#00FF88] font-medium">{card.time}</span>
                  </p>

                  {/* Bio */}
                  <p className={`text-[14px] text-white/70 leading-relaxed ${info ? "" : "line-clamp-2"}`}>
                    {card.bio}
                  </p>

                  {/* Tags — clean pills */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {card.cuisine && <span className="px-3 py-1 rounded-full bg-white/8 text-[11px] text-white/70 font-medium">{card.cuisine}</span>}
                    {card.event && <span className="px-3 py-1 rounded-full bg-accent/15 text-[11px] text-accent font-medium">{card.event}</span>}
                    {card.dog && <span className="px-3 py-1 rounded-full bg-white/8 text-[11px] text-white/70 font-medium">{card.dog} · {card.breed}</span>}
                    {card.safe && <span className="px-3 py-1 rounded-full bg-[#00FF88]/15 text-[11px] text-[#00FF88] font-medium">Safe Space</span>}
                    {card.from && <span className="px-3 py-1 rounded-full bg-white/8 text-[11px] text-white/70 font-medium">{card.from}</span>}
                    {card.speaks && <span className="px-3 py-1 rounded-full bg-white/8 text-[11px] text-white/70 font-medium">{card.speaks.join(" · ")} → {card.learns}</span>}
                  </div>

                  {/* Expanded details */}
                  {info && (
                    <motion.div
                      className="mt-4 pt-4 border-t border-white/8 space-y-3"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {card.speaks && (
                        <div>
                          <p className="text-[9px] text-white/30 uppercase tracking-[0.2em] font-bold mb-2">Langues</p>
                          <div className="flex gap-1.5">
                            {card.speaks.map(l => <span key={l} className="text-[11px] bg-[#06b6d4]/15 px-2.5 py-0.5 rounded-full text-[#06b6d4] font-medium">{l}</span>)}
                            {card.learns && <span className="text-[11px] bg-accent/15 px-2.5 py-0.5 rounded-full text-accent font-medium">→ {card.learns}</span>}
                          </div>
                        </div>
                      )}
                      {card.dog && (
                        <div>
                          <p className="text-[9px] text-white/30 uppercase tracking-[0.2em] font-bold mb-1">Compagnon</p>
                          <p className="text-[13px] text-white/80">{card.dog} — {card.breed}, {card.dogAge}</p>
                        </div>
                      )}
                      {card.event && (
                        <div>
                          <p className="text-[9px] text-white/30 uppercase tracking-[0.2em] font-bold mb-1">Event</p>
                          <p className="text-[13px] text-white/80">{card.event}</p>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Expand hint */}
                  <div className="flex justify-center mt-3">
                    <div className={`w-8 h-[3px] rounded-full bg-white/20 transition-transform ${info ? "rotate-180" : ""}`} />
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full gradient-bg flex items-center justify-center mb-5">
              <IconStar size={24} className="text-white" />
            </div>
            <p className="text-[17px] font-bold mb-1 text-text">C&apos;est tout pour ce soir</p>
            <p className="text-[13px] text-text-muted mb-8">Reviens plus tard ou change de mode</p>
            <button onClick={() => { setIdx(0); setFilter("all"); }} className="gradient-bg text-white px-8 py-3 rounded-full text-[14px] font-semibold">
              Recommencer
            </button>
          </div>
        )}
      </main>

      {/* Action buttons — refined with custom icons */}
      {card && (
        <div className="shrink-0 flex items-center justify-center gap-6 pt-2 pb-[76px]" role="group" aria-label="Actions">
          <motion.button
            onClick={() => goNext("pass")}
            aria-label="Passer"
            className="w-[54px] h-[54px] rounded-full bg-bg border-2 border-border flex items-center justify-center text-text-muted"
            whileTap={{ scale: 0.8, borderColor: "#ff4466" }}
          >
            <IconX size={22} />
          </motion.button>
          <motion.button
            aria-label="Super like"
            className="w-[44px] h-[44px] rounded-full bg-bg border-2 border-border flex items-center justify-center text-text-muted"
            whileTap={{ scale: 0.8, borderColor: "#06b6d4" }}
          >
            <IconStar size={18} />
          </motion.button>
          <motion.button
            onClick={() => goNext("like")}
            aria-label="Liker"
            className="w-[54px] h-[54px] rounded-full gradient-bg flex items-center justify-center text-white shadow-glow"
            whileTap={{ scale: 0.8 }}
          >
            <IconHeart size={22} />
          </motion.button>
        </div>
      )}

      {/* Match toast */}
      {match && (
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
                <img src={match.photo} alt={match.name} className="w-12 h-12 rounded-full object-cover border-2 border-bg" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-text">
                  <span className="gradient-text">Match !</span> {match.name}
                </p>
                <p className="text-[11px] text-text-muted">Vous etes dispos ce soir</p>
              </div>
              <button onClick={() => setMatch(null)} className="gradient-bg text-white px-4 py-2 rounded-full text-[12px] font-bold">
                Ecrire
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
