/**
 * CeSoir Motion Design System
 * Each context has its own animation signature — no two pages feel the same.
 *
 * Physics reference:
 * - stiffness: higher = snappier (100=lazy, 600=aggressive)
 * - damping: higher = less bounce (10=jelly, 40=controlled)
 * - mass: higher = heavier feel (0.5=light, 2=heavy)
 */

import type { Variants, Transition } from "motion/react";

// ─────────────────────────────────────────
// SPRING PRESETS — each feels different
// ─────────────────────────────────────────

export const springs = {
  /** Snappy UI response — buttons, toggles */
  snap: { type: "spring" as const, stiffness: 500, damping: 30, mass: 0.8 },
  /** Elastic overshoot — playful elements */
  elastic: { type: "spring" as const, stiffness: 300, damping: 15, mass: 1 },
  /** Heavy & smooth — modals, sheets */
  heavy: { type: "spring" as const, stiffness: 200, damping: 28, mass: 1.5 },
  /** Gentle float — ambient animations */
  gentle: { type: "spring" as const, stiffness: 120, damping: 20, mass: 1.2 },
  /** Rubbery bounce — swipe cards, drag */
  rubber: { type: "spring" as const, stiffness: 600, damping: 18, mass: 0.6 },
  /** Slow cinematic — landing page reveals */
  cinematic: { type: "spring" as const, stiffness: 80, damping: 25, mass: 2 },
  /** Quick micro — tooltips, badges */
  micro: { type: "spring" as const, stiffness: 700, damping: 35, mass: 0.5 },
} satisfies Record<string, Transition>;

// ─────────────────────────────────────────
// EASING CURVES — for non-spring animations
// ─────────────────────────────────────────

export const easings = {
  /** Smooth deceleration */
  out: [0.16, 1, 0.3, 1] as [number, number, number, number],
  /** Dramatic ease-in-out */
  dramatic: [0.76, 0, 0.24, 1] as [number, number, number, number],
  /** Overshoot bounce */
  overshoot: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
  /** Anticipation (pull-back then go) */
  anticipate: [0.68, -0.6, 0.32, 1.6] as [number, number, number, number],
};

// ─────────────────────────────────────────
// PAGE SIGNATURES — unique per section
// ─────────────────────────────────────────

/**
 * FEED — Waterfall cascade
 * Cards drop in from above with varying delays and slight rotations
 */
export const feedVariants = {
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.1 },
    },
  } satisfies Variants,
  card: {
    hidden: { opacity: 0, y: -40, rotateX: 15, scale: 0.92 },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      scale: 1,
      transition: { ...springs.heavy, stiffness: 180 },
    },
    exit: { opacity: 0, y: 30, scale: 0.9, transition: { duration: 0.2 } },
  } satisfies Variants,
};

/**
 * BROWSE — 3D Perspective deck
 * Cards have depth, tilt on hover, rubber-band swipe physics
 */
export const browseVariants = {
  card: {
    initial: { scale: 0.8, rotateY: -10, opacity: 0 },
    center: {
      scale: 1,
      rotateY: 0,
      opacity: 1,
      transition: springs.rubber,
    },
    swipeLeft: {
      x: -400,
      rotateZ: -15,
      opacity: 0,
      transition: { duration: 0.4, ease: easings.dramatic },
    },
    swipeRight: {
      x: 400,
      rotateZ: 15,
      opacity: 0,
      transition: { duration: 0.4, ease: easings.dramatic },
    },
  } satisfies Variants,
  stack: {
    behind: (i: number) => ({
      scale: 1 - i * 0.05,
      y: i * 8,
      opacity: 1 - i * 0.15,
      transition: springs.gentle,
    }),
  },
};

/**
 * CHAT — Elastic bubbles
 * Messages pop in with elastic overshoot, scale from corner
 */
export const chatVariants = {
  bubbleSent: {
    hidden: { opacity: 0, scale: 0.6, x: 30, originX: 1, originY: 1 },
    visible: {
      opacity: 1,
      scale: 1,
      x: 0,
      transition: springs.elastic,
    },
  } satisfies Variants,
  bubbleReceived: {
    hidden: { opacity: 0, scale: 0.6, x: -30, originX: 0, originY: 1 },
    visible: {
      opacity: 1,
      scale: 1,
      x: 0,
      transition: springs.elastic,
    },
  } satisfies Variants,
  typingDot: (i: number) => ({
    y: [0, -6, 0],
    transition: {
      repeat: Infinity,
      duration: 0.6,
      delay: i * 0.15,
      ease: "easeInOut" as const,
    },
  }),
};

/**
 * PROFILE — Layered parallax
 * Elements enter from different edges at different speeds
 */
