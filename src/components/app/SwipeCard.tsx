"use client";

import { useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence, MotionValue, useTransform } from "motion/react";
import { Profile } from "@/lib/mock-profiles";
import { MODES } from "@/lib/modes";
import { MODE_ICONS } from "@/components/ui/Icons";
import SmartQueueBadge from "@/components/app/SmartQueueBadge";
import PhotoGallery, {
  type InterleavedPrompt,
} from "@/components/app/PhotoGallery";
import { useProfilePrompts } from "@/lib/useProfilePrompts";
import { MODE_COLORS } from "@/lib/mode-colors";
import { springs } from "@/lib/motion-design";
import {
  LIKE_COLOR,
  NOPE_COLOR,
  LIVE_COLOR,
  SWIPE_TAG_COLORS,
  LANGUAGE_SPEAKS_COLOR,
  LANGUAGE_LEARNS_COLOR,
} from "@/lib/swipe-card-colors";
import type { ScoreBreakdown } from "@/lib/matching";
import { getVibe } from "@/lib/vibes";

/** Score tier — determines accent color of the donut + pill */
type CompatTier = "high" | "mid" | "low";

function getTier(score: number): CompatTier {
  if (score >= 80) return "high";
  if (score >= 60) return "mid";
  return "low";
}

const TIER_COLOR: Record<CompatTier, string> = {
  high: "#8B5CF6", // accent violet
  mid:  "#F59E0B", // amber-500 warn
  low:  "#696969", // text-muted
};

// Labels for the 4 score dimensions + their max values for bar width
const BREAKDOWN_META: Array<{ key: keyof ScoreBreakdown; label: string; max: number }> = [
  { key: "mode",     label: "Mode",     max: 40 },
  { key: "distance", label: "Distance", max: 25 },
  { key: "timing",   label: "Timing",   max: 20 },
  { key: "social",   label: "Social",   max: 15 },
];

