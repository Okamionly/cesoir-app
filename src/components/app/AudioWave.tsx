"use client";

import { m } from "motion/react";
import { app } from "@/lib/design-tokens";

interface AudioWaveProps {
  /** Size of the central avatar area in px */
  size?: number;
  /** Accent color for the wave rings */
  color?: string;
  /** Whether the speaker is actively talking */
  active?: boolean;
  /** Avatar URL to display in the center */
  avatar?: string;
  /** Alt text for the avatar */
  name?: string;
}

/**
 * AudioWave -- Circular wave rings around an avatar when speaking.
 * 3 concentric rings pulsing outward, opacity fading.
 * Idle: subtle breathe animation. Active: rings pulse rapidly.
 */
export default function AudioWave({
  size = 72,
  color = app.violet,
  active = false,
  avatar,
  name = "",
}: AudioWaveProps) {
  const ringCount = 3;
  const ringBase = size + 16; // first ring starts just outside avatar

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size + 60, height: size + 60 }}
    >
      {/* Concentric rings */}
      {Array.from({ length: ringCount }).map((_, i) => (
        <m.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: ringBase + i * 20,
            height: ringBase + i * 20,
            border: `2px solid ${color}`,
          }}
          animate={
            active
              ? {
                  scale: [1, 1.25 + i * 0.15, 1],
                  opacity: [0.5 - i * 0.12, 0.15, 0.5 - i * 0.12],
                }
              : {
                  scale: [1, 1.04, 1],
                  opacity: [0.15, 0.08, 0.15],
                }
          }
          transition={
            active
              ? {
                  duration: 0.9 + i * 0.15,
                  repeat: Infinity,
                  ease: "easeInOut" as const,
                  delay: i * 0.12,
                }
              : {
                  duration: 3 + i * 0.5,
                  repeat: Infinity,
                  ease: "easeInOut" as const,
                }
          }
        />
      ))}

      {/* Avatar circle */}
      <m.div
        className="relative z-10 rounded-full overflow-hidden border-2"
        style={{
          width: size,
          height: size,
          borderColor: active ? color : "var(--color-border)",
        }}
        animate={
          active
            ? {
                boxShadow: [
                  `0 0 0px ${color}00`,
                  `0 0 20px ${color}60`,
                  `0 0 0px ${color}00`,
                ],
              }
            : {}
        }
        transition={
          active
            ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" as const }
            : {}
        }
      >
        {avatar ? (
          <img
            src={avatar}
            alt={name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-xl font-bold"
            style={{ backgroundColor: `${color}20`, color }}
          >
            {name.charAt(0).toUpperCase()}
          </div>
        )}
      </m.div>
    </div>
  );
}
