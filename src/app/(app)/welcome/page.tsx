"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import { MODES } from "@/lib/modes";
import { MeshGradient } from "@/components/ui/MeshGradient";
import { welcomeVariants, springs } from "@/lib/motion-design";
import { Magnetic } from "@/components/motion/Magnetic";

// ---------------------------------------------------------------------------
// Slide data
// ---------------------------------------------------------------------------

interface Slide {
  title: string;
  subtitle: string;
  content: React.ReactNode;
}

function MoonIcon({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <path
        d="M32 8C18.7 8 8 18.7 8 32s10.7 24 24 24c9.8 0 18.2-5.9 22-14.2-2.5 1-5.3 1.5-8.1 1.5C32.7 51.3 22 40.6 22 27.4c0-7 3-13.3 7.8-17.8C30.5 8.6 31.2 8 32 8z"
        fill="url(#onboardMoon)"
      />
      <defs>
        <linearGradient id="onboardMoon" x1="0" y1="0" x2="64" y2="64">
          <stop offset="0%" stopColor="var(--color-accent)" />
          <stop offset="100%" stopColor="var(--color-accent-2)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M32 6L8 18v14c0 14.4 10.2 27.8 24 32 13.8-4.2 24-17.6 24-32V18L32 6z" fill="color-mix(in srgb, var(--color-accent) 8%, transparent)" />
      <path d="M22 32l6 6 14-14" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="var(--color-accent-2)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="32" cy="32" r="26" fill="color-mix(in srgb, var(--color-accent-2) 6%, transparent)" />
      <path d="M32 16v16l10 6" />
    </svg>
  );
}

const modeKeys = Object.keys(MODES) as (keyof typeof MODES)[];

