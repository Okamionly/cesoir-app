"use client";

import { LazyMotion, domAnimation, domMax } from "motion/react";

/**
 * LazyMotionProvider — enables lazy-loading of motion features.
 *
 * Bundle impact (2026-04-19 audit, 2026-04-19 codemod):
 *   Before: `motion/react` sync import = ~60KB gzipped (223KB raw chunk)
 *   After:  sync core ~6KB, features chunk loaded async post-paint
 *
 * Two variants:
 *   - Default  `LazyMotionProvider`     → `domAnimation` (~11KB)
 *   - Max      `LazyMotionMaxProvider`  → `domMax`       (~25KB)
 *
 * Use the default everywhere. Use the Max variant only in subtrees that
 * rely on `motion.*` with drag or layout features. After the 2026-04-19
 * codemod migrating `motion.*` → `m.*`, only 9 files still need `domMax`:
 *   drag:    SwipeCard, BottomSheet, Toast, welcome, notifications, browse
 *   layoutId: plan/[matchId], PhotoGallery, ModeSwitcher, notifications
 *
 * `strict={false}` (default) allows both `motion.*` and `m.*` to coexist.
 */
export default function LazyMotionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LazyMotion features={domAnimation}>{children}</LazyMotion>;
}

/**
 * LazyMotionMaxProvider — full feature set (domMax: animation + drag +
 * layout + pan). Use this to wrap subtrees that still use `motion.*`
 * components requiring drag or `layoutId`.
 */
export function LazyMotionMaxProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LazyMotion features={domMax}>{children}</LazyMotion>;
}
