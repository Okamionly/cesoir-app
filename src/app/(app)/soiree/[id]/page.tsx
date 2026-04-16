"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { springs } from "@/lib/motion-design";

const MOCK_SOIREE = {
  id: "s1",
  type: "diner",
  emoji: "🍽️",
  title: "Diner italien chez moi",
  description: "Pates fraiches faites maison, vin rouge, ambiance cosy. Venez detendus !",
  date: "Ce soir",
  time: "20h00",
  venue: "Chez Marie",
  arrondissement: "11e",
  isAtHome: true,
  maxPlaces: 6,
  budget: "10-20€",
  dressCode: "Casual",
  ambiance: "Chill",
  bringWhat: ["A boire"],
  isPrivate: false,
  creator: { name: "Marie", avatar: "M", verified: true, trustScore: 92 },
  attendees: [
    { id: "u1", name: "Lucas", avatar: "L" },
    { id: "u2", name: "Amina", avatar: "A" },
    { id: "u3", name: "Hugo", avatar: "H" },
  ],
  tags: ["Italien", "Cosy"],
};

const MOCK_MESSAGES = [
  { id: "m1", userName: "Marie", userAvatar: "M", content: "Salut tout le monde ! Hate de vous voir ce soir 🍷", time: "18h12" },
  { id: "m2", userName: "Lucas", userAvatar: "L", content: "Je ramene une bouteille de Chianti", time: "18h25" },
  { id: "m3", userName: "Amina", userAvatar: "A", content: "Parfait ! J&apos;arrive vers 20h", time: "19h03" },
];

function timeUntil(targetHour: number): string {
  const now = new Date();
  const target = new Date();
  target.setHours(targetHour, 0, 0, 0);
  if (target.getTime() < now.getTime()) target.setDate(target.getDate() + 1);
  const diff = target.getTime() - now.getTime();
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  return `${hours}h ${mins.toString().padStart(2, "0")}min`;
}

