"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { browseVariants, springs, micro } from "@/lib/motion-design";
import { ModeKey, MODES, MODE_KEYS } from "@/lib/modes";
import { MOCK_PROFILES, Profile } from "@/lib/mock-profiles";
import { useSwipe } from "@/lib/useSwipe";
import { useAuth } from "@/context/AuthContext";
import { useGeolocation } from "@/lib/useGeolocation";
import { useMatches } from "@/lib/useMatches";
import { useInteractions } from "@/lib/useInteractions";
import type { MatchCandidate } from "@/lib/matching";
import type { ReportReason } from "@/lib/supabase-types";
import { MODE_ICONS, IconHeart, IconX, IconStar } from "@/components/ui/Icons";
import PulseClock from "@/components/app/PulseClock";
import SwipeCard from "@/components/app/SwipeCard";
import ReportSheet from "@/components/app/ReportSheet";
import StoriesBar from "@/components/app/StoriesBar";
import ConfirmDispo from "@/components/app/ConfirmDispo";
import Revanche from "@/components/app/Revanche";
import NotificationPreview from "@/components/app/NotificationPreview";
import MidnightReset from "@/components/app/MidnightReset";

/** Map a MatchCandidate from the scoring pipeline to the Profile shape used by SwipeCard */
function candidateToProfile(c: MatchCandidate): Profile {
  return {
    id: c.id,
    name: c.name,
    age: c.age,
    mode: c.sharedModes[0] ?? c.activeModes[0] ?? ("solo-diner" as ModeKey),
    bio: c.bio,
    distance: c.distance_km,
    time: c.availableTime ?? "Dispo maintenant",
    color: "#8B5CF6",
    photo: c.avatar_url ?? `https://randomuser.me/api/portraits/lego/${Math.floor(Math.random() * 10)}.jpg`,
  };
}

