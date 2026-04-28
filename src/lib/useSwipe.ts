"use client";

import { useCallback } from "react";
import { useMotionValue, useTransform, animate, MotionValue } from "motion/react";

interface SwipeResult {
  x: MotionValue<number>;
  rotate: MotionValue<number>;
  likeOpacity: MotionValue<number>;
  nopeOpacity: MotionValue<number>;
  nextScale: MotionValue<number>;
  onDragEnd: (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => void;
  triggerLike: () => void;
  triggerPass: () => void;
}

export function useSwipe(onAction: (action: "like" | "pass") => void): SwipeResult {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-12, 0, 12]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);
  const nextScale = useTransform(x, [-200, 0, 200], [1, 0.94, 1]);

  const go = useCallback((action: "like" | "pass") => {
    // 2026-04-27 fix (user-reported "swipe figé"): use animation's
    // onComplete instead of an arbitrary setTimeout(300). With the spring
    // physics and stiffness=300/damping=30, the actual animation can run
    // 350-500ms — so the previous setTimeout fired BEFORE the spring
    // settled, then x.set(0) raced with the still-running animation.
    // Result: the next card sometimes inherited a non-zero x and rendered
    // off-screen.
    const controls = animate(x, action === "like" ? 500 : -500, {
      type: "spring",
      stiffness: 300,
      damping: 30,
      onComplete: () => {
        onAction(action);
        x.set(0);
      },
    });
    return controls;
  }, [onAction, x]);

  const onDragEnd = useCallback(
    (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
      if (info.offset.x > 120 || info.velocity.x > 500) go("like");
      else if (info.offset.x < -120 || info.velocity.x < -500) go("pass");
    },
    [go]
  );

  return {
    x,
    rotate,
    likeOpacity,
    nopeOpacity,
    nextScale,
    onDragEnd,
    triggerLike: () => go("like"),
    triggerPass: () => go("pass"),
  };
}