export default function SoireeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  use(params); // params consumed for compatibility
  const router = useRouter();
  const [joined, setJoined] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [countdown, setCountdown] = useState(timeUntil(20));

  useEffect(() => {
    const interval = setInterval(() => setCountdown(timeUntil(20)), 60000);
    return () => clearInterval(interval);
  }, []);

  const placesLeft = MOCK_SOIREE.maxPlaces - MOCK_SOIREE.attendees.length - (joined ? 1 : 0);

  function sendMessage() {
    if (!messageInput.trim()) return;
    setMessages((prev) => [...prev, {
      id: `m${Date.now()}`,
      userName: "Toi",
      userAvatar: "Y",
      content: messageInput,
      time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    }]);
    setMessageInput("");
  }

  return (
    <div className="min-h-screen bg-bg pb-32">
      {/* Hero */}
      <div className="relative h-64 gradient-bg flex items-center justify-center">
        <span className="text-[100px]">{MOCK_SOIREE.emoji}</span>
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white"
          aria-label="Retour"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <button
          onClick={() => navigator.share?.({ title: MOCK_SOIREE.title, url: window.location.href })}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white"
          aria-label="Partager"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="px-5 -mt-6 relative z-10 space-y-5">
        {/* Title card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springs.heavy}
          className="bg-bg-card border border-border rounded-2xl p-5"
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h1 className="text-[22px] font-bold text-text mb-1">{MOCK_SOIREE.title}</h1>
              <p className="text-[13px] text-text-muted">{MOCK_SOIREE.description}</p>
            </div>
          </div>

          {/* Countdown */}
          <div className="bg-accent/5 border border-accent/15 rounded-xl p-3 flex items-center justify-between mt-3">
            <span className="text-[12px] text-text-muted">Commence dans</span>
            <span className="text-[15px] font-bold text-accent">{countdown}</span>
          </div>
        </motion.div>

        {/* Host */}
        <Link
          href={`/p/${MOCK_SOIREE.creator.name}`}
          className="flex items-center gap-3 bg-bg-card border border-border rounded-2xl p-4"
        >
          <div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center text-white font-bold">
            {MOCK_SOIREE.creator.avatar}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[14px] font-semibold text-text">{MOCK_SOIREE.creator.name}</span>
              {MOCK_SOIREE.creator.verified && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-accent">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              )}
            </div>
            <p className="text-[11px] text-text-muted">Confiance {MOCK_SOIREE.creator.trustScore}/100 · Hote</p>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </Link>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-bg-card border border-border rounded-xl p-3">
            <div className="text-[10px] text-text-muted uppercase font-semibold mb-1">Quand</div>
            <div className="text-[14px] font-semibold text-text">{MOCK_SOIREE.date}</div>
            <div className="text-[12px] text-text-muted">{MOCK_SOIREE.time}</div>
          </div>
          <div className="bg-bg-card border border-border rounded-xl p-3">
            <div className="text-[10px] text-text-muted uppercase font-semibold mb-1">Lieu</div>
            <div className="text-[14px] font-semibold text-text">{MOCK_SOIREE.venue}</div>
            <div className="text-[12px] text-text-muted">Paris {MOCK_SOIREE.arrondissement}</div>
          </div>
          <div className="bg-bg-card border border-border rounded-xl p-3">
            <div className="text-[10px] text-text-muted uppercase font-semibold mb-1">Budget</div>
            <div className="text-[14px] font-semibold text-text">{MOCK_SOIREE.budget}</div>
          </div>
          <div className="bg-bg-card border border-border rounded-xl p-3">
            <div className="text-[10px] text-text-muted uppercase font-semibold mb-1">Dress code</div>
            <div className="text-[14px] font-semibold text-text">{MOCK_SOIREE.dressCode}</div>
          </div>
        </div>

        {/* Attendees */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[14px] font-semibold text-text">Participants</h2>
            <span className={`text-[12px] font-medium ${
              placesLeft === 0 ? "text-red-500" : placesLeft <= 2 ? "text-amber-500" : "text-accent-2"
            }`}>
              {placesLeft === 0 ? "Complet" : `${placesLeft} place${placesLeft > 1 ? "s" : ""} restante${placesLeft > 1 ? "s" : ""}`}
            </span>
          </div>
          <div className="flex flex-wrap gap-3">
            {MOCK_SOIREE.attendees.map((a) => (
              <div key={a.id} className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-full bg-accent/15 flex items-center justify-center text-accent font-bold text-[14px]">
                  {a.avatar}
                </div>
                <span className="text-[11px] text-text-muted">{a.name}</span>
              </div>
            ))}
            {joined && (
              <div className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center text-white font-bold text-[14px]">Y</div>
                <span className="text-[11px] text-accent font-semibold">Toi</span>
              </div>
            )}
          </div>
        </div>

        {/* Group chat */}
        <div>
          <h2 className="text-[14px] font-semibold text-text mb-3">Discussion</h2>
          <div className="bg-bg-card border border-border rounded-2xl p-3 space-y-3 max-h-72 overflow-y-auto">
            {messages.map((m) => (
              <div key={m.id} className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-full bg-accent/15 flex items-center justify-center text-accent font-bold text-[11px] shrink-0">
                  {m.userAvatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[12px] font-semibold text-text">{m.userName}</span>
                    <span className="text-[10px] text-text-muted">{m.time}</span>
                  </div>
                  <p className="text-[13px] text-text mt-0.5">{m.content}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <input
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ecrire au groupe..."
              className="flex-1 px-4 py-2.5 bg-bg-card border border-border rounded-full text-[13px] text-text outline-none focus:border-accent"
            />
            <button
              onClick={sendMessage}
              className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-white"
              aria-label="Envoyer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-bg/95 backdrop-blur-xl border-t border-border">
        <button
          onClick={() => setJoined(!joined)}
          disabled={!joined && placesLeft === 0}
          className={`w-full py-3.5 rounded-xl font-semibold text-[15px] transition-all ${
            joined
              ? "bg-bg-card border border-border text-text-muted"
              : placesLeft === 0
                ? "bg-bg-card text-text-muted opacity-50 cursor-not-allowed"
                : "gradient-bg text-white"
          }`}
        >
          {joined ? "Annuler ma participation" : placesLeft === 0 ? "Complet" : MOCK_SOIREE.isPrivate ? "Demander a rejoindre" : "Rejoindre"}
        </button>
      </div>
    </div>
  );
}