export default function BrowsePage() {
  const { user } = useAuth();
  const { latitude, longitude } = useGeolocation();
  const [filter, setFilter] = useState<ModeKey | "all">("all");
  const [idx, setIdx] = useState(0);
  const [info, setInfo] = useState(false);
  const [match, setMatch] = useState<Profile | null>(null);
  const [matchConvoId, setMatchConvoId] = useState<string | null>(null);
  const [showPulse, setShowPulse] = useState(false);
  const [showReport, setShowReport] = useState(false);

  // Real matching pipeline
  const { matches, loading, error, refresh } = useMatches({
    limit: 20,
    mode: filter === "all" ? null : filter,
  });
  const { like, pass, superlike, report } = useInteractions(user?.id);

  // Convert scored matches to Profile shape for SwipeCard
  const realProfiles: Profile[] = matches.map(candidateToProfile);

  // Fallback to mock data for demo
  const mockFallback: Profile[] =
    filter === "all"
      ? MOCK_PROFILES
      : MOCK_PROFILES.filter((p) => p.mode === filter);
  const list = realProfiles.length > 0 ? realProfiles : mockFallback;

  const card = list[idx];
  const next1 = list[idx + 1];

  // Find the original MatchCandidate for the current card (needed for mode info on like/superlike)
  const currentMatch = matches.find((m) => m.id === card?.id);

  useEffect(() => {
    if (match) {
      const t = setTimeout(() => setMatch(null), 4000);
      return () => clearTimeout(t);
    }
  }, [match]);

  // Reset index when filter or matches change
  useEffect(() => {
    setIdx(0);
  }, [filter, matches.length]);

  const handleAction = useCallback(async (action: "like" | "pass") => {
    if (card) {
      if (action === "like") {
        const mode = currentMatch?.sharedModes[0] ?? card.mode;
        const result = await like(card.id, mode);
        if (result?.matched) {
          setMatch(card);
          setMatchConvoId(result.conversationId ?? null);
        }
      } else {
        await pass(card.id);
      }
    }
    setIdx(i => Math.min(i + 1, list.length));
    setInfo(false);
    setShowPulse(false);
  }, [card, currentMatch, list.length, like, pass]);

  const handleSuperLike = useCallback(async () => {
    if (!card) return;
    const mode = currentMatch?.sharedModes[0] ?? card.mode;
    const result = await superlike(card.id, mode);
    if (result?.matched) {
      setMatch(card);
      setMatchConvoId(null);
    }
    setIdx(i => Math.min(i + 1, list.length));
    setInfo(false);
    setShowPulse(false);
  }, [card, currentMatch, list.length, superlike]);

  const swipe = useSwipe(handleAction);

  // --- Pull-to-refresh ---
  const mainRef = useRef<HTMLDivElement>(null);
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const touchStartY = useRef(0);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (refreshing) return;
    const el = mainRef.current;
    if (el && el.scrollTop > 0) return; // Only pull-to-refresh when at top
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0) {
      setPullY(Math.min(delta * 0.4, 80));
    }
  }, [refreshing]);

  const onTouchEnd = useCallback(async () => {
    if (pullY > 50) {
      setRefreshing(true);
      refresh();
      setIdx(0);
      // Give time for the fetch to complete
      await new Promise((r) => setTimeout(r, 800));
      setRefreshing(false);
    }
    setPullY(0);
  }, [pullY, refresh]);

  return (
    <div
      className="h-screen bg-bg flex flex-col max-w-lg mx-auto"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      {(pullY > 0 || refreshing) && (
        <div
          className="shrink-0 flex items-center justify-center overflow-hidden transition-all"
          style={{ height: refreshing ? 40 : pullY }}
        >
          <motion.div
            className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full"
            animate={{ rotate: refreshing ? 360 : pullY * 3 }}
            transition={refreshing ? { repeat: Infinity, duration: 0.6, ease: "linear" } : { duration: 0 }}
          />
        </div>
      )}

      {/* Header */}
      <header className="shrink-0 px-5 pt-3 pb-2">
        <div className="flex items-center justify-between">
          <h1 className="text-[18px] font-black tracking-tight text-text">CeSoir</h1>
          <div className="flex items-center gap-2">
            <Link
              href="/flash-plans"
              className="flex items-center gap-1 bg-accent/10 border border-accent/20 px-2.5 py-1 rounded-full tap-target"
            >
              <span className="text-[10px]" aria-hidden="true">&#x26A1;</span>
              <span className="text-[10px] text-accent font-semibold">Flash Plans</span>
            </Link>
            <button onClick={() => setShowPulse(!showPulse)} className="text-[11px] text-accent font-semibold tap-target py-1">
              {showPulse ? "Masquer" : "Pulse"} &middot; {list.length}
            </button>
          </div>
        </div>
      </header>

      {/* Notification Preview — floating overlay */}
      <NotificationPreview />

      {/* Midnight Reset */}
      <MidnightReset />

      {/* Mode filter */}
      <ModeFilter active={filter} onChange={(m) => { setFilter(m); setIdx(0); }} />

      {/* Card area — 3D Perspective deck */}
      <main ref={mainRef} className="flex-1 relative px-4 pb-1 overflow-hidden" style={{ perspective: 800 }}>
        {/* Loading skeleton — 3 placeholder cards with pulse animation */}
        {loading && matches.length === 0 && (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-full rounded-[28px] bg-border/30"
                style={{
                  height: i === 0 ? "70%" : i === 1 ? "60%" : "50%",
                  position: i === 0 ? "relative" : "absolute",
                  top: i === 0 ? 0 : `${4 + i * 6}%`,
                  left: i === 0 ? 0 : `${2 + i * 2}%`,
                  right: i === 0 ? 0 : `${2 + i * 2}%`,
                  zIndex: 3 - i,
                  opacity: 1 - i * 0.3,
                  scale: 1 - i * 0.04,
                }}
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        )}

        {/* Error state */}
        {error && !loading && matches.length === 0 && realProfiles.length === 0 && (
          <div className="w-full h-full flex flex-col items-center justify-center text-center px-8">
            <p className="text-[14px] text-text-muted mb-4">{error}</p>
            <button onClick={refresh} className="gradient-bg text-white px-6 py-2.5 rounded-full text-[13px] font-semibold">
              Reessayer
            </button>
          </div>
        )}

        {/* Card stack */}
        {!loading && (
          <AnimatePresence mode="popLayout">
            {card ? (
              <motion.div
                key={card.id}
                className="w-full h-full"
                variants={browseVariants.card}
                initial="initial"
                animate="center"
                exit="swipeLeft"
                whileHover={{ rotateY: 3, transition: springs.gentle }}
                whileTap={{ scale: 0.97, transition: springs.micro }}
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* Stacked card behind — physical depth illusion */}
                {next1 && (
                  <motion.div
                    className="absolute inset-x-5 top-1 bottom-2 rounded-[28px] overflow-hidden z-[1]"
                    animate={browseVariants.stack.behind(1)}
                    style={{ scale: swipe.nextScale }}
                  >
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
                  onReport={() => setShowReport(true)}
                />
              </motion.div>
            ) : (
              <EmptyState key="empty" onReset={() => { setIdx(0); setFilter("all"); refresh(); }} />
            )}
          </AnimatePresence>
        )}
      </main>

      {/* Actions */}
      {card && !loading && <ActionButtons onPass={swipe.triggerPass} onLike={swipe.triggerLike} onSuperLike={handleSuperLike} />}

      {/* Match toast */}
      {match && <MatchToast profile={match} conversationId={matchConvoId} onDismiss={() => { setMatch(null); setMatchConvoId(null); }} />}

      {/* Report sheet */}
      {card && (
        <ReportSheet
          profileName={card.name}
          isOpen={showReport}
          onClose={() => setShowReport(false)}
          onReport={async (reason, details) => {
            await report(card.id, reason as ReportReason, details);
            setShowReport(false);
            swipe.triggerPass();
          }}
        />
      )}
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

function ActionButtons({ onPass, onLike, onSuperLike }: { onPass: () => void; onLike: () => void; onSuperLike: () => void }) {
  return (
    <div className="shrink-0 flex items-center justify-center gap-6 pt-2 pb-[76px]" role="group" aria-label="Actions">
      <motion.button onClick={onPass} aria-label="Passer" className="w-[54px] h-[54px] rounded-full bg-bg border-2 border-border flex items-center justify-center text-text-muted" whileTap={micro.tapScale} whileHover={micro.hoverLift}>
        <IconX size={22} />
      </motion.button>
      <motion.button onClick={onSuperLike} aria-label="Super like" className="w-[44px] h-[44px] rounded-full bg-bg border-2 border-border flex items-center justify-center text-text-muted" whileTap={micro.tapScale} whileHover={micro.hoverLift}>
        <IconStar size={18} />
      </motion.button>
      <motion.button onClick={onLike} aria-label="Liker" className="w-[54px] h-[54px] rounded-full gradient-bg flex items-center justify-center text-white shadow-glow" whileTap={micro.tapScale} whileHover={micro.hoverLift}>
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

function MatchToast({ profile, conversationId, onDismiss }: { profile: Profile; conversationId: string | null; onDismiss: () => void }) {
  return (
    <motion.div
      role="alert" aria-live="assertive"
      className="fixed bottom-24 left-4 right-4 z-50"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={springs.elastic}
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
          {conversationId ? (
            <Link href={`/chat/${conversationId}`} onClick={onDismiss} className="gradient-bg text-white px-4 py-2 rounded-full text-[12px] font-bold">Ecrire</Link>
          ) : (
            <button onClick={onDismiss} className="gradient-bg text-white px-4 py-2 rounded-full text-[12px] font-bold">Ecrire</button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
