"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

function useCountUp(target: number, duration: number, inView: boolean) {
  const [count, setCount] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!inView || hasAnimated.current) return;
    hasAnimated.current = true;

    const startTime = Date.now();
    const step = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setCount(target);
      }
    };
    requestAnimationFrame(step);
  }, [inView, target, duration]);

  return count;
}

export function CountUpNumbers() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });

  const rencontres = useCountUp(2847, 1800, inView);
  const modes = useCountUp(14, 1200, inView);
  const [avis, setAvis] = useState("0.0");

  useEffect(() => {
    if (!inView) return;
    const startTime = Date.now();
    const duration = 1500;
    const target = 4.8;
    const step = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAvis((eased * target).toFixed(1));
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setAvis("4.8");
      }
    };
    requestAnimationFrame(step);
  }, [inView]);

  return (
    <motion.div
      ref={ref}
      className="flex justify-center gap-6 sm:gap-12 max-w-lg mx-auto"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center">
        <p
          className="text-[36px] sm:text-[44px] font-black tabular-nums"
          style={{ background: "linear-gradient(135deg, #8B5CF6, #00FF88)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
        >
          {rencontres.toLocaleString("fr-FR")}
        </p>
        <p className="text-[11px] text-white/50 uppercase tracking-wider">Rencontres ce mois</p>
      </div>
      <div className="text-center">
        <p
          className="text-[36px] sm:text-[44px] font-black tabular-nums"
          style={{ background: "linear-gradient(135deg, #8B5CF6, #00FF88)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
        >
          {modes}
        </p>
        <p className="text-[11px] text-white/50 uppercase tracking-wider">Modes</p>
      </div>
      <div className="text-center">
        <p
          className="text-[36px] sm:text-[44px] font-black tabular-nums"
          style={{ background: "linear-gradient(135deg, #8B5CF6, #00FF88)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
        >
          {avis}/5
        </p>
        <p className="text-[11px] text-white/50 uppercase tracking-wider">Avis</p>
      </div>
    </motion.div>
  );
}
