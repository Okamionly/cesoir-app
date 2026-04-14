"use client";

import { useCallback } from "react";
import { useMotionValue, useTransform, animate, MotionValue } from "framer-motion";

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
    animate(x, action === "like" ? 500 : -500, {
      type: "spring",
      stiffness: 300,
      damping: 30,
    });
    setTimeout(() => {
      onAction(action);
      x.set(0);
    }, 300);
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
