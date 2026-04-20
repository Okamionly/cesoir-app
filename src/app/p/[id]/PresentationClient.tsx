"use client";

import { useRef, useState } from "react";
import { m, useScroll, useTransform, AnimatePresence } from "motion/react";
import { springs, easings } from "@/lib/motion-design";
import { MODES } from "@/lib/modes";
import { MODE_ICONS } from "@/components/ui/Icons";
import AudioIntro from "@/components/app/AudioIntro";
import TrustBadge from "@/components/app/TrustBadge";
import KarmaBadge from "@/components/app/KarmaBadge";
import { app } from "@/lib/design-tokens";
import { ArrowLeft, Star } from "@/components/ui/lucide";

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

interface PublicProfile {
  id: string;
  name: string;
  age: number;
  bio: string;
  activeModes: string[];
  city: string;
  meetupCount: number;
  avatarUrl?: string;
  isVerified: boolean;
  trustScore: number;
  karmaScore: number;
  isAvailableTonight: boolean;
  currentMode: string;
  moodEmoji: string;
  moodText: string;
  tonightChips: string[];
  prompts: { question: string; answer: string }[];
  reviews: {
    name: string;
    rating: number;
    text: string;
    tags: string[];
    date: string;
  }[];
}

interface PresentationClientProps {
  profile: PublicProfile;
}

// ─────────────────────────────────────────
// Component
// ─────────────────────────────────────────