interface SwipeCardProps {
  profile: Profile;
  index: number;
  total: number;
  expanded: boolean;
  onToggleExpand: () => void;
  x: MotionValue<number>;
  rotate: MotionValue<number>;
  likeOpacity: MotionValue<number>;
  nopeOpacity: MotionValue<number>;
  onDragEnd: (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => void;
  onLike: () => void;
  onReport?: () => void;
  onPass: () => void;
  /** Whether this profile is matched (unlocks blurred photos) */
  isMatched?: boolean;
  /** Overall compatibility score 0-100 */
  compatibilityScore?: number;
  /** Per-dimension breakdown — shown in the popover */
  scoreBreakdown?: ScoreBreakdown;
}

export default function SwipeCard({
  profile: p,
  index,
  total,
  expanded,
  onToggleExpand,
  x,
  rotate,
  likeOpacity,
  nopeOpacity,
  onDragEnd,
  onLike,
  onPass,
  onReport,
  isMatched = false,
  compatibilityScore,
  scoreBreakdown,
}: SwipeCardProps) {
  const ModeIcon = MODE_ICONS[p.mode];

  // Scale labels in proportion to swipe distance for tactile feedback
  const likeScale = useTransform(likeOpacity, [0, 1], [0.7, 1]);
  const nopeScale = useTransform(nopeOpacity, [0, 1], [0.7, 1]);

  // Photo list for the gallery
  const photoList = p.photos && p.photos.length > 0 ? p.photos : [p.photo];

  // Wave 17 — fetch the candidate's Hinge-style prompts and shape them
  // into the InterleavedPrompt format consumed by PhotoGallery. Empty
  // arrays are no-ops in the gallery, so unauthenticated reads / mock
  // profiles without DB rows simply render the legacy photo deck.
  const { prompts: candidatePrompts } = useProfilePrompts(p.id);
  const interleavedPrompts = useMemo<InterleavedPrompt[]>(() => {
    const tint = MODE_COLORS[p.mode] ?? "#8B5CF6";
    return candidatePrompts
      .filter((rp) => rp.question !== null)
      .map((rp) => ({
        question: rp.question!,
        answer: rp.answer,
        modeTint: tint,
      }));
  }, [candidatePrompts, p.mode]);

  // Track whether user is swiping within the gallery (prevent card drag conflict)
  const [galleryActive, setGalleryActive] = useState(false);

  // Compatibility popover open state — closed on drag to avoid stuck popovers
  const [compatOpen, setCompatOpen] = useState(false);

  const handleCardClick = useCallback((e: React.MouseEvent) => {
    // Don't interfere if the gallery handled the click
    if (galleryActive) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const cardHeight = rect.height;

    // Only toggle expand when tapping the bottom info area
    if (clickY > cardHeight * 0.6) {
      onToggleExpand();
    }
  }, [galleryActive, onToggleExpand]);

  return (
    <motion.div
      className="relative w-full h-full rounded-3xl overflow-hidden select-none z-[2]"
      style={{ x, rotate, cursor: "grab" }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      dragTransition={{ bounceStiffness: 600, bounceDamping: 20, power: 0.3 }}
      onDragEnd={(event, info) => { setCompatOpen(false); onDragEnd(event, info); }}
      onClick={handleCardClick}
      whileDrag={{ cursor: "grabbing" }}
      role="button"
      tabIndex={0}
      aria-label={`${p.name}, ${p.age} ans`}
      aria-expanded={expanded}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") onLike();
        else if (e.key === "ArrowLeft") onPass();
        else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggleExpand(); }
      }}
    >
      {/* Live availability ring (mig 030) — pulses green around the card
          while the candidate has "Je suis dispo ce soir" active. Sits
          INSIDE the card so it inherits the rounded corners but on top
          of the photo gallery so it's never clipped by the gradient. */}
      {p.broadcast_active && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-3xl z-[7]"
          style={{
            boxShadow: `0 0 0 2px ${LIVE_COLOR}, 0 0 22px ${LIVE_COLOR}80`,
          }}
          animate={{ opacity: [0.55, 1, 0.55] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Photo Gallery — replaces single photo. Wave 17 interleaves a
          prompt card every 2 photos using the candidate's saved prompts. */}
      <PhotoGallery
        photos={photoList}
        name={p.name}
        isMatched={isMatched}
        onGallerySwipe={() => setGalleryActive(true)}
        interleavedPrompts={interleavedPrompts}
      />

      {/* Gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none z-[5]" />

      {/* Swipe indicators */}
      <motion.div className="absolute top-8 left-6 z-10" style={{ opacity: likeOpacity, scale: likeScale }}>
        <div
          className="px-5 py-2 rounded-2xl border-2 backdrop-blur-sm -rotate-6"
          style={{
            borderColor: LIKE_COLOR,
            backgroundColor: `${LIKE_COLOR}26`,
          }}
        >
          <span
            className="text-[18px] font-black tracking-widest"
            style={{ color: LIKE_COLOR }}
          >
            LIKE
          </span>
        </div>
      </motion.div>
      <motion.div className="absolute top-8 right-6 z-10" style={{ opacity: nopeOpacity, scale: nopeScale }}>
        <div
          className="px-5 py-2 rounded-2xl border-2 backdrop-blur-sm rotate-6"
          style={{
            borderColor: NOPE_COLOR,
            backgroundColor: `${NOPE_COLOR}26`,
          }}
        >
          <span
            className="text-[18px] font-black tracking-widest"
            style={{ color: NOPE_COLOR }}
          >
            NOPE
          </span>
        </div>
      </motion.div>

      {/* Counter + Report + Compatibility badge */}
      <div className="absolute top-5 right-5 flex items-center gap-2 z-10">
        {onReport && (
          <button
            onClick={(e) => { e.stopPropagation(); onReport(); }}
            className="bg-black/40 backdrop-blur-md rounded-full w-8 h-8 flex items-center justify-center text-white/70 text-[14px] tap-target focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 rounded-full"
            aria-label="Signaler ce profil"
          >
            ···
          </button>
        )}
        <div className="bg-black/40 backdrop-blur-md rounded-full px-3 py-1.5 text-[10px] text-white/70 font-semibold">
          {index + 1} / {total}
        </div>
        {compatibilityScore !== undefined && (
          <CompatibilityBadge
            score={compatibilityScore}
            breakdown={scoreBreakdown}
            open={compatOpen}
            onToggle={(e) => { e.stopPropagation(); setCompatOpen((v) => !v); }}
          />
        )}
      </div>

      {/* Mode badge + optional Passport / Founder chips */}
      <div className="absolute top-5 left-5 z-10 flex items-center gap-2 flex-wrap max-w-[80%]">
        <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md rounded-full px-3 py-1.5">
          {ModeIcon && <ModeIcon size={14} className="text-white/80" />}
          <span className="text-[10px] text-white/80 font-semibold">{MODES[p.mode].name}</span>
        </div>
        {/* Travel passport chip (Wave 17 / mig 040). Visible only while
            the peer's passport window is active. The city name is the
            ONLY peer-passport detail we expose — coordinates and the
            window dates stay server-side. */}
        {p.passport_active && (
          <div
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 backdrop-blur-md"
            style={{
              background: "rgba(139,92,246,0.28)",
              border: "1px solid rgba(139,92,246,0.55)",
            }}
            title={p.passport_city ? `Passport actif vers ${p.passport_city}` : "Passport actif"}
            aria-label={p.passport_city ? `Passport actif vers ${p.passport_city}` : "Passport actif"}
          >
            <span className="text-[12px] leading-none" aria-hidden="true">✈️</span>
            <span className="text-[9px] text-white font-bold uppercase tracking-wider">
              {p.passport_city ?? "Passport"}
            </span>
          </div>
        )}
        {/* Founder ☾ — hybrid invite reward (mig 025). Visible to other
            users so 'arrived via invitation' becomes a social proof
            signal on the swipe deck. */}
        {p.is_founder && (
          <div
            className="flex items-center gap-1 rounded-full px-2.5 py-1.5 backdrop-blur-md"
            style={{
              background: "rgba(245,158,11,0.25)",
              boxShadow: "0 0 12px rgba(245,158,11,0.45)",
              border: "1px solid rgba(245,158,11,0.55)",
            }}
            title="Founder — Inscrit via invitation"
            aria-label="Founder — inscrit via invitation"
          >
            <span className="text-[12px] leading-none" aria-hidden="true">☾</span>
            <span className="text-[9px] text-white font-bold uppercase tracking-wider">Founder</span>
          </div>
        )}
        {/* Mastery chip (Wave 17 / mig 046) — surfaced ONLY when the
            profile has reached the top tier (maitre) in any mode. Below
            maitre we hide it: a deck full of "Apprenti" chips would
            dilute the signal. The chip uses the mode's brand color so
            "Maître Solo Diner" reads as a violet, "Maître Foodie Quest"
            as a deep red. */}
        {p.top_mastery_tier === "maitre" && p.top_mastery_mode && MODES[p.top_mastery_mode] && (
          <div
            className="flex items-center gap-1 rounded-full px-2.5 py-1.5 backdrop-blur-md"
            style={{
              background: `${MODE_COLORS[p.top_mastery_mode] ?? "#8B5CF6"}33`,
              boxShadow: `0 0 12px ${MODE_COLORS[p.top_mastery_mode] ?? "#8B5CF6"}55`,
              border: `1px solid ${MODE_COLORS[p.top_mastery_mode] ?? "#8B5CF6"}88`,
            }}
            title={`Maître ${MODES[p.top_mastery_mode].name} — 25+ RDV IRL confirmés`}
            aria-label={`Maître ${MODES[p.top_mastery_mode].name}`}
          >
            <span className="text-[12px] leading-none" aria-hidden="true">🌟</span>
            <span className="text-[9px] text-white font-bold uppercase tracking-wider whitespace-nowrap">
              Maître {MODES[p.top_mastery_mode].name}
            </span>
          </div>
        )}
      </div>

      {/* Vibe chip (mig 039) — sits directly below the mode badge so the
          two cards "what mode" + "what mood" stack as a vibe column on
          the top-left. Only renders when the peer set a vibe today. */}
      {(() => {
        const v = getVibe(p.vibe_today ?? null);
        if (!v) return null;
        return (
          <div className="absolute top-14 left-5 z-10">
            <div
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 backdrop-blur-md"
              style={{
                background: `${v.color}33`,
                border: `1px solid ${v.color}88`,
                boxShadow: `0 0 10px ${v.color}55`,
              }}
              title={`Vibe ce soir : ${v.label}`}
              aria-label={`Vibe ce soir : ${v.label}`}
            >
              <span className="text-[12px] leading-none" aria-hidden="true">
                {v.emoji}
              </span>
              <span className="text-[10px] text-white font-bold uppercase tracking-wide">
                {v.label}
              </span>
            </div>
          </div>
        );
      })()}

      {/* Smart Queue Badges - shifted down when a vibe chip is present
          so the two stacks don't overlap on the top-left rail. */}
      <div className={`absolute ${getVibe(p.vibe_today ?? null) ? "top-[88px]" : "top-14"} left-5 z-10`}>
        <SmartQueueBadge profile={p} />
      </div>

      {/* Info panel */}
      <div className={`absolute bottom-0 left-0 right-0 transition-all duration-300 z-[6] ${expanded ? "h-[65%]" : "h-[38%]"}`}>
        <div className={`relative h-full flex flex-col justify-end p-6 ${expanded ? "overflow-y-auto" : ""}`}>
          {p.time === "Dispo maintenant" && (
            <div className="flex items-center gap-1.5 mb-3">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: LIVE_COLOR }}
              />
              <span
                className="text-[11px] font-bold uppercase tracking-widest"
                style={{ color: LIVE_COLOR }}
              >
                Maintenant
              </span>
            </div>
          )}

          <h2 className="text-[38px] font-black leading-[0.95] tracking-tight text-white mb-1">{p.name}</h2>
          {/* Live broadcast pill (mig 030) — sits between the name and the
              age line so it reads as a status banner. Pulsing dot on the
              left mirrors the green ring around the card. */}
          {p.broadcast_active && (
            <div
              className="inline-flex items-center gap-1.5 self-start mb-2 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md"
              style={{
                backgroundColor: `${LIVE_COLOR}26`,
                color: LIVE_COLOR,
                border: `1px solid ${LIVE_COLOR}55`,
              }}
            >
              <motion.span
                className="block w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: LIVE_COLOR }}
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.6, repeat: Infinity }}
              />
              Dispo maintenant
            </div>
          )}
          <p className="text-[15px] text-white/50 font-light mb-3">
            {p.age} ans · {p.distance} km ·{" "}
            <span className="font-medium" style={{ color: LIVE_COLOR }}>
              {p.time}
            </span>
          </p>

          <p className={`text-[14px] text-white/70 leading-relaxed ${expanded ? "" : "line-clamp-2"}`}>{p.bio}</p>

          <ProfileTags profile={p} />

          {expanded && <ExpandedDetails profile={p} />}

          <div className="flex justify-center mt-3">
            <div className={`w-8 h-[3px] rounded-full bg-white/20 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────
// CompatibilityBadge
// ─────────────────────────────────────────

interface CompatibilityBadgeProps {
  score: number;
  breakdown?: ScoreBreakdown;
  open: boolean;
  onToggle: (e: React.MouseEvent) => void;
}

function CompatibilityBadge({ score, breakdown, open, onToggle }: CompatibilityBadgeProps) {
  const tier = getTier(score);
  const color = TIER_COLOR[tier];

  // Donut geometry
  const SIZE = 36;
  const STROKE = 3;
  const R = (SIZE - STROKE) / 2;
  const CIRCUMFERENCE = 2 * Math.PI * R;
  const dash = (score / 100) * CIRCUMFERENCE;

  return (
    // Relative wrapper so the popover can anchor from here
    <div className="relative flex items-center">
      {/* Badge button — 36×36 donut */}
      <button
        type="button"
        aria-label={`${score}% de compatibilité — voir le détail`}
        aria-expanded={open}
        onClick={onToggle}
        className="relative flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 rounded-full tap-target"
        style={{ width: SIZE, height: SIZE }}
      >
        {/* SVG donut ring */}
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          aria-hidden="true"
          style={{ transform: "rotate(-90deg)" }}
        >
          {/* Track */}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth={STROKE}
          />
          {/* Progress */}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke={color}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${CIRCUMFERENCE}`}
            style={{ filter: `drop-shadow(0 0 4px ${color}80)` }}
          />
        </svg>

        {/* Center percentage text */}
        <span
          className="absolute inset-0 flex items-center justify-center text-white font-bold tabular-nums leading-none"
          style={{ fontSize: 9 }}
        >
          {score}%
        </span>
      </button>

      {/* Popover — spring-snaps in from top-right */}
      <AnimatePresence>
        {open && (
          <motion.div
            role="tooltip"
            aria-label={`Détail de compatibilité : mode ${breakdown?.mode ?? 0}/40, distance ${breakdown?.distance ?? 0}/25, timing ${breakdown?.timing ?? 0}/20, social ${breakdown?.social ?? 0}/15`}
            className="absolute top-full right-0 mt-2 w-52 rounded-2xl overflow-hidden"
            style={{
              background: "rgba(10,10,13,0.92)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.10)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
              pointerEvents: "auto",
              zIndex: 70,
            }}
            initial={{ opacity: 0, scale: 0.88, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: -6 }}
            transition={springs.snap}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 pt-3 pb-2"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
            >
              <span className="text-[11px] text-white/50 uppercase tracking-[0.15em] font-bold">
                Compatibilité
              </span>
              <span className="font-black tabular-nums text-[15px]" style={{ color }}>
                {score}%
              </span>
            </div>

            {/* Dimension bars */}
            <div className="px-4 py-3 space-y-2.5">
              {BREAKDOWN_META.map(({ key, label, max }) => {
                const value = breakdown?.[key] ?? 0;
                const pct = max > 0 ? Math.round((value / max) * 100) : 0;
                const barTier = getTier(pct);
                const barColor = TIER_COLOR[barTier];
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-white/60 font-medium">{label}</span>
                      <span className="text-[10px] tabular-nums font-bold" style={{ color: barColor }}>
                        {value}/{max}
                      </span>
                    </div>
                    {/* Bar track */}
                    <div className="h-1 w-full rounded-full" style={{ background: "rgba(255,255,255,0.10)" }}>
                      <motion.div
                        className="h-1 rounded-full"
                        style={{ background: barColor }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ ...springs.snap, delay: 0.04 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProfileTags({ profile: p }: { profile: Profile }) {
  const tags: React.ReactNode[] = [];
  if (p.cuisine) tags.push(<Tag key="c" text={p.cuisine} />);
  if (p.event) tags.push(<Tag key="e" text={p.event} variant="accent" />);
  if (p.dog) tags.push(<Tag key="d" text={`${p.dog} · ${p.breed}`} />);
  if (p.safe) tags.push(<Tag key="s" text="Safe Space" variant="green" />);
  if (p.from) tags.push(<Tag key="f" text={p.from} />);
  if (p.speaks) tags.push(<Tag key="l" text={`${p.speaks.join(" · ")} → ${p.learns}`} />);
  if (tags.length === 0) return null;
  return <div className="flex flex-wrap gap-1.5 mt-3">{tags}</div>;
}

function Tag({ text, variant = "neutral" }: { text: string; variant?: keyof typeof SWIPE_TAG_COLORS }) {
  const { bg, text: textCls } = SWIPE_TAG_COLORS[variant];
  return (
    <span className={`px-3 py-1 rounded-full text-[11px] font-medium ${bg} ${textCls}`}>
      {text}
    </span>
  );
}

function ExpandedDetails({ profile: p }: { profile: Profile }) {
  return (
    <motion.div
      className="mt-4 pt-4 border-t border-white/8 space-y-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {p.speaks && (
        <DetailSection title="Langues">
          <div className="flex gap-1.5">
            {p.speaks.map((l) => (
              <span
                key={l}
                className="text-[11px] px-2.5 py-0.5 rounded-full font-medium"
                style={{
                  backgroundColor: `${LANGUAGE_SPEAKS_COLOR}26`,
                  color: LANGUAGE_SPEAKS_COLOR,
                }}
              >
                {l}
              </span>
            ))}
            {p.learns && (
              <span
                className="text-[11px] px-2.5 py-0.5 rounded-full font-medium"
                style={{
                  backgroundColor: `${LANGUAGE_LEARNS_COLOR}26`,
                  color: LANGUAGE_LEARNS_COLOR,
                }}
              >
                → {p.learns}
              </span>
            )}
          </div>
        </DetailSection>
      )}
      {p.dog && (
        <DetailSection title="Compagnon">
          <p className="text-[13px] text-white/80">{p.dog} — {p.breed}, {p.dogAge}</p>
        </DetailSection>
      )}
      {p.event && (
        <DetailSection title="Event">
          <p className="text-[13px] text-white/80">{p.event}</p>
        </DetailSection>
      )}
    </motion.div>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[9px] text-white/60 uppercase tracking-[0.2em] font-bold mb-1">{title}</p>
      {children}
    </div>
  );
}
