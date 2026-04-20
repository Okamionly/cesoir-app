"use client";

import { useState } from "react";
import { m, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MODES, MODE_KEYS, type ModeKey } from "@/lib/modes";
import { MODE_ICONS } from "@/components/ui/Icons";
import { springs, welcomeVariants, ambient, easings } from "@/lib/motion-design";
import { Camera } from "@/components/ui/lucide";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

const POPULAR_MODES = MODE_KEYS.slice(0, 6);

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

// Progress bar gradient per step
const STEP_GRADIENTS = [
  "linear-gradient(90deg, #8B5CF6, #A78BFA)",
  "linear-gradient(90deg, #8B5CF6, #00FF88)",
  "linear-gradient(90deg, #00FF88, #8B5CF6)",
  "linear-gradient(90deg, #8B5CF6, #EC4899, #00FF88)",
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [screen, setScreen] = useState(0);
  const [direction, setDirection] = useState(1);
  const [selectedModes, setSelectedModes] = useState<string[]>([]);
  const [reminders, setReminders] = useState(false);
  const [saving, setSaving] = useState(false);

  /**
   * Persist selected modes to Supabase before completing onboarding.
   * - Insert one row per selected mode in `mode_activations` (12h expiry default).
   * - Mark `user_settings.onboarding_completed = true` (upsert).
   * Silently no-ops if user is unauthenticated (skip path).
   */
  async function persistOnboarding() {
    if (!user || selectedModes.length === 0) return;
    setSaving(true);
    try {
      // Cast filters out invalid keys defensively (selectedModes is string[]).
      const validModes = selectedModes.filter((m): m is ModeKey =>
        (MODE_KEYS as string[]).includes(m),
      );
      if (validModes.length > 0) {
        const rows = validModes.map((mode) => ({
          user_id: user.id,
          mode,
          is_active: true,
          available_time: "Dispo maintenant",
        }));
        await supabase.from("mode_activations").insert(rows);
      }

      await supabase
        .from("user_settings")
        .upsert(
          {
            user_id: user.id,
            onboarding_completed: true,
            smart_notifications: reminders,
            mode_alerts: reminders,
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
    if (screen < 3) {
      setDirection(1);
      setScreen(screen + 1);
    } else {
      await persistOnboarding();
      router.push("/browse");
    }
  };

  const goPrev = () => {
    if (screen > 0) {
      setDirection(-1);
      setScreen(screen - 1);
    }
  };

  const toggleMode = (key: string) => {
    setSelectedModes(prev =>
      prev.includes(key) ? prev.filter(m => m !== key) : [...prev, key]
    );
  };

  return (
    <main className="min-h-screen bg-bg flex flex-col">
      {/* Progress bar */}
      <div className="px-5 pt-3">
        <div className="h-1 w-full rounded-full bg-border overflow-hidden">
          <m.div
            className="h-full rounded-full origin-left"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: (screen + 1) / 4 }}
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
          {/* ─── Screen 0: Choose Modes (orbit-float elastic stagger) ─── */}
          {screen === 0 && (
            <m.div
              key="screen0"
              variants={stepTransition}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full max-w-sm text-center"
            >
              <m.p
                className="text-[11px] text-accent font-semibold uppercase tracking-wider mb-4"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springs.gentle, delay: 0.15 }}
              >
                14 facons de sortir ce soir
              </m.p>
              <m.h1
                className="text-[22px] font-black text-text mb-6"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ ...springs.elastic, delay: 0.1 }}
              >
                Choisis ton mode
              </m.h1>

              <div className="grid grid-cols-3 gap-2" role="group" aria-label="Selection des modes">
                {POPULAR_MODES.map((key, i) => {
                  const mode = MODES[key];
                  const Icon = MODE_ICONS[key];
                  const on = selectedModes.includes(key);
                  // Orbit-float: cards come from radial positions with elastic spring
                  const angle = (i / POPULAR_MODES.length) * Math.PI * 2;
                  const orbitX = Math.cos(angle) * 60;
                  const orbitY = Math.sin(angle) * 40;
                  return (
                    <m.button
                      key={key}
                      type="button"
                      onClick={() => toggleMode(key)}
                      aria-pressed={on}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-colors tap-target ${
                        on ? "border-accent bg-accent/10" : "border-border"
                      }`}
                      initial={{ opacity: 0, x: orbitX, y: orbitY, scale: 0.5 }}
                      animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                      transition={{
                        ...springs.elastic,
                        delay: 0.2 + i * 0.07,
                      }}
                      whileHover={{ y: -4, scale: 1.05, transition: springs.gentle }}
                      whileTap={{ scale: 0.92, transition: springs.micro }}
                    >
                      {Icon && <Icon size={24} className={on ? "text-accent" : "text-text-muted"} />}
                      <span className={`text-[10px] font-medium ${on ? "text-accent" : "text-text-muted"}`}>
                        {mode.name}
                      </span>
                    </m.button>
                  );
                })}
              </div>
            </m.div>
          )}

          {/* ─── Screen 1: Availability / Clock (form fields alternate sides) ─── */}
          {screen === 1 && (
            <m.div
              key="screen1"
              variants={stepTransition}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full max-w-sm text-center"
            >
              {/* Clock animation */}
              <m.div
                className="w-24 h-24 mx-auto mb-6 rounded-full border-2 border-accent/30 flex items-center justify-center relative"
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ ...springs.elastic, delay: 0.2 }}
              >
                <div className="absolute w-[2px] h-8 bg-accent rounded-full origin-bottom" style={{ bottom: "50%", left: "calc(50% - 1px)" }}>
                  <m.div
                    className="w-full h-full bg-accent rounded-full origin-bottom"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                  />
                </div>
                <div className="absolute w-[2px] h-5 bg-text-muted rounded-full origin-bottom" style={{ bottom: "50%", left: "calc(50% - 1px)" }}>
                  <m.div
                    className="w-full h-full bg-text-muted rounded-full origin-bottom"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
                  />
                </div>
                <span className="text-[28px] text-accent font-bold">17h</span>
              </m.div>

              {/* Title slides from left */}
              <m.h1
                className="text-[22px] font-black text-text mb-2"
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...springs.heavy, delay: 0.3 }}
              >
                Dispo ce soir ?
              </m.h1>
              {/* Subtitle slides from right */}
              <m.p
                className="text-[14px] text-text-muted mb-8"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...springs.heavy, delay: 0.4 }}
              >
                Confirme ta dispo chaque soir a 17h
              </m.p>

              {/* Toggle slides from left */}
              <m.button
                onClick={() => setReminders(!reminders)}
                className={`flex items-center gap-3 mx-auto px-6 py-3 rounded-full border transition-colors tap-target ${
                  reminders ? "border-accent bg-accent/10" : "border-border"
                }`}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...springs.heavy, delay: 0.5 }}
              >
                <div className={`w-10 h-6 rounded-full p-0.5 transition-colors ${reminders ? "bg-accent" : "bg-border"}`}>
                  <m.div
                    className="w-5 h-5 rounded-full bg-white shadow"
                    animate={{ x: reminders ? 16 : 0 }}
                    transition={springs.snap}
                  />
                </div>
                <span className={`text-[13px] font-semibold ${reminders ? "text-accent" : "text-text-muted"}`}>
                  Activer les rappels
                </span>
              </m.button>
            </m.div>
          )}

          {/* ─── Screen 2: Verify Profile (ambient breathe on icon) ─── */}
          {screen === 2 && (
            <m.div
              key="screen2"
              variants={stepTransition}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full max-w-sm text-center"
            >
              {/* Camera icon with ambient breathe pulse */}
              <m.div
                className="w-24 h-24 mx-auto mb-6 rounded-full gradient-bg flex items-center justify-center shadow-glow"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ ...springs.cinematic, delay: 0.2 }}
              >
                <m.div
                  animate={ambient.breathe(3)}
                >
                  <Camera size={36} strokeWidth={1.5} color="white" aria-hidden="true" />
                </m.div>
              </m.div>

              <m.h1
                className="text-[22px] font-black text-text mb-2"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springs.heavy, delay: 0.35 }}
              >
                Verifie ton profil
              </m.h1>
              <m.p
                className="text-[14px] text-text-muted mb-8"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springs.heavy, delay: 0.45 }}
              >
                Un selfie video = confiance x10
              </m.p>

              <m.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ ...springs.elastic, delay: 0.55 }}
              >
                <Link
                  href="/profile"
                  className="inline-block gradient-bg text-white px-8 py-3 rounded-full text-[14px] font-semibold shadow-glow tap-target"
                >
                  Verifier
                </Link>
              </m.div>
            </m.div>
          )}

          {/* ─── Screen 3: Ready / Celebration (scale bounce + confetti entrance) ─── */}
          {screen === 3 && (
            <m.div
              key="screen3"
              variants={stepTransition}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full max-w-sm text-center"
            >
              {/* Confetti-style decorative dots */}
              {[...Array(8)].map((_, i) => {
                const angle = (i / 8) * Math.PI * 2;
                const radius = 80;
                const targetX = Math.cos(angle) * radius;
                const targetY = Math.sin(angle) * radius;
                const colors = ["#8B5CF6", "#00FF88", "#EC4899", "#FACC15"];
                return (
                  <m.div
                    key={`confetti-${i}`}
                    className="absolute left-1/2 top-1/2 w-2 h-2 rounded-full"
                    style={{ backgroundColor: colors[i % colors.length] }}
                    initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                    animate={{
                      x: targetX,
                      y: targetY,
                      scale: [0, 1.5, 0.8],
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: 1.2,
                      delay: 0.3 + i * 0.06,
                      ease: easings.overshoot,
                    }}
                  />
                );
              })}

              {/* Big gradient logo with bounce scale */}
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
                <span className="text-[48px] text-white">☾</span>
              </m.div>

              <m.h1
                className="text-[26px] font-black gradient-text mb-2"
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ ...springs.elastic, delay: 0.4 }}
              >
                C&apos;est parti
              </m.h1>
              <m.p
                className="text-[14px] text-text-muted mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.4 }}
              >
                Trouve quelqu&apos;un. Ce soir.
              </m.p>

              <m.div
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ ...springs.elastic, delay: 0.7 }}
              >
                <button
                  type="button"
                  onClick={goNext}
                  disabled={saving}
                  className="inline-block gradient-bg text-white px-10 py-3.5 rounded-full text-[16px] font-bold shadow-glow tap-target disabled:opacity-60"
                >
                  {saving ? "Enregistrement..." : "Explorer"}
                </button>
              </m.div>
            </m.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom navigation */}
      <div className="px-6 pb-8 pt-4">
        {/* Dots */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {[0, 1, 2, 3].map(i => (
            <m.button
              key={i}
              onClick={() => { setDirection(i > screen ? 1 : -1); setScreen(i); }}
              className={`rounded-full tap-target ${
                i === screen ? "w-6 h-2 gradient-bg" : "w-2 h-2 bg-border"
              }`}
              layout
              transition={springs.snap}
              aria-label={`Ecran ${i + 1}`}
              aria-current={i === screen ? "step" : undefined}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        {screen < 3 && (
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
              className={`${screen > 0 ? "flex-1" : "w-full"} gradient-bg text-white py-3.5 rounded-full text-[14px] font-semibold shadow-glow tap-target`}
              whileHover={{
                y: -3,
                boxShadow: "0 8px 25px rgba(139,92,246,0.3)",
                transition: springs.gentle,
              }}
              whileTap={{ scale: 0.95, transition: springs.micro }}
            >
              Suivant
            </m.button>
          </div>
        )}
      </div>
    </main>
  );
}
