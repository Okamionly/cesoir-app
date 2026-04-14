"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MODES, MODE_KEYS } from "@/lib/modes";
import { MODE_ICONS } from "@/components/ui/Icons";

const POPULAR_MODES = MODE_KEYS.slice(0, 6);

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -300 : 300, opacity: 0 }),
};

export default function OnboardingPage() {
  const router = useRouter();
  const [screen, setScreen] = useState(0);
  const [direction, setDirection] = useState(1);
  const [selectedModes, setSelectedModes] = useState<string[]>([]);
  const [reminders, setReminders] = useState(false);

  const goNext = () => {
    if (screen < 3) {
      setDirection(1);
      setScreen(screen + 1);
    } else {
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
      {/* Skip button */}
      <div className="flex items-center justify-between px-5 pt-4">
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
          {screen === 0 && (
            <motion.div
              key="screen0"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-full max-w-sm text-center"
            >
              <motion.p
                className="text-[11px] text-accent font-semibold uppercase tracking-wider mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                14 facons de sortir ce soir
              </motion.p>
              <h1 className="text-[22px] font-black text-text mb-6">Choisis ton mode</h1>

              <div className="grid grid-cols-3 gap-2" role="group" aria-label="Selection des modes">
                {POPULAR_MODES.map((key, i) => {
                  const mode = MODES[key];
                  const Icon = MODE_ICONS[key];
                  const on = selectedModes.includes(key);
                  return (
                    <motion.button
                      key={key}
                      type="button"
                      onClick={() => toggleMode(key)}
                      aria-pressed={on}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all tap-target ${
                        on ? "border-accent bg-accent/10" : "border-border"
                      }`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.08 }}
                    >
                      {Icon && <Icon size={24} className={on ? "text-accent" : "text-text-muted"} />}
                      <span className={`text-[10px] font-medium ${on ? "text-accent" : "text-text-muted"}`}>
                        {mode.name}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {screen === 1 && (
            <motion.div
              key="screen1"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-full max-w-sm text-center"
            >
              {/* Clock animation */}
              <motion.div
                className="w-24 h-24 mx-auto mb-6 rounded-full border-2 border-accent/30 flex items-center justify-center relative"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
              >
                <div className="absolute w-[2px] h-8 bg-accent rounded-full origin-bottom" style={{ bottom: "50%", left: "calc(50% - 1px)" }}>
                  <motion.div
                    className="w-full h-full bg-accent rounded-full origin-bottom"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                  />
                </div>
                <div className="absolute w-[2px] h-5 bg-text-muted rounded-full origin-bottom" style={{ bottom: "50%", left: "calc(50% - 1px)" }}>
                  <motion.div
                    className="w-full h-full bg-text-muted rounded-full origin-bottom"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
                  />
                </div>
                <span className="text-[28px] text-accent font-bold">17h</span>
              </motion.div>

              <h1 className="text-[22px] font-black text-text mb-2">Dispo ce soir ?</h1>
              <p className="text-[14px] text-text-muted mb-8">Confirme ta dispo chaque soir a 17h</p>

              <button
                onClick={() => setReminders(!reminders)}
                className={`flex items-center gap-3 mx-auto px-6 py-3 rounded-full border transition-all tap-target ${
                  reminders ? "border-accent bg-accent/10" : "border-border"
                }`}
              >
                <div className={`w-10 h-6 rounded-full p-0.5 transition-colors ${reminders ? "bg-accent" : "bg-border"}`}>
                  <motion.div
                    className="w-5 h-5 rounded-full bg-white shadow"
                    animate={{ x: reminders ? 16 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </div>
                <span className={`text-[13px] font-semibold ${reminders ? "text-accent" : "text-text-muted"}`}>
                  Activer les rappels
                </span>
              </button>
            </motion.div>
          )}

          {screen === 2 && (
            <motion.div
              key="screen2"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-full max-w-sm text-center"
            >
              {/* Camera icon animation */}
              <motion.div
                className="w-24 h-24 mx-auto mb-6 rounded-full gradient-bg flex items-center justify-center shadow-glow"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
              >
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" aria-hidden="true">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </motion.div>

              <h1 className="text-[22px] font-black text-text mb-2">Verifie ton profil</h1>
              <p className="text-[14px] text-text-muted mb-8">Un selfie video = confiance x10</p>

              <Link
                href="/profile"
                className="inline-block gradient-bg text-white px-8 py-3 rounded-full text-[14px] font-semibold shadow-glow tap-target"
              >
                Verifier
              </Link>
            </motion.div>
          )}

          {screen === 3 && (
            <motion.div
              key="screen3"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-full max-w-sm text-center"
            >
              {/* Big gradient logo */}
              <motion.div
                className="w-28 h-28 mx-auto mb-6 rounded-full gradient-bg flex items-center justify-center shadow-glow"
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.1, 1] }}
                transition={{ duration: 0.6, times: [0, 0.7, 1] }}
              >
                <span className="text-[48px] text-white">☾</span>
              </motion.div>

              <motion.h1
                className="text-[26px] font-black gradient-text mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                C&apos;est parti
              </motion.h1>
              <motion.p
                className="text-[14px] text-text-muted mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Trouve quelqu&apos;un. Ce soir.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Link
                  href="/browse"
                  className="inline-block gradient-bg text-white px-10 py-3.5 rounded-full text-[16px] font-bold shadow-glow tap-target"
                >
                  Explorer
                </Link>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom navigation */}
      <div className="px-6 pb-8 pt-4">
        {/* Dots */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {[0, 1, 2, 3].map(i => (
            <button
              key={i}
              onClick={() => { setDirection(i > screen ? 1 : -1); setScreen(i); }}
              className={`rounded-full transition-all tap-target ${
                i === screen ? "w-6 h-2 gradient-bg" : "w-2 h-2 bg-border"
              }`}
              aria-label={`Ecran ${i + 1}`}
              aria-current={i === screen ? "step" : undefined}
            />
          ))}
        </div>

        {/* Next button */}
        {screen < 3 && (
          <div className="flex gap-3">
            {screen > 0 && (
              <button
                onClick={goPrev}
                className="flex-1 py-3.5 rounded-full text-[14px] font-medium border border-border text-text-muted tap-target"
              >
                Retour
              </button>
            )}
            <button
              onClick={goNext}
              className={`${screen > 0 ? "flex-1" : "w-full"} gradient-bg text-white py-3.5 rounded-full text-[14px] font-semibold shadow-glow tap-target`}
            >
              Suivant
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