export const profileVariants = {
  hero: {
    hidden: { scale: 1.15, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { duration: 1.2, ease: easings.out },
    },
  } satisfies Variants,
  statsRow: {
    hidden: { opacity: 0, x: -60 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: { ...springs.heavy, delay: 0.2 + i * 0.1 },
    }),
  } satisfies Variants,
  chip: {
    hidden: { opacity: 0, scale: 0.5 },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
      transition: { ...springs.elastic, delay: 0.4 + i * 0.05 },
    }),
    tap: { scale: 0.9, transition: springs.snap },
  } satisfies Variants,
};

/**
 * CHALLENGES — Progress momentum
 * Bars fill with overshoot, numbers count up with spring
 */
export const challengeVariants = {
  card: {
    hidden: { opacity: 0, x: -30, skewX: -2 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      skewX: 0,
      transition: { ...springs.heavy, delay: i * 0.08 },
    }),
  } satisfies Variants,
  progressBar: {
    hidden: { scaleX: 0, originX: 0 },
    visible: (pct: number) => ({
      scaleX: pct,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 20,
        mass: 1.5,
        delay: 0.3,
      },
    }),
  } satisfies Variants,
  xpBadge: {
    hidden: { scale: 0, rotate: -180 },
    visible: {
      scale: 1,
      rotate: 0,
      transition: springs.elastic,
    },
  } satisfies Variants,
};

/**
 * ACHIEVEMENTS — Celebration unlock
 * Trophies bounce-scale in with glow pulse
 */
export const achievementVariants = {
  trophy: {
    locked: { opacity: 0.4, scale: 0.85, filter: "grayscale(1)" },
    unlocked: {
      opacity: 1,
      scale: 1,
      filter: "grayscale(0)",
      transition: springs.elastic,
    },
    unlock: {
      scale: [0.85, 1.3, 0.95, 1.05, 1],
      opacity: 1,
      filter: "grayscale(0)",
      transition: { duration: 0.8, times: [0, 0.3, 0.5, 0.7, 1] },
    },
  } satisfies Variants,
  glow: {
    idle: { boxShadow: "0 0 0px rgba(139,92,246,0)" },
    pulse: {
      boxShadow: [
        "0 0 0px rgba(139,92,246,0)",
        "0 0 30px rgba(139,92,246,0.6)",
        "0 0 0px rgba(139,92,246,0)",
      ],
      transition: { duration: 1.5, repeat: Infinity },
    },
  } satisfies Variants,
};

/**
 * MEMORIES — Polaroid scatter
 * Photos land like scattered polaroids with random rotation
 */
export const memoriesVariants = {
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.07, delayChildren: 0.15 },
    },
  } satisfies Variants,
  photo: {
    hidden: { opacity: 0, scale: 0.3, rotate: 0, y: 60 },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
      rotate: ((i % 5) - 2) * 3, // slight random rotation: -6, -3, 0, 3, 6
      y: 0,
      transition: { ...springs.rubber, delay: i * 0.06 },
    }),
    hover: { scale: 1.08, rotate: 0, zIndex: 10, transition: springs.snap },
    tap: { scale: 0.95, transition: springs.micro },
  } satisfies Variants,
};

/**
 * QUIZ — Card shuffle
 * Questions slide-shuffle with 3D rotation
 */
export const quizVariants = {
  question: {
    enter: { x: 300, rotateY: 25, opacity: 0 },
    center: {
      x: 0,
      rotateY: 0,
      opacity: 1,
      transition: { ...springs.heavy, stiffness: 150 },
    },
    exit: {
      x: -300,
      rotateY: -25,
      opacity: 0,
      transition: { duration: 0.35, ease: easings.dramatic },
    },
  } satisfies Variants,
  option: {
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { ...springs.snap, delay: 0.2 + i * 0.08 },
    }),
    selected: {
      scale: 0.95,
      backgroundColor: "rgba(139,92,246,0.2)",
      borderColor: "#8B5CF6",
      transition: springs.micro,
    },
  } satisfies Variants,
};

/**
 * MODES — Orbit float
 * Mode cards float with gentle hover animation
 */
export const modesVariants = {
  grid: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.06, delayChildren: 0.1 },
    },
  } satisfies Variants,
  modeCard: {
    hidden: { opacity: 0, scale: 0.5, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        ...springs.elastic,
        delay: i * 0.04,
      },
    }),
    hover: {
      y: -6,
      scale: 1.05,
      transition: springs.gentle,
    },
    tap: { scale: 0.92, transition: springs.micro },
  } satisfies Variants,
  floatLoop: (i: number) => ({
    y: [0, -4, 0, 3, 0],
    rotate: [0, 0.5, 0, -0.5, 0],
    transition: {
      duration: 3 + (i % 3),
      repeat: Infinity,
      ease: "easeInOut" as const,
    },
  }),
};

/**
 * MAP — Radial burst
 * Markers burst out from user position
 */
