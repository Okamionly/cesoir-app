"use client";

import { LazyMotion, domMax } from "motion/react";

/**
 * LazyMotionProvider — enables lazy-loading of motion features.
 *
 * Bundle impact (2026-04-19 audit):
 *   Before: `motion/react` sync import = ~60KB gzipped (223KB raw chunk)
 *   After:  sync core ~6KB, features chunk ~25KB loaded async post-paint
 *
 * We use `domMax` (not `domAnimation`) because several existing components
 * rely on drag + layoutId features:
 *   - SwipeCard, BottomSheet, Toast, welcome/page (drag)
 *   - plan/[matchId], notifications, PhotoGallery, ModeSwitcher (layoutId)
 * Downgrading to `domAnimation` would break those without a second pass
 * migrating each call site to `m.div` + feature-split. `domMax` keeps
 * existing `motion.*` imports working while still splitting the chunk.
 *
 * `strict={false}` (default) allows both `motion.div` and `m.div` to
 * coexist during progressive migration. Set to `true` to force `m.*`
 * only once all call sites have been migrated.
 */
export default function LazyMotionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LazyMotion features={domMax}>{children}</LazyMotion>;
}
