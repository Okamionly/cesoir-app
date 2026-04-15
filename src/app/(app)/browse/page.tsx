"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
import IntentionBadge, { type Intention, INTENTIONS } from "@/components/app/IntentionBadge";
import { useSwipeUndo } from "@/lib/useSwipeUndo";
import { useMatchCap } from "@/lib/useMatchCap";
import { useRoses } from "@/lib/useRoses";
import { useProfile } from "@/lib/useProfile";
import BoostButton from "@/components/app/BoostButton";
import HotStreak from "@/components/app/HotStreak";
import { FlashNoteButton } from "@/components/chat/FlashNote";
import GoingTonightBadge from "@/components/app/GoingTonightBadge";
import ProfileCompletion from "@/components/app/ProfileCompletion";
import ModeSwitcher from "@/components/app/ModeSwitcher";

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
  const searchParams = useSearchParams();
  const modeFromUrl = searchParams.get("mode") as ModeKey | null;
  const [filter, setFilter] = useState<ModeKey | "all">(
    modeFromUrl && MODES[modeFromUrl] ? modeFromUrl : "all"
  );
  const [intentionFilter, setIntentionFilter] = useState<Intention | "all">("all");
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

  // --- Feature hooks ---
  const { canUndo, freeUndosLeft, isPremium: undoIsPremium, pushSwipe, undo } = useSwipeUndo();
  const { matchesUsed, matchesRemaining, isAtCap, resetTime, incrementMatch } = useMatchCap();
  const { roses, useRose, canAfford, isPremium: rosesIsPremium } = useRoses();
  const { profile: userProfile, loading: profileLoading } = useProfile(user?.id);

  // Profile completion percent (derived from userProfile)
  const profilePercent = useMemo(() => {
    if (!userProfile) return 0;
    let score = 0;
    if (userProfile.avatar_url) score += 20;
    if (userProfile.bio && userProfile.bio.length > 0) score += 15;
    if (userProfile.is_verified) score += 20;
    // Rough estimate for the rest — modes, prompts, audio aren't on DbProfile yet
    score += 25; // baseline for existing account
    return Math.min(score, 100);
  }, [userProfile]);

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
      // Push to undo stack before advancing
      pushSwipe(card);

      if (action === "like") {
        const mode = currentMatch?.sharedModes[0] ?? card.mode;
        const result = await like(card.id, mode);
        if (result?.matched) {
          setMatch(card);
          setMatchConvoId(result.conversationId ?? null);
          incrementMatch();
        }
      } else {
        await pass(card.id);
      }
    }
    setIdx(i => Math.min(i + 1, list.length));
    setInfo(false);
    setShowPulse(false);
  }, [card, currentMatch, list.length, like, pass, pushSwipe, incrementMatch]);

  const handleSuperLike = useCallback(async () => {
    if (!card) return;

    // Spend a Rose for the super like
    const spent = useRose(1, `Super like sur ${card.name}`);
    if (!spent) return; // Not enough roses — button should be disabled but guard here

    pushSwipe(card);
    const mode = currentMatch?.sharedModes[0] ?? card.mode;
    const result = await superlike(card.id, mode);
    if (result?.matched) {
      setMatch(card);
      setMatchConvoId(null);
      incrementMatch();
    }
    setIdx(i => Math.min(i + 1, list.length));
    setInfo(false);
    setShowPulse(false);
  }, [card, currentMatch, list.length, superlike, useRose, pushSwipe, incrementMatch]);

  const handleUndo = useCallback(() => {
    const restored = undo();
    if (restored) {
      setIdx(i => Math.max(0, i - 1));
    }
  }, [undo]);

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

      {/* Profile completion nudge */}
      {!profileLoading && profilePercent < 80 && (
        <Link href="/profile/edit" className="shrink-0">
          <motion.div
            className="mx-4 mt-2 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-3"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="text-[14px]">{"\u270D\uFE0F"}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-amber-400">Complete ton profil pour plus de matchs</p>
              <p className="text-[10px] text-text-muted">{profilePercent}% — ajoute photo, bio et prompts</p>
            </div>
            <span className="text-[10px] text-amber-400 font-bold shrink-0">{profilePercent}%</span>
          </motion.div>
        </Link>
      )}

      {/* Header */}
      <header className="shrink-0 px-5 pt-3 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-[18px] font-black tracking-tight text-text">CeSoir</h1>
            {/* Hot Streak badge next to logo */}
            <HotStreak badgeOnly />
          </div>
          <div className="flex items-center gap-2">
            {/* Boost button — top right */}
            <BoostButton />
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

      {/* Mode switcher pill */}
      <ModeSwitcher active={filter} onChange={(m) => { setFilter(m); setIdx(0); }} />

      {/* Intention filter */}
      <IntentionFilter active={intentionFilter} onChange={(i) => { setIntentionFilter(i); setIdx(0); }} />

      {/* Card area — 3D Perspective deck */}
      <main ref={mainRef} className="flex-1 relative px-4 pb-1 overflow-hidden" style={{ perspective: 800 }} role="list" aria-label="Profils a decouvrir">
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
                role="listitem"
                aria-label={`${card.name}, ${card.age} ans — ${MODES[card.mode]?.name ?? card.mode}`}
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
                    <img src={next1.photo} alt="" loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover opacity-20 blur-[4px]" />
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

                {/* Overlays on card — badges & FlashNote */}
                <div className="absolute bottom-[42%] left-5 z-20 flex flex-wrap items-center gap-2 pointer-events-auto">
                  {/* Intention badge — derive from profile id for demo consistency */}
                  <IntentionBadge
                    intention={(["serieux", "casual", "verre", "amitie"] as const)[
                      card.id.charCodeAt(0) % 4
                    ]}
                    size="sm"
                  />

                  {/* Going tonight badge */}
                  {card.event && (
                    <GoingTonightBadge
                      eventName={card.event}
                      eventTime={card.time}
                      matchBonus={!!currentMatch?.sharedModes?.length}
                    />
                  )}
                </div>

                {/* FlashNote button — bottom-right of card */}
                <div className="absolute bottom-[42%] right-5 z-20 pointer-events-auto">
                  <FlashNoteButton
                    recipientName={card.name}
                    onSend={(msg) => {
                      // FlashNote sent — advance like a like
                      console.log(`FlashNote to ${card.name}: ${msg}`);
                      swipe.triggerLike();
                    }}
                  />
                </div>
              </motion.div>
            ) : (
              <EmptyState key="empty" onReset={() => { setIdx(0); setFilter("all"); refresh(); }} />
            )}
          </AnimatePresence>
        )}
      </main>

      {/* Match cap overlay */}
      {isAtCap && (
        <motion.div
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="bg-bg border border-accent/20 rounded-3xl p-8 mx-6 text-center shadow-glow max-w-sm"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-[28px]">{"\uD83D\uDD12"}</span>
            </div>
            <h2 className="text-[20px] font-black text-text mb-2">Tu as atteint ta limite !</h2>
            <p className="text-[14px] text-text-muted mb-1">
              {matchesUsed} matchs utilises ce soir.
            </p>
            <p className="text-[13px] text-text-muted mb-6">
              Reviens a {resetTime} ou passe Premium.
            </p>
            <Link
              href="/premium"
              className="inline-block gradient-bg text-white px-8 py-3 rounded-full text-[14px] font-semibold"
            >
              Passer Premium
            </Link>
          </motion.div>
        </motion.div>
      )}

      {/* Actions */}
      {card && !loading && (
        <ActionButtons
          onPass={swipe.triggerPass}
          onLike={swipe.triggerLike}
          onSuperLike={handleSuperLike}
          onUndo={handleUndo}
          canUndo={canUndo}
          freeUndosLeft={freeUndosLeft}
          undoIsPremium={undoIsPremium}
          roses={roses}
          canAffordRose={canAfford(1)}
        />
      )}

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

