"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { app } from "@/lib/design-tokens";

const COLORS = [app.violet, app.vert, app.bg];
const PARTICLE_COUNT = 35;

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  shape: "circle" | "square" | "triangle";
}

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function generateParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i,
    x: randomBetween(-180, 180),
    y: randomBetween(-300, -80),
    color: COLORS[i % COLORS.length],
    size: randomBetween(4, 10),
    rotation: randomBetween(-360, 360),
    shape: (["circle", "square", "triangle"] as const)[i % 3],
  }));
}

interface ConfettiProps {
  active: boolean;
  onComplete?: () => void;
}

export function Confetti({ active, onComplete }: ConfettiProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (active) {
      setParticles(generateParticles());
      const timer = setTimeout(() => {
        setParticles([]);
        onComplete?.();
      }, 2200);
      return () => clearTimeout(timer);
    } else {
      setParticles([]);
    }
  }, [active, onComplete]);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
      aria-hidden="true"
    >
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }}
            animate={{
              x: p.x,
              y: p.y,
              opacity: 0,
              scale: 0.3,
              rotate: p.rotation,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: randomBetween(1.5, 2.2),
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            style={{
              position: "absolute",
              width: p.size,
              height: p.size,
              backgroundColor: p.shape !== "triangle" ? p.color : "transparent",
              borderRadius: p.shape === "circle" ? "50%" : p.shape === "square" ? "2px" : "0",
              borderLeft: p.shape === "triangle" ? `${p.size / 2}px solid transparent` : undefined,
              borderRight: p.shape === "triangle" ? `${p.size / 2}px solid transparent` : undefined,
              borderBottom: p.shape === "triangle" ? `${p.size}px solid ${p.color}` : undefined,
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
