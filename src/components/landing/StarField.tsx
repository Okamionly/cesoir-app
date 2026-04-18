"use client";

import { useEffect, useRef } from "react";

/**
 * StarField — canvas-based ambient particle field.
 *
 * 60-80 tiny drifting points (40 on mobile <768px) in the CeSoir palette
 * (violet/rose/vert) with low alpha. Each particle:
 *   - drifts slowly in 2D (gentle Brownian-ish)
 *   - fades in/out on a 4-8s random cycle
 *   - sits at 1-3px size
 *
 * Parallax: the entire field translates ~5-10px based on mouse position.
 *
 * Respects prefers-reduced-motion: disables drift + parallax, keeps a
 * static dim field so the layer still reads visually but without motion.
 */

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: [number, number, number]; // r,g,b 0-255
  baseAlpha: number;
  phase: number; // 0..1 within cycle
  cycleMs: number;
};

const PALETTE: Array<[number, number, number]> = [
  [139, 92, 246], // #8B5CF6 violet
  [236, 72, 153], // #EC4899 rose
  [0, 255, 136], // #00FF88 vert
  [255, 255, 255], // white
];

function randomParticle(w: number, h: number): Particle {
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.08,
    vy: (Math.random() - 0.5) * 0.08,
    size: 1 + Math.random() * 2,
    color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
    baseAlpha: 0.3 + Math.random() * 0.3,
    phase: Math.random(),
    cycleMs: 4000 + Math.random() * 4000,
  };
}

export default function StarField({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let particles: Particle[] = [];
    let w = 0;
    let h = 0;
    let dpr = 1;

    const count = () => {
      if (typeof window === "undefined") return 60;
      return window.innerWidth < 768 ? 40 : 70;
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // re-seed when size changes significantly (first run or big layout shift)
      if (particles.length === 0) {
        particles = Array.from({ length: count() }, () => randomParticle(w, h));
      }
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const onMove = (e: MouseEvent) => {
      if (reduced) return;
      mouseRef.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      };
    };
    window.addEventListener("mousemove", onMove, { passive: true });

    let raf = 0;
    let lastT = performance.now();

    const draw = (t: number) => {
      const dt = Math.min(t - lastT, 64); // clamp hitches
      lastT = t;

      ctx.clearRect(0, 0, w, h);

      // Parallax offset: mouse ranges 0..1 → -8..+8 px
      const parallaxX = reduced ? 0 : (mouseRef.current.x - 0.5) * -16;
      const parallaxY = reduced ? 0 : (mouseRef.current.y - 0.5) * -16;

      for (const p of particles) {
        if (!reduced) {
          p.x += p.vx * (dt / 16);
          p.y += p.vy * (dt / 16);
          // wrap
          if (p.x < -4) p.x = w + 4;
          if (p.x > w + 4) p.x = -4;
          if (p.y < -4) p.y = h + 4;
          if (p.y > h + 4) p.y = -4;

          p.phase += dt / p.cycleMs;
          if (p.phase > 1) p.phase -= 1;
        }

        // Sine fade 0→baseAlpha→0 across the cycle
        const fade = reduced
          ? p.baseAlpha * 0.6
          : Math.sin(p.phase * Math.PI) * p.baseAlpha;
        if (fade <= 0.01) continue;

        const [r, g, b] = p.color;
        ctx.beginPath();
        ctx.fillStyle = `rgba(${r},${g},${b},${fade})`;
        ctx.arc(p.x + parallaxX, p.y + parallaxY, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        cancelAnimationFrame(raf);
      } else {
        lastT = performance.now();
        raf = requestAnimationFrame(draw);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("mousemove", onMove);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    />
  );
}
