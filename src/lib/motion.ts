/**
 * Motion re-exports — LazyMotion migration helper.
 *
 * Bundle optimization (Bundle Optimization Architect, 2026-04-19):
 *   The `motion/react` package ships ~60KB of DOM/SVG/layout/drag features
 *   synchronously when you `import { motion } from "motion/react"`.
 *   LazyMotion + `m` lets us lazy-load just the features we need.
 *
 * Usage:
 *   // New code — preferred:
 *   import { m, AnimatePresence } from "@/lib/motion";
 *   <m.div animate={{ opacity: 1 }} />
 *
 *   // Legacy code using drag / layout / pan still imports directly:
 *   import { motion } from "motion/react"; // keep — needs domMax features
 *
 * The `LazyMotionProvider` in `(app)/layout.tsx` + `(auth)/layout.tsx`
 * loads `domMax` async on first paint, which covers all features
 * (animation + drag + layout + pan) while keeping the sync bundle small.
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