function ActionButtons({
  onPass,
  onLike,
  onSuperLike,
  onUndo,
  canUndo,
  freeUndosLeft,
  undoIsPremium,
  roses,
  canAffordRose,
}: {
  onPass: () => void;
  onLike: () => void;
  onSuperLike: () => void;
  onUndo: () => void;
  canUndo: boolean;
  freeUndosLeft: number;
  undoIsPremium: boolean;
  roses: number;
  canAffordRose: boolean;
}) {
  return (
    <div className="shrink-0 pt-2 pb-[76px]" role="group" aria-label="Actions">
      <div className="flex items-center justify-center gap-4">
        {/* Undo button */}
        <motion.button
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="Annuler le dernier swipe"
          className={`w-[40px] h-[40px] rounded-full border-2 flex items-center justify-center transition-all ${
            canUndo
              ? "bg-bg border-amber-500/40 text-amber-400"
              : "bg-bg border-border text-text-muted/30 cursor-not-allowed"
          }`}
          whileTap={canUndo ? micro.tapScale : {}}
          whileHover={canUndo ? micro.hoverLift : {}}
        >
          <span className="text-[16px]">{"\u21A9\uFE0F"}</span>
        </motion.button>

        {/* Pass */}
        <motion.button onClick={onPass} aria-label="Passer" className="w-[54px] h-[54px] rounded-full bg-bg border-2 border-border flex items-center justify-center text-text-muted" whileTap={micro.tapScale} whileHover={micro.hoverLift}>
          <IconX size={22} />
        </motion.button>

        {/* Super Like (Rose) */}
        <motion.button
          onClick={onSuperLike}
          disabled={!canAffordRose}
          aria-label={`Super like (${roses} roses)`}
          className={`relative w-[44px] h-[44px] rounded-full border-2 flex items-center justify-center ${
            canAffordRose
              ? "bg-bg border-pink-500/40 text-pink-400"
              : "bg-bg border-border text-text-muted/30 cursor-not-allowed"
          }`}
          whileTap={canAffordRose ? micro.tapScale : {}}
          whileHover={canAffordRose ? micro.hoverLift : {}}
        >
          <IconStar size={18} />
          {/* Rose counter badge */}
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-pink-500 text-white text-[9px] font-bold flex items-center justify-center">
            {roses}
          </span>
        </motion.button>

        {/* Like */}
        <motion.button onClick={onLike} aria-label="Liker" className="w-[54px] h-[54px] rounded-full gradient-bg flex items-center justify-center text-white shadow-glow" whileTap={micro.tapScale} whileHover={micro.hoverLift}>
          <IconHeart size={22} />
        </motion.button>
      </div>

      {/* Undo status text */}
      <p className="text-center text-[10px] text-text-muted mt-1.5">
        {canUndo
          ? undoIsPremium
            ? "Undo illimite"
            : `${freeUndosLeft} undo restant`
          : undoIsPremium
            ? "Rien a annuler"
            : freeUndosLeft <= 0
              ? "Premium pour plus d\u2019undos"
              : "Swipe pour debloquer l\u2019undo"}
      </p>
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

function IntentionFilter({ active, onChange }: { active: Intention | "all"; onChange: (i: Intention | "all") => void }) {
  return (
    <div className="shrink-0 flex gap-2 px-5 pb-2 overflow-x-auto no-scrollbar">
      <button
        onClick={() => onChange("all")}
        className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-semibold border transition-all ${
          active === "all" ? "border-accent bg-accent/10 text-accent" : "border-border text-text-muted hover:text-text-soft"
        }`}
      >
        Toutes
      </button>
      {(Object.keys(INTENTIONS) as Intention[]).map((key) => {
        const { emoji, label } = INTENTIONS[key];
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-semibold border transition-all ${
              active === key ? "border-accent bg-accent/10 text-accent" : "border-border text-text-muted hover:text-text-soft"
            }`}
          >
            {emoji} {label}
          </button>
        );
      })}
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
            <img src={profile.photo} alt={profile.name} loading="lazy" decoding="async" className="w-12 h-12 rounded-full object-cover border-2 border-bg" />
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
