"use client";

// ==============================================================
// Onboarding — Wave 15 PMF refactor (CPO brief).
//
// Goal: <90s from register to first swipe. 3 screens, no more.
//
//   Screen 1 : Welcome + "What are you looking for?" (single CTA)
//   Screen 2 : Mode favori (pick 1 out of 4 core modes)
//   Screen 3 : Dispo ce soir ? (toggle)
//
// Identity, email, password, age, gender, photo are already captured in
// /register's 4-step flow. Onboarding now focuses on *intent* (mode) and
// *readiness* (dispo). Bio + verify happen post-activation (nudged after
// first match).
// ==============================================================

import { useState } from "react";
import { m, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MODES, MODE_KEYS, type ModeKey } from "@/lib/modes";
import { MODE_ICONS } from "@/components/ui/Icons";
import { springs, ambient, easings } from "@/lib/motion-design";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { track, trackFirstTime } from "@/lib/analytics";

// Step transition variants: enter from right, exit to left
const stepTransition = {
  enter: { x: 120, opacity: 0, scale: 0.96 },
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: easings.out },
  },
  exit: {
    x: -120,
    opacity: 0,
    scale: 0.96,
    transition: { duration: 0.35, ease: easings.dramatic },
  },
};

// Progress bar gradient per step (Wave 15: only 3 screens)
const STEP_GRADIENTS = [
  "linear-gradient(90deg, #8B5CF6, #A78BFA)",
  "linear-gradient(90deg, #8B5CF6, #00FF88)",
  "linear-gradient(90deg, #8B5CF6, #EC4899, #00FF88)",
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [screen, setScreen] = useState(0);
  const [direction, setDirection] = useState(1);
  const [favoriteMode, setFavoriteMode] = useState<ModeKey | null>(null);
  const [availableTonight, setAvailableTonight] = useState(false);
  const [saving, setSaving] = useState(false);

  /**
   * Persist selections and complete onboarding.
   * - Write a `mode_activations` row with the favorite mode + dispo toggle.
   * - Mark `user_settings.onboarding_completed = true`.
   */
  async function persistOnboarding() {
    if (!user) return;
    setSaving(true);
    try {
      if (favoriteMode) {
        await supabase.from("mode_activations").insert({
          user_id: user.id,
          mode: favoriteMode,
          is_active: availableTonight,
          available_time: availableTonight ? "Dispo maintenant" : null,
        });
      }

      await supabase
        .from("user_settings")
        .upsert(
          {
            user_id: user.id,
            onboarding_completed: true,
            smart_notifications: availableTonight,
            mode_alerts: availableTonight,
          },
          { onConflict: "user_id" },
        );
    } catch (err) {
      console.warn("[onboarding] persist failed", err);
    } finally {
      setSaving(false);
    }
  }

  const goNext = async () => {
    if (screen < 2) {
      setDirection(1);
      track("onboarding_step_viewed", { step: screen + 1 });
      setScreen(screen + 1);
    } else {
      await persistOnboarding();
      trackFirstTime("onboarding_complete", {
        favorite_mode: favoriteMode ?? null,
        available_tonight: availableTonight,
      });
      router.push("/browse");
    }
  };

  const goPrev = () => {
    if (screen > 0) {
      setDirection(-1);
      setScreen(screen - 1);
    }
  };

  const canContinue = screen === 0 || (screen === 1 && favoriteMode !== null) || screen === 2;

  return (
    <main className="min-h-screen bg-bg flex flex-col">
      {/* Progress bar — 3 dots */}
      <div className="px-5 pt-3">
        <div className="h-1 w-full rounded-full bg-border overflow-hidden">
          <m.div
            className="h-full rounded-full origin-left"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: (screen + 1) / 3 }}
            transition={springs.heavy}
            style={{
              background: STEP_GRADIENTS[screen],
            }}
          />
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-3">
        <div className="flex items-center gap-2">
          <span className="text-lg text-accent" aria-hidden="true">☾</span>
          <span className="text-sm font-bold text-text">CeSoir</span>
        </div>
        <Link
          href="/browse"
          className="text-[12px] text-text-muted font-medium tap-target py-1 px-2"
        >
          Passer
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          {/* ─── Screen 0: Welcome ─── */}
          {screen === 0 && (
            <m.div
              key="screen0"
              variants={stepTransition}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full max-w-sm text-center"
            >
              {/* Big gradient moon */}
              <m.div
                className="w-28 h-28 mx-auto mb-6 rounded-full gradient-bg flex items-center justify-center shadow-glow"
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.25, 0.9, 1.08, 1] }}
                transition={{
                  duration: 0.8,
                  times: [0, 0.3, 0.5, 0.7, 1],
                  ease: easings.overshoot,
                }}
              >
                <m.span
                  className="text-[52px] text-white"
                  animate={ambient.breathe(3)}
                  aria-hidden="true"
                >
                  ☾
                </m.span>
              </m.div>

              <m.p
                className="text-[11px] text-accent font-semibold uppercase tracking-wider mb-3"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springs.gentle, delay: 0.2 }}
              >
                Bienvenue
              </m.p>
              <m.h1
                className="text-[26px] font-black gradient-text-deco mb-3"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ ...springs.elastic, delay: 0.3 }}
              >
                Sors ce soir
              </m.h1>
              <m.p
                className="text-[14px] text-text-muted leading-relaxed max-w-xs mx-auto"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springs.heavy, delay: 0.45 }}
              >
                CeSoir connecte les gens dispos ce soir a Montpellier. Pas de
                swipe infini — 4 modes, 1 intention, 1 rencontre.
              </m.p>
            </m.div>
          )}

          {/* ─── Screen 1: Pick favorite mode (4 core) ─── */}
          {screen === 1 && (
            <m.div
              key="screen1"
              variants={stepTransition}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full max-w-sm text-center"
            >
              <m.p
                className="text-[11px] text-accent font-semibold uppercase tracking-wider mb-3"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springs.gentle, delay: 0.15 }}
              >
                1 mode = 1 soiree
              </m.p>
              <m.h1
                className="text-[22px] font-black text-text mb-2"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ ...springs.elastic, delay: 0.2 }}
              >
                Ton mode favori
              </m.h1>
              <m.p
                className="text-[13px] text-text-muted mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                On affinera plus tard. Choisis celui qui te ressemble ce soir.
              </m.p>

              <div
                className="grid grid-cols-2 gap-3"
                role="radiogroup"
                aria-label="Selection du mode favori"
              >
                {MODE_KEYS.map((key, i) => {
                  const mode = MODES[key];
                  const Icon = MODE_ICONS[key];
                  const on = favoriteMode === key;
                  return (
                    <m.button
                      key={key}
                      type="button"
                      onClick={() => setFavoriteMode(key)}
                      aria-pressed={on}
                      role="radio"
                      aria-checked={on}
                      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-colors tap-target ${
                        on ? "bg-accent/10" : "border-border"
                      }`}
                      style={{
                        borderColor: on ? mode.color : undefined,
                        background: on ? `${mode.color}10` : undefined,
                      }}
                      initial={{ opacity: 0, y: 24, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{
                        ...springs.elastic,
                        delay: 0.35 + i * 0.08,
                      }}
                      whileHover={{ y: -3, transition: springs.gentle }}
                      whileTap={{ scale: 0.95, transition: springs.micro }}
                    >
                      {Icon ? (
                        <span style={on ? { color: mode.color } : undefined}>
                          <Icon
                            size={28}
                            className={on ? undefined : "text-text"}
                          />
                        </span>
                      ) : (
                        <span className="text-2xl">{mode.icon}</span>
                      )}
                      <span
                        className="text-[13px] font-bold"
                        style={{ color: on ? mode.color : "var(--text)" }}
                      >
                        {mode.name}
                      </span>
                      <span className="text-[10px] text-text-muted leading-snug line-clamp-2">
                        {mode.description.split(".")[0]}
                      </span>
                    </m.button>
                  );
                })}
              </div>
            </m.div>
          )}

          {/* ─── Screen 2: Dispo ce soir ? ─── */}
          {screen === 2 && (
            <m.div
              key="screen2"
              variants={stepTransition}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full max-w-sm text-center"
            >
              {/* Moon icon breathing */}
              <m.div
                className="w-24 h-24 mx-auto mb-6 rounded-full border-2 border-accent/30 flex items-center justify-center relative"
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ ...springs.elastic, delay: 0.2 }}
              >
                <m.span
                  className="text-[42px] text-accent"
                  animate={availableTonight ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  aria-hidden="true"
                >
                  ☾
                </m.span>
              </m.div>

              <m.h1
                className="text-[22px] font-black text-text mb-2"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springs.heavy, delay: 0.3 }}
              >
                Dispo ce soir ?
              </m.h1>
              <m.p
                className="text-[14px] text-text-muted mb-8 leading-relaxed max-w-xs mx-auto"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springs.heavy, delay: 0.4 }}
              >
                Active ton mode si tu veux sortir ce soir. Change d&apos;avis a
                tout moment.
              </m.p>

              <m.button
                onClick={() => setAvailableTonight(!availableTonight)}
                className={`flex items-center gap-3 mx-auto px-6 py-3.5 rounded-full border transition-colors tap-target ${
                  availableTonight ? "border-accent bg-accent/10" : "border-border"
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springs.heavy, delay: 0.5 }}
                aria-pressed={availableTonight}
              >
                <div
                  className={`w-10 h-6 rounded-full p-0.5 transition-colors ${
                    availableTonight ? "bg-accent" : "bg-border"
                  }`}
                >
                  <m.div
                    className="w-5 h-5 rounded-full bg-white shadow"
                    animate={{ x: availableTonight ? 16 : 0 }}
                    transition={springs.snap}
                  />
                </div>
                <span
                  className={`text-[13px] font-semibold ${
                    availableTonight ? "text-accent" : "text-text-muted"
                  }`}
                >
                  {availableTonight ? "Je sors ce soir" : "Pas ce soir"}
                </span>
              </m.button>

              <m.p
                className="text-[11px] text-text-muted/70 mt-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                Tu pourras toujours changer de mode plus tard.
              </m.p>
            </m.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom navigation */}
      <div className="px-6 pb-8 pt-4">
        {/* 3 dots — CPO brief */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {[0, 1, 2].map((i) => (
            <m.button
              key={i}
              onClick={() => {
                setDirection(i > screen ? 1 : -1);
                setScreen(i);
              }}
              className={`rounded-full tap-target ${
                i === screen ? "w-6 h-2 gradient-bg" : "w-2 h-2 bg-border"
              }`}
              layout
              transition={springs.snap}
              aria-label={`Ecran ${i + 1} sur 3`}
              aria-current={i === screen ? "step" : undefined}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-3">
          {screen > 0 && (
            <m.button
              onClick={goPrev}
              className="flex-1 py-3.5 rounded-full text-[14px] font-medium border border-border text-text-muted tap-target"
              whileTap={{ scale: 0.9, transition: springs.micro }}
            >
              Retour
            </m.button>
          )}
          <m.button
            onClick={goNext}
            disabled={!canContinue || saving}
            className={`${screen > 0 ? "flex-1" : "w-full"} gradient-bg text-white py-3.5 rounded-full text-[14px] font-semibold shadow-glow tap-target disabled:opacity-60 disabled:cursor-not-allowed`}
            whileHover={{
              y: -3,
              boxShadow: "0 8px 25px rgba(139,92,246,0.3)",
              transition: springs.gentle,
            }}
            whileTap={{ scale: 0.95, transition: springs.micro }}
          >
            {saving
              ? "Chargement..."
              : screen === 2
                ? "Découvrir les profils"
                : screen === 1 && !favoriteMode
                  ? "Choisis un mode"
                  : "Suivant"}
          </m.button>
        </div>
      </div>
    </main>
  );
}
