"use client";

import { m, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { usePausableInterval } from "@/lib/usePausableInterval";

/**
 * PhoneVideo — device mockup with 4 scenes cycling like a product demo video.
 * Scene rotation every 3.5s. Pauses on tab hidden (battery saver).
 *
 * Scenes:
 *   0. Mode selection — 14 modes grid
 *   1. Profile feed — nearby people available now
 *   2. Match notification — celebration moment
 *   3. Chat preview — message thread
 */
export default function PhoneVideo() {
  const [scene, setScene] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  usePausableInterval(() => setScene((s) => (s + 1) % 4), 3500);

  return (
    <div className="relative mx-auto" style={{ width: 280, height: 560 }}>
      {/* Ambient glow behind phone */}
      <div
        className="absolute inset-0 rounded-[50px]"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(139,92,246,0.25) 0%, transparent 60%)",
          filter: "blur(40px)",
          transform: "scale(1.4)",
        }}
      />

      {/* iPhone frame */}
      <m.div
        className="relative w-full h-full rounded-[44px] bg-black/95 border border-white/15 overflow-hidden"
        style={{
          boxShadow: "0 0 80px rgba(139,92,246,0.25), inset 0 0 0 2px rgba(255,255,255,0.08)",
        }}
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Dynamic Island / Notch */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[100px] h-[28px] bg-black rounded-full z-20" />

        {/* Screen content */}
        <div className="absolute inset-[3px] rounded-[41px] overflow-hidden bg-[#0A0A0D]">
          {/* Status bar */}
          <div className="absolute top-0 left-0 right-0 h-11 flex items-center justify-between px-6 z-10 pt-2">
            <span className="text-[11px] text-white/80 font-semibold">20:03</span>
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-white/60">●●●●</span>
              <span className="text-[9px] text-white/60">●</span>
            </div>
          </div>

          {/* Scene content */}
          <div className="absolute inset-0 pt-14">
            <AnimatePresence mode="wait">
              {mounted && scene === 0 && <SceneModes key="modes" />}
              {mounted && scene === 1 && <SceneFeed key="feed" />}
              {mounted && scene === 2 && <SceneMatch key="match" />}
              {mounted && scene === 3 && <SceneChat key="chat" />}
            </AnimatePresence>
          </div>

          {/* Bottom tab bar */}
          <div className="absolute bottom-0 left-0 right-0 h-16 border-t border-white/5 bg-black/80 flex items-center justify-around px-6">
            {[
              { icon: "☾", active: scene === 0 },
              { icon: "📍", active: scene === 1 },
              { icon: "♥", active: scene === 2 },
              { icon: "💬", active: scene === 3 },
            ].map((tab, i) => (
              <span
                key={i}
                className={`text-[18px] transition-colors ${tab.active ? "text-[#8B5CF6]" : "text-white/30"}`}
                style={tab.active ? { textShadow: "0 0 12px rgba(139,92,246,0.8)" } : {}}
              >
                {tab.icon}
              </span>
            ))}
          </div>
        </div>
      </m.div>

      {/* Scene indicator dots */}
      <div className="absolute -bottom-8 left-0 right-0 flex justify-center gap-2">
        {[0, 1, 2, 3].map((i) => (
          <button
            key={i}
            onClick={() => setScene(i)}
            className="transition-all"
            style={{
              width: i === scene ? 20 : 6,
              height: 6,
              borderRadius: 3,
              background: i === scene
                ? "linear-gradient(90deg, #8B5CF6, #00FF88)"
                : "rgba(255,255,255,0.2)",
            }}
            aria-label={`Scene ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Scenes
// ──────────────────────────────────────────────────────────

function SceneModes() {
  const modes = [
    { icon: "🍽️", name: "Solo Diner", color: "#8B5CF6" },
    { icon: "🌙", name: "Night Owl", color: "#6366F1" },
    { icon: "🐕", name: "Dog Date", color: "#EC4899" },
    { icon: "🗣️", name: "Langues", color: "#06B6D4" },
    { icon: "🏃", name: "Running", color: "#10B981" },
    { icon: "🎨", name: "Expo", color: "#F59E0B" },
    { icon: "🎮", name: "Gaming", color: "#8B5CF6" },
    { icon: "🎬", name: "Cinéma", color: "#EF4444" },
    { icon: "🎵", name: "Concert", color: "#EC4899" },
    { icon: "☕", name: "Café", color: "#78350F" },
    { icon: "🏋️", name: "Sport", color: "#10B981" },
    { icon: "🎲", name: "Jeux", color: "#6366F1" },
    { icon: "🌮", name: "Foodie", color: "#F59E0B" },
    { icon: "✨", name: "Surprise", color: "#EC4899" },
  ];

  return (
    <m.div
      className="h-full flex flex-col px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h3 className="text-[14px] font-bold text-white mb-1">Ce soir</h3>
      <p className="text-[10px] text-white/50 mb-3">Choisis ton mode</p>
      <div className="grid grid-cols-3 gap-2 overflow-hidden">
        {modes.slice(0, 12).map((mode, i) => (
          <m.div
            key={mode.name}
            className="flex flex-col items-center gap-1 p-2 rounded-xl border border-white/5"
            style={{ background: i === 0 ? `${mode.color}20` : "rgba(255,255,255,0.02)", borderColor: i === 0 ? `${mode.color}60` : "rgba(255,255,255,0.05)" }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            <span className="text-[16px]">{mode.icon}</span>
            <span className={`text-[7px] font-semibold truncate w-full text-center ${i === 0 ? "text-white" : "text-white/60"}`}>{mode.name}</span>
          </m.div>
        ))}
      </div>
    </m.div>
  );
}

function SceneFeed() {
  const profiles = [
    { name: "Marie, 26", mode: "Solo Diner", dist: "0.8 km", color: "#8B5CF6" },
    { name: "Lucas, 31", mode: "Night Owl", dist: "1.2 km", color: "#6366F1" },
    { name: "Amina, 24", mode: "Langues", dist: "2.1 km", color: "#06B6D4" },
    { name: "Kevin, 28", mode: "Gaming", dist: "0.5 km", color: "#EC4899" },
  ];

  return (
    <m.div
      className="h-full flex flex-col px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[14px] font-bold text-white">Près de toi</h3>
        <span className="text-[9px] text-[#00FF88] flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00FF88] animate-pulse" />
          Live
        </span>
      </div>
      <div className="space-y-2 overflow-hidden">
        {profiles.map((p, i) => (
          <m.div
            key={p.name}
            className="flex items-center gap-2 p-2.5 rounded-xl border border-white/5 bg-white/[0.02]"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <div
              className="w-9 h-9 rounded-full shrink-0"
              style={{ background: `linear-gradient(135deg, ${p.color}, ${p.color}88)` }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-white truncate">{p.name}</p>
              <p className="text-[8px] text-white/50">{p.mode} · {p.dist}</p>
            </div>
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px]"
              style={{ background: "linear-gradient(135deg, #8B5CF6, #00FF88)" }}
            >
              ♥
            </div>
          </m.div>
        ))}
      </div>
    </m.div>
  );
}

function SceneMatch() {
  return (
    <m.div
      className="h-full flex flex-col items-center justify-center px-6 relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Background pulse */}
      <m.div
        className="absolute inset-8 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(139,92,246,0.3), transparent 70%)" }}
        animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <m.div
        className="relative z-10 w-20 h-20 rounded-full flex items-center justify-center mb-4"
        style={{ background: "linear-gradient(135deg, #8B5CF6, #EC4899, #00FF88)" }}
        animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <span className="text-[36px]">♥</span>
      </m.div>
      <m.h2
        className="relative z-10 font-display text-[22px] font-black text-white text-center leading-tight mb-2"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        Match !
      </m.h2>
      <m.p
        className="relative z-10 text-[11px] text-white/70 text-center"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        Marie veut dîner à 20h<br />au <span className="text-[#8B5CF6] font-semibold">Petit Tonneau</span>
      </m.p>
    </m.div>
  );
}

function SceneChat() {
  const messages = [
    { from: "them", text: "Hey ! On se fait ce Solo Diner ?", delay: 0 },
    { from: "you", text: "Avec plaisir. 20h au Petit Tonneau ?", delay: 0.3 },
    { from: "them", text: "Parfait, à tout de suite 🌙", delay: 0.6 },
  ];

  return (
    <m.div
      className="h-full flex flex-col px-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center gap-2 pb-3 mb-2 border-b border-white/5">
        <div className="w-8 h-8 rounded-full" style={{ background: "linear-gradient(135deg, #8B5CF6, #8B5CF688)" }} />
        <div>
          <p className="text-[11px] font-bold text-white">Marie</p>
          <p className="text-[8px] text-[#00FF88]">● En ligne</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-2 overflow-hidden">
        {messages.map((msg, i) => (
          <m.div
            key={i}
            className={`max-w-[80%] px-3 py-2 rounded-2xl ${msg.from === "them" ? "self-start" : "self-end"}`}
            style={{
              background: msg.from === "them"
                ? "rgba(255,255,255,0.08)"
                : "linear-gradient(135deg, #8B5CF6, #00FF88)",
              color: msg.from === "them" ? "rgba(255,255,255,0.9)" : "white",
            }}
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: msg.delay }}
          >
            <p className="text-[10px] leading-snug">{msg.text}</p>
          </m.div>
        ))}
      </div>
    </m.div>
  );
}
