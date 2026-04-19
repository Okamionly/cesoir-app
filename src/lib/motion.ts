/**
 * Motion re-exports — LazyMotion migration helper.
 *
 * Bundle optimization (Bundle Optimization Architect, 2026-04-19):
 *   The `motion/react` package ships ~60KB of DOM/SVG/layout/drag features
 *   synchronously when you `import { motion } from "motion/react"`.
 *   LazyMotion + `m` lets us lazy-load just the features we need.
 *
 * Usage:
 *   // Preferred for 99% of animations (opacity, transform, variants):
 *   import { m, AnimatePresence } from "motion/react";
 *   <m.div animate={{ opacity: 1 }} />
 *
 *   // Only the 9 files that need drag or layoutId features:
 *   import { motion } from "motion/react"; // keep — needs domMax
 *
 * After the 2026-04-19 codemod:
 *   - `LazyMotionProvider`    (default) loads `domAnimation` (~11KB)
 *     → used by `app/page.tsx` (landing) and `(auth)/layout.tsx`
 *   - `LazyMotionMaxProvider` loads `domMax` (~25KB, +14KB)
 *     → used by `(app)/layout.tsx` because its subtree still contains
 *       SwipeCard, BottomSheet, Toast, welcome, notifications, browse
 *       (drag) + plan/[matchId], PhotoGallery, ModeSwitcher, notifications
 *       (layoutId).
 */

export {
  m,
  AnimatePresence,
  LazyMotion,
  domAnimation,
  domMax,
  MotionConfig,
  useMotionValue,
  useTransform,
  useSpring,
  useReducedMotion,
  useAnimation,
  useInView,
  useScroll,
} from "motion/react";

export type { Variants, Transition, MotionValue } from "motion/react";