export const mapVariants = {
  marker: {
    hidden: { scale: 0, opacity: 0 },
    visible: (i: number) => ({
      scale: 1,
      opacity: 1,
      transition: {
        ...springs.elastic,
        delay: i * 0.05,
      },
    }),
    pulse: {
      scale: [1, 1.2, 1],
      transition: { duration: 2, repeat: Infinity, ease: "easeInOut" as const },
    },
  } satisfies Variants,
  userDot: {
    idle: {
      scale: [1, 1.15, 1],
      boxShadow: [
        "0 0 0 0 rgba(139,92,246,0.4)",
        "0 0 0 12px rgba(139,92,246,0)",
        "0 0 0 0 rgba(139,92,246,0.4)",
      ],
      transition: { duration: 2, repeat: Infinity },
    },
  },
};

/**
 * SQUAD — Magnetic cluster
 * Avatars gravitate together
 */
export const squadVariants = {
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  } satisfies Variants,
  member: {
    hidden: (i: number) => ({
      opacity: 0,
      x: (i % 2 === 0 ? -1 : 1) * 40,
      y: (i % 3 === 0 ? -1 : 1) * 30,
      scale: 0.5,
    }),
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      transition: springs.gentle,
    },
  } satisfies Variants,
};

/**
 * TRENDING — Heat pulse
 * Elements pulse with activity intensity
 */
export const trendingVariants = {
  spot: {
    hidden: { opacity: 0, scale: 0.8, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { ...springs.heavy, delay: i * 0.1 },
    }),
  } satisfies Variants,
  heatIndicator: (intensity: number) => ({
    scale: [1, 1 + intensity * 0.08, 1],
    opacity: [0.6, 1, 0.6],
    transition: {
      duration: 1.5 - intensity * 0.3, // hotter = faster pulse
      repeat: Infinity,
      ease: "easeInOut" as const,
    },
  }),
};

/**
 * WELCOME — Page morph
 * Smooth cross-dissolve with directional slide
 */
export const welcomeVariants = {
  page: {
    enter: { opacity: 0, x: 80, scale: 0.96 },
    center: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: { duration: 0.5, ease: easings.out },
    },
    exit: {
      opacity: 0,
      x: -80,
      scale: 0.96,
      transition: { duration: 0.35, ease: easings.dramatic },
    },
  } satisfies Variants,
  illustration: {
    hidden: { opacity: 0, scale: 0.7, rotate: -5 },
    visible: {
      opacity: 1,
      scale: 1,
      rotate: 0,
      transition: { ...springs.cinematic, delay: 0.2 },
    },
  } satisfies Variants,
};

/**
 * LEADERBOARD — Rank slide
 * Rows slide in from right with rank-based delay
 */
export const leaderboardVariants = {
  row: {
    hidden: { opacity: 0, x: 60 },
    visible: (rank: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        ...springs.heavy,
        delay: rank * 0.06,
      },
    }),
  } satisfies Variants,
  crown: {
    idle: {
      rotate: [0, -5, 5, -3, 0],
      transition: { duration: 2, repeat: Infinity, ease: "easeInOut" as const },
    },
  },
  rankChange: {
    up: { y: -4, color: "#00FF88", transition: springs.snap },
    down: { y: 4, color: "#EF4444", transition: springs.snap },
    same: { y: 0, color: "#888", transition: springs.snap },
  } satisfies Variants,
};

// ─────────────────────────────────────────
// MICRO-INTERACTIONS — reusable touches
// ─────────────────────────────────────────

export const micro = {
  /** Button press with haptic feel */
  tapScale: { scale: 0.95, transition: springs.micro },
  /** Hover lift with shadow */
  hoverLift: {
    y: -3,
    boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
    transition: springs.gentle,
  },
  /** Pulse attention */
  pulse: {
    scale: [1, 1.05, 1],
    transition: { duration: 1.2, repeat: Infinity, ease: "easeInOut" as const },
  },
  /** Shake for error */
  shake: {
    x: [0, -8, 8, -6, 6, -3, 3, 0],
    transition: { duration: 0.5 },
  },
  /** Wiggle for fun */
  wiggle: {
    rotate: [0, -3, 3, -2, 2, 0],
    transition: { duration: 0.4 },
  },
  /** Success pop */
  successPop: {
    scale: [1, 1.2, 0.95, 1.05, 1],
    transition: { duration: 0.5, times: [0, 0.2, 0.4, 0.6, 1] },
  },
};

// ─────────────────────────────────────────
// AMBIENT — looping background animations
// ─────────────────────────────────────────

export const ambient = {
  /** Slow float for decorative elements */
  float: (duration = 6) => ({
    y: [0, -8, 0, 5, 0],
    rotate: [0, 1, 0, -1, 0],
    transition: { duration, repeat: Infinity, ease: "easeInOut" as const },
  }),
  /** Breathing scale */
  breathe: (duration = 4) => ({
    scale: [1, 1.03, 1],
    opacity: [0.8, 1, 0.8],
    transition: { duration, repeat: Infinity, ease: "easeInOut" as const },
  }),
  /** Gradient shift (use with background-position) */
  gradientShift: {
    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
    transition: { duration: 8, repeat: Infinity, ease: "linear" as const },
  },
};
