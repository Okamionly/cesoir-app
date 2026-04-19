"use client";

import { use, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { springs } from "@/lib/motion-design";
import { useSoiree, SOIREE_TYPES } from "@/lib/useSoiree";

function timeUntil(targetDate: Date): string {
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();
  if (diff <= 0) return "C'est l'heure";
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  return `${hours}h ${mins.toString().padStart(2, "0")}min`;
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

function initial(name: string): string {
  return name.charAt(0).toUpperCase();
}

export default function SoireeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { soiree, chat, loading, attendees, actions } = useSoiree(id);

  const [joined, setJoined] = useState(false);
  const [messageInput, setMessageInput] = useState("");

  // Resolve emoji from SOIREE_TYPES catalog (fallback star).
  const typeMeta = useMemo(() => {
    if (!soiree) return null;
    return SOIREE_TYPES.find((t) => t.key === soiree.type) ?? null;
  }, [soiree]);

  // Compute live countdown to soiree datetime.
  const targetDate = useMemo(() => (soiree ? new Date(soiree.datetime) : null), [soiree]);
  const [countdown, setCountdown] = useState<string>("--");
  useEffect(() => {
    if (!targetDate) return;
    setCountdown(timeUntil(targetDate));
    const interval = setInterval(() => setCountdown(timeUntil(targetDate)), 60_000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <motion.div
          className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
        />
      </div>
    );
  }

  if (!soiree) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg px-6 text-center">
        <p className="text-[18px] font-bold text-text mb-1">Soiree introuvable</p>
        <p className="text-[12px] text-text-muted mb-6">
          Elle a peut-etre ete annulee ou supprimee.
        </p>
        <button
          onClick={() => router.back()}
          className="gradient-bg text-white px-6 py-2.5 rounded-full text-[13px] font-semibold"
        >
          Retour
        </button>
      </div>
    );
  }

  const placesLeft = Math.max(0, soiree.maxPlaces - soiree.currentAttendees);

  async function sendMessage() {
    if (!messageInput.trim() || !soiree) return;
    await actions.sendSoireeMessage(soiree.id, messageInput.trim());
    setMessageInput("");
  }

  async function handleJoinToggle() {
    if (!soiree) return;
    if (joined) {
      await actions.leaveSoiree(soiree.id);
      setJoined(false);
    } else if (soiree.isPrivate) {
      await actions.requestJoin(soiree.id);
      setJoined(true);
    } else {
      await actions.joinSoiree(soiree.id);
      setJoined(true);
    }
  }

  return (
    <div className="min-h-screen bg-bg pb-32">
      {/* Hero */}
      <div className="relative h-64 gradient-bg flex items-center justify-center">
        <span className="text-[100px]">{typeMeta?.emoji ?? "✨"}</span>
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
          onClick={() =>
            navigator.share?.({ title: soiree.title, url: window.location.href }).catch(() => {})
          }
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
              <h1 className="text-[22px] font-bold text-text mb-1">{soiree.title}</h1>
              <p className="text-[13px] text-text-muted">{soiree.description}</p>
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
          href={`/p/${soiree.creatorId}`}
          className="flex items-center gap-3 bg-bg-card border border-border rounded-2xl p-4"
        >
          <div className="w-12 h-12 rounded-full overflow-hidden bg-accent/15 flex items-center justify-center">
            {soiree.creatorAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={soiree.creatorAvatar} alt={soiree.creatorName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-accent font-bold">{initial(soiree.creatorName)}</span>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[14px] font-semibold text-text">{soiree.creatorName}</span>
              {soiree.creatorVerified && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-accent">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              )}
            </div>
            <p className="text-[11px] text-text-muted">
              Confiance {soiree.creatorTrustScore}/100 · Hote
            </p>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </Link>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-bg-card border border-border rounded-xl p-3">
            <div className="text-[10px] text-text-muted uppercase font-semibold mb-1">Quand</div>
            <div className="text-[14px] font-semibold text-text">{soiree.date}</div>
            <div className="text-[12px] text-text-muted">{soiree.time}</div>
          </div>
          <div className="bg-bg-card border border-border rounded-xl p-3">
            <div className="text-[10px] text-text-muted uppercase font-semibold mb-1">Lieu</div>
            <div className="text-[14px] font-semibold text-text">{soiree.venue}</div>
            <div className="text-[12px] text-text-muted">Paris {soiree.arrondissement}</div>
          </div>
          <div className="bg-bg-card border border-border rounded-xl p-3">
            <div className="text-[10px] text-text-muted uppercase font-semibold mb-1">Budget</div>
            <div className="text-[14px] font-semibold text-text">{soiree.budget}</div>
          </div>
          <div className="bg-bg-card border border-border rounded-xl p-3">
            <div className="text-[10px] text-text-muted uppercase font-semibold mb-1">Dress code</div>
            <div className="text-[14px] font-semibold text-text">{soiree.dressCode}</div>
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
            {attendees.map((a) => (
              <div key={a.id} className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-full bg-accent/15 overflow-hidden flex items-center justify-center text-accent font-bold text-[14px]">
                  {a.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.avatar} alt={a.name} className="w-full h-full object-cover" />
                  ) : (
                    initial(a.name)
                  )}
                </div>
                <span className="text-[11px] text-text-muted">{a.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Group chat */}
        <div>
          <h2 className="text-[14px] font-semibold text-text mb-3">Discussion</h2>
          <div className="bg-bg-card border border-border rounded-2xl p-3 space-y-3 max-h-72 overflow-y-auto">
            {chat.length === 0 && (
              <p className="text-[12px] text-text-muted text-center py-3">
                Lance la conversation
              </p>
            )}
            {chat.map((m) => (
              <div key={m.id} className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-full bg-accent/15 overflow-hidden flex items-center justify-center text-accent font-bold text-[11px] shrink-0">
                  {m.userAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.userAvatar} alt={m.userName} className="w-full h-full object-cover" />
                  ) : (
                    initial(m.userName)
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[12px] font-semibold text-text">{m.userName}</span>
                    <span className="text-[10px] text-text-muted">{formatTime(m.createdAt)}</span>
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
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void sendMessage();
                }
              }}
              placeholder="Ecrire au groupe..."
              className="flex-1 px-4 py-2.5 bg-bg-card border border-border rounded-full text-[13px] text-text outline-none focus:border-accent"
            />
            <button
              onClick={() => void sendMessage()}
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
          onClick={() => void handleJoinToggle()}
          disabled={!joined && placesLeft === 0}
          className={`w-full py-3.5 rounded-xl font-semibold text-[15px] transition-all ${
            joined
              ? "bg-bg-card border border-border text-text-muted"
              : placesLeft === 0
                ? "bg-bg-card text-text-muted opacity-50 cursor-not-allowed"
                : "gradient-bg text-white"
          }`}
        >
          {joined
            ? "Annuler ma participation"
            : placesLeft === 0
              ? "Complet"
              : soiree.isPrivate
                ? "Demander a rejoindre"
                : "Rejoindre"}
        </button>
      </div>
    </div>
  );
}
