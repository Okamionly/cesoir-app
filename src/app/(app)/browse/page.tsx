"use client";

import { useState, useCallback, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { browseVariants, springs, micro } from "@/lib/motion-design";
import { Magnetic } from "@/components/motion/Magnetic";
import { ModeKey, MODES } from "@/lib/modes";
import type { Profile } from "@/lib/mock-profiles";
import { useSwipe } from "@/lib/useSwipe";
import { useAuth } from "@/context/AuthContext";
import { useGeolocation } from "@/lib/useGeolocation";
import { useMatches } from "@/lib/useMatches";
import { useInteractions } from "@/lib/useInteractions";
import type { MatchCandidate } from "@/lib/matching";
import type { ReportReason } from "@/lib/supabase-types";
import { IconHeart, IconX, IconStar } from "@/components/ui/Icons";
import SwipeCard from "@/components/app/SwipeCard";
import ReportSheet from "@/components/app/ReportSheet";
import NotificationPreview from "@/components/app/NotificationPreview";
import MidnightReset from "@/components/app/MidnightReset";
import PageHeader from "@/components/ui/PageHeader";
import { RotateCcw } from "@/components/ui/lucide";
import { playSound } from "@/lib/sounds";
import { haptics } from "@/lib/haptics";
import { useSwipeUndo } from "@/lib/useSwipeUndo";
import { useMatchCap } from "@/lib/useMatchCap";
import { useRoses } from "@/lib/useRoses";
import { MONETIZATION_ENABLED } from "@/lib/featureFlags";
import { app as appTokens } from "@/lib/design-tokens";
import ModeSwitcher from "@/components/app/ModeSwitcher";
import MatchCinematic from "@/components/app/MatchCinematic";
import { trackFirstTime } from "@/lib/analytics";

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
    color: "var(--color-accent)",
    photo: c.avatar_url ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name || "?")}&background=8B5CF6&color=fff&bold=true&size=256&format=svg`,
    is_founder: c.is_founder,
  };
}

function BrowsePageInner() {
  const { user } = useAuth();
  // 2026-04-24 (CPO-002): we now pull `error` + `loading` from the geo hook
  // so we can show a specific "enable location" state instead of silently
  // rendering EmptyState ("C'est tout pour ce soir") which was the main
  // reason users bounced on first iOS launch.
  const {
    latitude,
    longitude,
    loading: geoLoading,
    error: geoError,
  } = useGeolocation();
  const searchParams = useSearchParams();
  const modeFromUrl = searchParams.get("mode") as ModeKey | null;
  const [filter, setFilter] = useState<ModeKey | "all">(
    modeFromUrl && MODES[modeFromUrl] ? modeFromUrl : "all"
  );
  const [idx, setIdx] = useState(0);
  const [info, setInfo] = useState(false);
  const [match, setMatch] = useState<Profile | null>(null);
  const [matchConvoId, setMatchConvoId] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);

  // Real matching pipeline
  const { matches, loading, error, refresh } = useMatches({
    limit: 20,
    mode: filter === "all" ? null : filter,
  });
  const { like, pass, superlike, report } = useInteractions(user?.id);

  // --- Feature hooks ---
  const { canUndo, pushSwipe, undo } = useSwipeUndo();
  const { matchesUsed, isAtCap, resetTime, incrementMatch } = useMatchCap();
  const { roses, useRose, canAfford } = useRoses();

  // Convert scored matches to Profile shape for SwipeCard
  const list: Profile[] = matches.map(candidateToProfile);

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
      // Wave 15 · CPO core-loop event #3
      trackFirstTime("first_swipe", {
        direction: action,
        mode: currentMatch?.sharedModes[0] ?? card.mode ?? null,
      });

      // Push to undo stack before advancing
      pushSwipe(card);

      if (action === "like") {
        playSound("like");
        haptics.medium();
        const mode = currentMatch?.sharedModes[0] ?? card.mode;
        const result = await like(card.id, mode);
        if (result?.matched) {
          playSound("match");
          haptics.heavy();
          setMatch(card);
          setMatchConvoId(result.conversationId ?? null);
          incrementMatch();
          // Wave 15 · CPO core-loop event #4
          trackFirstTime("first_match", {
            mode: mode ?? null,
            peer_id: card.id,
          });
        }
      } else {
        haptics.light();
        await pass(card.id);
      }
    }
    setIdx(i => Math.min(i + 1, list.length));
    setInfo(false);
  }, [card, currentMatch, list.length, like, pass, pushSwipe, incrementMatch]);

  const handleSuperLike = useCallback(async () => {
    if (!card) return;

    // Spend a Rose for the super like
    const spent = useRose(1, `Super like sur ${card.name}`);
    if (!spent) return; // Not enough roses — button should be disabled but guard here

    playSound("match");
    haptics.match();
    // Wave 15 · CPO core-loop event #3 (superlike counts as first swipe)
    trackFirstTime("first_swipe", {
      direction: "superlike",
      mode: currentMatch?.sharedModes[0] ?? card.mode ?? null,
    });
    pushSwipe(card);
    const mode = currentMatch?.sharedModes[0] ?? card.mode;
    const result = await superlike(card.id, mode);
    if (result?.matched) {
      playSound("match");
      haptics.heavy();
      setMatch(card);
      setMatchConvoId(null);
      incrementMatch();
      trackFirstTime("first_match", { mode: mode ?? null, peer_id: card.id });
    }
    setIdx(i => Math.min(i + 1, list.length));
    setInfo(false);
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

      <div className="shrink-0">
        <PageHeader
          title="CeSoir"
          titleClassName="text-[18px] font-black tracking-tight"
          sticky={false}
          borderless
          actions={
            <Link
              href="/plans?type=flash"
              className="flex items-center justify-center w-8 h-8 rounded-full bg-accent/10 border border-accent/20 tap-target"
              aria-label="Flash Plans"
            >
              <span className="text-[12px]" aria-hidden="true">&#x26A1;</span>
            </Link>
          }
        />
      </div>

      {/* Notification Preview — floating overlay */}
      <NotificationPreview />

      {/* Midnight Reset */}
      <MidnightReset />

      {/* Mode switcher */}
      <ModeSwitcher active={filter} onChange={(m) => { setFilter(m); setIdx(0); }} />

      {/* Card area — 3D Perspective deck */}
      <main ref={mainRef} className="flex-1 relative px-4 pb-1 overflow-hidden" style={{ perspective: 800 }} role="list" aria-label="Profils a decouvrir">
        {/* Geolocation denied / unavailable — show a dedicated CTA state
            (CPO-002). Previously we fell through to "C'est tout pour ce soir"
            EmptyState which told the user nothing useful. */}
        {!geoLoading && geoError && (!latitude || !longitude) && (
          <div className="w-full h-full flex flex-col items-center justify-center text-center px-8">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-5">
              <span className="text-[28px]" aria-hidden="true">📍</span>
            </div>
            <p className="text-[17px] font-bold mb-1 text-text">
              Active la géolocalisation
            </p>
            <p className="text-[13px] text-text-muted mb-6 max-w-xs">
              {geoError} — CeSoir matche les gens proches de toi ce soir, sans
              ta position on ne peut rien te proposer.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="gradient-bg text-white px-8 py-3 rounded-full text-[14px] font-semibold"
            >
              Réessayer
            </button>
            <Link
              href="/help"
              className="text-[12px] text-accent mt-4"
            >
              Comment l&apos;activer sur iPhone / Android ?
            </Link>
          </div>
        )}

        {/* Loading skeleton — 3 placeholder cards with pulse animation */}
        {!geoError && loading && matches.length === 0 && (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-full rounded-3xl bg-border/30"
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
        {error && !loading && matches.length === 0 && (
          <div className="w-full h-full flex flex-col items-center justify-center text-center px-8">
            <p className="text-[14px] text-text-muted mb-4">{error}</p>
            <button onClick={refresh} className="gradient-bg text-white px-6 py-2.5 rounded-full text-[13px] font-semibold">
              Reessayer
            </button>
          </div>
        )}

        {/* Card stack (suppressed when geoloc missing so user sees the
            dedicated geo-denied state instead of a misleading empty state). */}
        {!loading && !geoError && (
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
                    className="absolute inset-x-5 top-1 bottom-2 rounded-3xl overflow-hidden z-[1]"
                    animate={browseVariants.stack.behind(1)}
                    style={{ scale: swipe.nextScale }}
                  >
                    <div className="absolute inset-0 bg-[var(--color-bg-dark)]" />
                    <Image src={next1.photo} alt="" fill sizes="(max-width: 640px) 100vw, 400px" className="object-cover opacity-20 blur-[4px]" />
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
              {MONETIZATION_ENABLED
                ? `Reviens a ${resetTime} ou passe Premium.`
                : `Reviens a ${resetTime} pour continuer.`}
            </p>
            {MONETIZATION_ENABLED ? (
              <Link
                href="/premium"
                className="inline-block gradient-bg text-white px-8 py-3 rounded-full text-[14px] font-semibold"
              >
                Passer Premium
              </Link>
            ) : (
              <Link
                href="/why-free"
                className="inline-block gradient-bg text-white px-8 py-3 rounded-full text-[14px] font-semibold"
              >
                Pourquoi gratuit ?
              </Link>
            )}
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
          canAffordRose={canAfford(1)}
        />
      )}

      {/* Match cinematic takeover — Wave 15 · CPO brief */}
      <MatchCinematic
        open={Boolean(match)}
        peerId={match?.id ?? ""}
        peerName={match?.name ?? ""}
        peerPhoto={match?.photo ?? ""}
        sharedMode={currentMatch?.sharedModes[0] ?? match?.mode ?? null}
        conversationId={matchConvoId}
        onDismiss={() => {
          setMatch(null);
          setMatchConvoId(null);
        }}
      />

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

function ActionButtons({
  onPass,
  onLike,
  onSuperLike,
  onUndo,
  canUndo,
  canAffordRose,
}: {
  onPass: () => void;
  onLike: () => void;
  onSuperLike: () => void;
  onUndo: () => void;
  canUndo: boolean;
  canAffordRose: boolean;
}) {
  return (
    <div className="shrink-0 pt-2 pb-[76px]" role="group" aria-label="Actions">
      {/* Small undo icon above main row */}
      <div className="flex justify-center mb-2">
        <motion.button
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="Annuler le dernier swipe"
          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
            canUndo
              ? "text-text-muted hover:text-text"
              : "text-text-muted/20 cursor-not-allowed"
          }`}
          whileTap={canUndo ? micro.tapScale : {}}
        >
          <RotateCcw size={14} strokeWidth={2.5} />
        </motion.button>
      </div>

      {/* 3 clean buttons: Pass, SuperLike, Like — magnetic on fine pointers */}
      <div className="flex items-center justify-center gap-5">
        {/* Pass */}
        <Magnetic strength={0.18} radius={70}>
          <motion.button
            onClick={onPass}
            aria-label="Passer"
            className="w-[56px] h-[56px] rounded-full bg-bg border-2 border-border flex items-center justify-center text-text-muted"
            whileTap={micro.tapScale}
            whileHover={{ ...micro.hoverLift, borderColor: "color-mix(in srgb, var(--color-text) 40%, transparent)" }}
          >
            <IconX size={24} />
          </motion.button>
        </Magnetic>

        {/* Super Like — subtle pulse glow when affordable */}
        <Magnetic strength={0.22} radius={60}>
          <motion.button
            onClick={onSuperLike}
            disabled={!canAffordRose}
            aria-label="Super like"
            className={`w-[46px] h-[46px] rounded-full border-2 flex items-center justify-center ${
              canAffordRose
                ? "bg-bg border-pink-500/40 text-pink-400"
                : "bg-bg border-border text-text-muted/30 cursor-not-allowed"
            }`}
            whileTap={canAffordRose ? micro.tapScale : {}}
            whileHover={
              canAffordRose
                ? { ...micro.hoverLift, boxShadow: `0 0 24px color-mix(in srgb, ${appTokens.rose} 40%, transparent)` }
                : {}
            }
            animate={
              canAffordRose
                ? {
                    boxShadow: [
                      `0 0 0px color-mix(in srgb, ${appTokens.rose} 0%, transparent)`,
                      `0 0 14px color-mix(in srgb, ${appTokens.rose} 25%, transparent)`,
                      `0 0 0px color-mix(in srgb, ${appTokens.rose} 0%, transparent)`,
                    ],
                  }
                : {}
            }
            transition={
              canAffordRose
                ? { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
                : undefined
            }
          >
            <IconStar size={18} />
          </motion.button>
        </Magnetic>

        {/* Like — gradient with magnetic + violet→green glow on hover */}
        <Magnetic strength={0.18} radius={70}>
          <motion.button
            onClick={onLike}
            aria-label="Liker"
            className="w-[56px] h-[56px] rounded-full gradient-bg flex items-center justify-center text-white shadow-glow"
            whileTap={micro.tapScale}
            whileHover={{
              y: -3,
              boxShadow: "0 12px 40px color-mix(in srgb, var(--color-accent-2) 45%, transparent)",
              transition: springs.gentle,
            }}
          >
            <IconHeart size={24} />
          </motion.button>
        </Magnetic>
      </div>
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

// Wave 15 · CPO — MatchToast replaced by full-screen MatchCinematic.
// See src/components/app/MatchCinematic.tsx.

// 2026-04-24: Wrap in Suspense for useSearchParams bail-out (Next 16 requirement).
// Same pattern as feed/plans/plans-create after /glowup/suspense-boundaries PR.
export default function BrowsePage() {
  return (
    <Suspense fallback={null}>
      <BrowsePageInner />
    </Suspense>
  );
}