const slides: Slide[] = [
  {
    title: "Bienvenue sur CeSoir",
    subtitle: "Trouve quelqu'un pres de toi, disponible ce soir.",
    content: (
      <div className="flex flex-col items-center gap-6">
        <MoonIcon size={96} />
        <p className="max-w-xs text-center text-sm text-text-muted">
          Pas demain. Pas la semaine prochaine. Ce soir.
        </p>
      </div>
    ),
  },
  {
    title: "14 modes de rencontre",
    subtitle: "Chaque envie a son mode. Choisis le tien.",
    content: (
      <div className="grid grid-cols-4 gap-3 mx-auto max-w-xs">
        {modeKeys.map((key) => (
          <div
            key={key}
            className="flex flex-col items-center gap-1 rounded-2xl bg-bg-card p-2"
          >
            <span className="text-2xl">{MODES[key].icon}</span>
            <span className="text-[9px] font-medium text-text-muted text-center leading-tight">
              {MODES[key].name}
            </span>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "Securite avant tout",
    subtitle: "Verification, signalement, moderation en temps reel.",
    content: (
      <div className="flex flex-col items-center gap-6">
        <ShieldIcon />
        <ul className="space-y-3 text-sm text-text-muted max-w-xs">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-safe" />
            Verification de profil obligatoire
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-safe" />
            Signalement et blocage instantane
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-safe" />
            Moderation IA + humaine 24/7
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-safe" />
            Partage de position en temps reel
          </li>
        </ul>
      </div>
    ),
  },
  {
    title: "Ce soir, pas demain",
    subtitle: "L'urgence cree l'authenticite. Fini les conversations sans fin.",
    content: (
      <div className="flex flex-col items-center gap-6">
        <ClockIcon />
        <p className="max-w-xs text-center text-sm text-text-muted">
          Les plans expirent a minuit. Pas de ghost, pas de &ldquo;on se voit un jour&rdquo;.
          Tu es dispo ou tu ne l&apos;es pas.
        </p>
      </div>
    ),
  },
  {
    title: "C'est parti !",
    subtitle: "Configure ton profil et trouve ton premier plan.",
    content: (
      <div className="flex flex-col items-center gap-6">
        <MoonIcon size={80} />
        <p className="max-w-xs text-center text-sm text-text-muted">
          3 minutes pour creer ton profil. Le reste se fait ce soir.
        </p>
      </div>
    ),
  },
];

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const slideVariants = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? 80 : -80,
    scale: 0.96,
  }),
  center: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? -80 : 80,
    scale: 0.96,
    transition: { duration: 0.35, ease: [0.76, 0, 0.24, 1] as [number, number, number, number] },
  }),
};

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function OnboardingPage() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);

  const isLast = currentSlide === slides.length - 1;

  const goNext = useCallback(() => {
    if (isLast) {
      try {
        localStorage.setItem("onboarding_completed", "true");
      } catch {
        // storage unavailable
      }
      router.push("/profile");
      return;
    }
    setDirection(1);
    setCurrentSlide((s) => s + 1);
  }, [isLast, router]);

  const goBack = useCallback(() => {
    if (currentSlide > 0) {
      setDirection(-1);
      setCurrentSlide((s) => s - 1);
    }
  }, [currentSlide]);

  const skip = useCallback(() => {
    try {
      localStorage.setItem("onboarding_completed", "true");
    } catch {
      // storage unavailable
    }
    router.push("/profile");
  }, [router]);

  const slide = slides[currentSlide];

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-bg">
      <MeshGradient intensity="low" />

      {/* NOTE: PageHeader intentionally NOT used here.
          Welcome is a full-bleed slideshow layout: the MeshGradient fills the
          viewport, slides animate center-stage, and there is no top bar —
          only a floating "Passer" chip absolutely positioned at top-right.
          Wrapping in PageHeader would force a chrome row (backdrop-blur,
          border, flex layout) that competes visually with the slideshow.
          Skip-button stays as a bare absolute-positioned button. */}
      {!isLast && (
        <button
          onClick={skip}
          className="absolute right-4 top-4 z-10 rounded-full px-4 py-2 text-sm font-medium text-text-muted transition-colors hover:text-text"
        >
          Passer
        </button>
      )}

      {/* Slide content */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.3}
            onDragEnd={(_, info) => {
              if (info.offset.x < -80) goNext();
              else if (info.offset.x > 80) goBack();
            }}
            className="flex w-full max-w-sm flex-col items-center gap-6 text-center"
          >
            <motion.h1
              className="font-display text-3xl font-bold gradient-text"
              variants={welcomeVariants.illustration}
              initial="hidden"
              animate="visible"
            >
              {slide.title}
            </motion.h1>
            <p className="text-base text-text-muted">{slide.subtitle}</p>
            <motion.div
              className="mt-4 w-full"
              variants={welcomeVariants.illustration}
              initial="hidden"
              animate="visible"
            >
              {slide.content}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom section: dots + button */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-6 pb-12">
        {/* Dot indicators */}
        <div className="flex gap-2">
          {slides.map((_, i) => (
            <motion.button
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ ...springs.snap, delay: i * 0.05 }}
              onClick={() => {
                setDirection(i > currentSlide ? 1 : -1);
                setCurrentSlide(i);
              }}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === currentSlide
                  ? "w-6 bg-accent"
                  : "w-2 bg-border hover:bg-text-muted"
              }`}
              aria-label={`Aller au slide ${i + 1}`}
            />
          ))}
        </div>

        {/* CTA button — Magnetic + glow pulse */}
        <Magnetic as="div" strength={0.16} radius={120} className="w-full max-w-xs">
          <motion.button
            onClick={goNext}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
            transition={springs.snap}
            className="w-full rounded-2xl py-4 text-center text-base font-semibold text-white gradient-bg relative overflow-hidden"
            style={{
              boxShadow:
                "0 8px 30px color-mix(in srgb, var(--color-accent) 35%, transparent), 0 0 0 1px color-mix(in srgb, var(--color-bg) 5%, transparent) inset",
            }}
          >
            <motion.span
              className="absolute inset-0 rounded-2xl"
              style={{
                background:
                  "linear-gradient(120deg, transparent 30%, color-mix(in srgb, var(--color-bg) 18%, transparent) 50%, transparent 70%)",
              }}
              animate={{ x: ["-120%", "120%"] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
            />
            <span className="relative z-10">{isLast ? "Commencer" : "Suivant"}</span>
          </motion.button>
        </Magnetic>
      </div>
    </div>
  );
}