export default function PresentationClient({ profile }: PresentationClientProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const [showReport, setShowReport] = useState(false);

  // Parallax transforms for hero
  const heroY = useTransform(scrollY, [0, 400], [0, 160]);
  const heroScale = useTransform(scrollY, [0, 400], [1.15, 1]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0.3]);
  const avatarScale = useTransform(scrollY, [0, 200], [1, 0.92]);

  // Sticky bottom bar: slide up after scrolling past hero
  const bottomBarY = useTransform(scrollY, [0, 300, 350], [100, 100, 0]);
  const bottomBarOpacity = useTransform(scrollY, [0, 300, 350], [0, 0, 1]);

  const reviewsRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="min-h-screen bg-bg relative">
      {/* ═══════════════════════════════════════
          1. HERO PHOTO AREA — Full-width parallax
          ═══════════════════════════════════════ */}
      <div className="relative h-[420px] overflow-hidden">
        <m.div
          className="absolute inset-0 w-full h-full"
          style={{ y: heroY, scale: heroScale, opacity: heroOpacity }}
        >
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt=""
              loading="eager"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover"
              aria-hidden="true"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-accent/30 via-safe/20 to-accent/10" />
          )}
          {/* Dark overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-bg" />
        </m.div>

        {/* Ambient glow ring behind avatar area */}
        <m.div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%)",
          }}
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Back button */}
        <m.button
          onClick={() => window.history.back()}
          className="absolute top-4 left-4 z-20 w-10 h-10 rounded-full bg-black/30 backdrop-blur-md border border-white/10 flex items-center justify-center"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={springs.snap}
          aria-label="Retour"
        >
          <ArrowLeft size={18} strokeWidth={2} color="white" aria-hidden="true" />
        </m.button>
      </div>

      {/* ═══════════════════════════════════════
          AVATAR — overlapping hero bottom
          ═══════════════════════════════════════ */}
      <div className="relative -mt-20 px-5 max-w-md mx-auto">
        <m.div
          style={{ scale: avatarScale }}
          className="w-32 h-32 rounded-2xl gradient-bg p-[3px] shadow-glow mx-auto"
        >
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.name}
              className="w-full h-full rounded-[13px] object-cover"
            />
          ) : (
            <div className="w-full h-full rounded-[13px] bg-bg flex items-center justify-center text-[42px] font-black text-accent">
              {profile.name.charAt(0).toUpperCase()}
            </div>
          )}
        </m.div>

        {/* ═══════════════════════════════════════
            2. NAME + AGE + CITY — cinematic blur reveal
            ═══════════════════════════════════════ */}
        <m.div
          className="text-center mt-5"
          initial={{ opacity: 0, filter: "blur(16px)", y: 10 }}
          animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          transition={{ ...springs.cinematic, delay: 0.2 }}
        >
          <div className="flex items-center justify-center gap-2.5">
            <h1 className="text-[28px] font-black tracking-tight text-text">{profile.name}</h1>
            <span className="text-[18px] text-text-muted font-light">{profile.age}</span>
          </div>
          <p className="text-[14px] text-text-muted mt-0.5">{profile.city}</p>
        </m.div>

        {/* ═══════════════════════════════════════
            3. VERIFICATION + TRUST BADGES — inline
            ═══════════════════════════════════════ */}
        <m.div
          className="flex items-center justify-center gap-2 mt-4 flex-wrap"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.heavy, delay: 0.35 }}
        >
          {profile.isVerified && (
            <div className="flex items-center gap-1.5 bg-accent/8 border border-accent/15 px-3 py-1.5 rounded-full">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="10" fill={app.violet} />
                <path d="M8 12l3 3 5-5" stroke={app.bg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-[11px] text-accent font-semibold">Verifie</span>
            </div>
          )}
          <TrustBadge trustScore={profile.trustScore} isVerified={profile.isVerified} />
          <KarmaBadge score={profile.karmaScore} meetups={profile.meetupCount} compact />
        </m.div>

        {/* ═══════════════════════════════════════
            4. "DISPO CE SOIR" — green badge + mode
            ═══════════════════════════════════════ */}
        {profile.isAvailableTonight && (
          <m.div
            className="flex items-center justify-center gap-3 mt-5"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...springs.elastic, delay: 0.45 }}
          >
            <div className="flex items-center gap-2 bg-safe/10 border border-safe/20 px-4 py-2 rounded-full">
              <m.span
                className="w-2.5 h-2.5 rounded-full bg-safe"
                animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
              <span className="text-[13px] text-safe font-bold">Dispo ce soir</span>
            </div>
            {profile.currentMode && MODES[profile.currentMode as keyof typeof MODES] && (
              <div className="flex items-center gap-1.5 bg-bg-card border border-border px-3 py-2 rounded-full">
                <span className="text-[13px]" aria-hidden="true">
                  {MODES[profile.currentMode as keyof typeof MODES].icon}
                </span>
                <span className="text-[12px] font-medium text-text">
                  {MODES[profile.currentMode as keyof typeof MODES].name}
                </span>
              </div>
            )}
          </m.div>
        )}
      </div>

      {/* ═══════════════════════════════════════
          5. AUDIO INTRO — playable preview
          ═══════════════════════════════════════ */}
      <m.div
        className="px-5 mt-8 max-w-md mx-auto"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springs.heavy, delay: 0.5 }}
      >
        <AudioIntro />
      </m.div>

      {/* ═══════════════════════════════════════
          6. BIO SECTION — "A propos" card
          ═══════════════════════════════════════ */}
      <m.div
        className="px-5 mt-8 max-w-md mx-auto"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springs.heavy, delay: 0.6 }}
      >
        <p className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-bold mb-3">A propos</p>
        <div className="bg-bg-card border border-border rounded-2xl p-5">
          <p className="text-[15px] text-text leading-relaxed">{profile.bio}</p>
        </div>
      </m.div>

      {/* ═══════════════════════════════════════
          7. CONVERSATION PROMPTS — alternating slides
          ═══════════════════════════════════════ */}
      <div className="px-5 mt-8 max-w-md mx-auto">
        <m.p
          className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-bold mb-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65 }}
        >
          Conversation starters
        </m.p>
        <div className="space-y-3">
          {profile.prompts.map((p, i) => (
            <m.div
              key={i}
              className="bg-bg-card border border-border rounded-2xl p-5 hover:border-accent/20 transition-colors"
              initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...springs.heavy, delay: 0.7 + i * 0.12 }}
            >
              <p className="text-[11px] text-accent font-bold uppercase tracking-wider mb-2">{p.question}</p>
              <p className="text-[15px] text-text leading-relaxed">{p.answer}</p>
            </m.div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════
          8. VIBE TAGS — tonight chips + mood
          ═══════════════════════════════════════ */}
      {(profile.tonightChips.length > 0 || profile.moodEmoji) && (
        <m.div
          className="px-5 mt-8 max-w-md mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.heavy, delay: 0.9 }}
        >
          <p className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-bold mb-3">Vibes ce soir</p>

          {/* Mood */}
          {(profile.moodEmoji || profile.moodText) && (
            <div className="flex items-center gap-2 mb-4">
              {profile.moodEmoji && (
                <span className="text-[28px]">{profile.moodEmoji}</span>
              )}
              {profile.moodText && (
                <span className="text-[14px] text-text italic">{profile.moodText}</span>
              )}
            </div>
          )}

          {/* Chips */}
          {profile.tonightChips.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {profile.tonightChips.map((chip, i) => (
                <m.span
                  key={chip}
                  className="px-3.5 py-2 rounded-full text-[12px] font-medium border border-accent/20 bg-accent/5 text-accent"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ ...springs.elastic, delay: 0.95 + i * 0.05 }}
                >
                  {chip}
                </m.span>
              ))}
            </div>
          )}
        </m.div>
      )}

      {/* ═══════════════════════════════════════
          9. MODE ACTIF — current mode with icon + description
          ═══════════════════════════════════════ */}
      {profile.activeModes.length > 0 && (
        <m.div
          className="px-5 mt-8 max-w-md mx-auto"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...springs.heavy, delay: 1.0 }}
        >
          <p className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-bold mb-3">Modes actifs</p>
          <div className="space-y-2">
            {profile.activeModes.map((key, i) => {
              const mode = MODES[key as keyof typeof MODES];
              if (!mode) return null;
              const Icon = MODE_ICONS[key as keyof typeof MODE_ICONS];
              return (
                <m.div
                  key={key}
                  className="flex items-center gap-3 bg-bg-card border border-border rounded-2xl p-4 hover:border-accent/15 transition-colors"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...springs.heavy, delay: 1.05 + i * 0.08 }}
                >
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                    {Icon ? (
                      <Icon size={22} className="text-accent" />
                    ) : (
                      <span className="text-[20px]" aria-hidden="true">{mode.icon}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-bold text-text">{mode.name}</p>
                    <p className="text-[11px] text-text-muted leading-snug truncate">{mode.description}</p>
                  </div>
                </m.div>
              );
            })}
          </div>
        </m.div>
      )}

      {/* ═══════════════════════════════════════
          10. REVIEWS — horizontal scroll with springs
          ═══════════════════════════════════════ */}
      {profile.reviews.length > 0 && (
        <m.div
          className="mt-8 max-w-md mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.heavy, delay: 1.15 }}
        >
          <p className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-bold mb-3 px-5">Avis recents</p>
          <div
            ref={reviewsRef}
            className="flex gap-3 overflow-x-auto no-scrollbar px-5 pb-2 snap-x snap-mandatory"
          >
            {profile.reviews.map((review, i) => (
              <m.div
                key={i}
                className="shrink-0 w-[280px] bg-bg-card border border-border rounded-2xl p-5 snap-center"
                initial={{ opacity: 0, scale: 0.9, x: 40 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ ...springs.snap, delay: 1.2 + i * 0.1 }}
              >
                {/* Stars */}
                <div className="flex items-center gap-1 mb-2">
                  {Array.from({ length: 5 }).map((_, s) => {
                    const filled = s < review.rating;
                    return (
                      <Star
                        key={s}
                        size={14}
                        strokeWidth={1.5}
                        fill={filled ? app.amberStar : "none"}
                        color={filled ? app.amberStar : "currentColor"}
                        className={filled ? "" : "text-border"}
                        aria-hidden="true"
                      />
                    );
                  })}
                  <span className="text-[11px] text-text-muted ml-1">{review.date}</span>
                </div>

                {/* Text */}
                <p className="text-[13px] text-text leading-relaxed mb-3">"{review.text}"</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {review.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-safe/10 text-safe border border-safe/15"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Reviewer name */}
                <p className="text-[11px] text-text-muted mt-3 font-medium">- {review.name}</p>
              </m.div>
            ))}
          </div>
        </m.div>
      )}

      {/* ═══════════════════════════════════════
          12. REPORT/BLOCK — small link at bottom
          ═══════════════════════════════════════ */}
      <div className="px-5 mt-10 mb-32 max-w-md mx-auto text-center">
        <button
          onClick={() => setShowReport(!showReport)}
          className="text-[11px] text-text-muted/50 hover:text-text-muted transition-colors"
        >
          Signaler ou bloquer ce profil
        </button>
        <AnimatePresence>
          {showReport && (
            <m.div
              className="mt-3 flex items-center justify-center gap-3"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={springs.snap}
            >
              <button className="px-4 py-2 rounded-xl text-[12px] font-medium text-danger bg-danger/5 border border-danger/10 tap-target">
                Signaler
              </button>
              <button className="px-4 py-2 rounded-xl text-[12px] font-medium text-text-muted bg-bg-card border border-border tap-target">
                Bloquer
              </button>
            </m.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══════════════════════════════════════
          11. ACTION BUTTONS — sticky bottom bar
          ═══════════════════════════════════════ */}
      <m.div
        className="fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)]"
        style={{ y: bottomBarY, opacity: bottomBarOpacity }}
      >
        <div className="bg-bg/90 backdrop-blur-xl border-t border-border/50">
          <div className="max-w-md mx-auto px-5 py-3 flex items-center gap-3">
            {/* Passer */}
            <m.button
              className="flex-1 py-3.5 rounded-xl text-[14px] font-bold text-text-muted border border-border bg-bg-card tap-target"
              whileTap={{ scale: 0.95 }}
              transition={springs.micro}
            >
              Passer
            </m.button>

            {/* Dire oui */}
            <m.button
              className="flex-[2] py-3.5 rounded-xl text-[14px] font-bold text-white gradient-bg shadow-glow tap-target"
              whileTap={{ scale: 0.95 }}
              transition={springs.micro}
            >
              Dire oui
            </m.button>

            {/* Super Like */}
            <m.button
              className="w-[52px] h-[52px] rounded-xl border-2 flex items-center justify-center shrink-0 tap-target"
              style={{
                borderColor: `${app.amberStar}4D`, // /30 alpha
                backgroundColor: `${app.amberStar}14`, // /8 alpha
              }}
              whileTap={{ scale: 0.85, rotate: -10 }}
              transition={springs.elastic}
            >
              <Star size={22} fill={app.amberStar} color={app.amberStar} stroke="none" aria-hidden="true" />
            </m.button>
          </div>
        </div>
      </m.div>
    </div>
  );
}
