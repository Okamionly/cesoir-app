"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";

interface ModeSegment {
  name: string;
  color: string;
  icon: string;
}

interface WheelOfFortuneProps {
  onAccept?: (mode: ModeSegment) => void;
  onRetry?: () => void;
}

const MODES: ModeSegment[] = [
  { name: "Diner", color: "#f59e0b", icon: "D" },
  { name: "Night Owl", color: "#8B5CF6", icon: "N" },
  { name: "Cafe", color: "#a16207", icon: "C" },
  { name: "Culture", color: "#2563eb", icon: "Cu" },
  { name: "Sport", color: "#00FF88", icon: "S" },
  { name: "Foodie", color: "#f97316", icon: "F" },
  { name: "Aventure", color: "#22c55e", icon: "A" },
  { name: "Flash", color: "#EF4444", icon: "Fl" },
  { name: "Chill", color: "#06b6d4", icon: "Ch" },
  { name: "VIP", color: "#d4af37", icon: "V" },
  { name: "Random", color: "#ec4899", icon: "R" },
  { name: "Squad", color: "#6366f1", icon: "Sq" },
  { name: "Explore", color: "#14b8a6", icon: "E" },
  { name: "Secret", color: "#a855f7", icon: "Se" },
];

const SEGMENT_ANGLE = 360 / MODES.length;

export default function WheelOfFortune({ onAccept, onRetry }: WheelOfFortuneProps) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<ModeSegment | null>(null);

  const wheelSegments = useMemo(() => {
    return MODES.map((mode, i) => {
      const startAngle = i * SEGMENT_ANGLE;
      const endAngle = startAngle + SEGMENT_ANGLE;
      const midAngle = ((startAngle + endAngle) / 2) * (Math.PI / 180);
      const labelRadius = 95;
      const x = 150 + labelRadius * Math.cos(midAngle - Math.PI / 2);
      const y = 150 + labelRadius * Math.sin(midAngle - Math.PI / 2);

      // Build SVG arc path for the segment
      const r = 140;
      const cx = 150;
      const cy = 150;
      const startRad = (startAngle - 90) * (Math.PI / 180);
      const endRad = (endAngle - 90) * (Math.PI / 180);
      const x1 = cx + r * Math.cos(startRad);
      const y1 = cy + r * Math.sin(startRad);
      const x2 = cx + r * Math.cos(endRad);
      const y2 = cy + r * Math.sin(endRad);
      const largeArc = SEGMENT_ANGLE > 180 ? 1 : 0;
      const path = `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`;

      return { mode, path, x, y, midAngle: (startAngle + endAngle) / 2 };
    });
  }, []);

  const handleSpin = useCallback(() => {
    if (spinning) return;
    setSpinning(true);
    setResult(null);

    // Random result
    const winnerIndex = Math.floor(Math.random() * MODES.length);
    // Spin 5-8 full rotations + land on winner segment
    const spins = 5 + Math.random() * 3;
    const targetAngle = 360 * spins + (360 - winnerIndex * SEGMENT_ANGLE - SEGMENT_ANGLE / 2);

    setRotation(targetAngle);

    // Show result after animation
    setTimeout(() => {
      setSpinning(false);
      setResult(MODES[winnerIndex]);
    }, 6000);
  }, [spinning]);

  const handleAccept = useCallback(() => {
    if (result) onAccept?.(result);
  }, [result, onAccept]);

  const handleRetry = useCallback(() => {
    setResult(null);
    setRotation(0);
    onRetry?.();
  }, [onRetry]);

  return (
    <div className="flex flex-col items-center" role="region" aria-label="Roue de la fortune des modes">
      {/* Wheel container */}
      <div className="relative w-[300px] h-[300px] mb-6">
        {/* Pointer arrow at top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10" aria-hidden="true">
          <svg width="24" height="28" viewBox="0 0 24 28">
            <polygon points="12,28 0,0 24,0" fill="#FFF" />
          </svg>
        </div>

        {/* Wheel */}
        <motion.div
          className="w-full h-full"
          animate={{ rotate: rotation }}
          transition={{
            duration: 6,
            ease: [0.25, 0.1, 0.25, 1],
          }}
        >
          <svg viewBox="0 0 300 300" className="w-full h-full" aria-hidden="true">
            {/* Segments */}
            {wheelSegments.map(({ mode, path, x, y, midAngle }, i) => (
              <g key={i}>
                <path
                  d={path}
                  fill={mode.color}
                  stroke="#0A0A0A"
                  strokeWidth="2"
                />
                <text
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize="9"
                  fontWeight="bold"
                  transform={`rotate(${midAngle}, ${x}, ${y})`}
                  style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
                >
                  {mode.icon}
                </text>
              </g>
            ))}
            {/* Center circle */}
            <circle cx="150" cy="150" r="25" fill="#0A0A0A" stroke="#333" strokeWidth="2" />
            <circle cx="150" cy="150" r="18" fill="#141414" />
          </svg>
        </motion.div>
      </div>

      {/* Spin button */}
      {!result && (
        <motion.button
          onClick={handleSpin}
          className="px-8 py-3.5 rounded-xl font-semibold text-[16px] text-white mb-4"
          style={{
            background: spinning
              ? "#333"
              : "linear-gradient(135deg, #8B5CF6, #00FF88)",
          }}
          disabled={spinning}
          whileHover={!spinning ? { scale: 1.05 } : {}}
          whileTap={!spinning ? { scale: 0.95 } : {}}
          aria-label={spinning ? "La roue tourne..." : "Tourner la roue"}
        >
          {spinning ? "La roue tourne..." : "Tourner"}
        </motion.button>
      )}

      {/* Result overlay */}
      <AnimatePresence>
        {result && (
          <motion.div
            className="w-full max-w-[300px] rounded-2xl p-5 text-center"
            style={{ background: "#141414", border: "1px solid #222" }}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <p className="text-[13px] mb-2" style={{ color: "#888" }}>
              Ce soir c&apos;est...
            </p>
            <motion.p
              className="font-bold text-[28px] mb-4"
              style={{
                fontFamily: "var(--font-display, 'Space Grotesk')",
                color: result.color,
              }}
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 20 }}
            >
              {result.name} !
            </motion.p>

            <div className="flex gap-3">
              <button
                onClick={handleRetry}
                className="flex-1 py-3 rounded-xl font-semibold text-[14px]"
                style={{ background: "#222", color: "#999" }}
                aria-label="Retourner la roue"
              >
                Retourner
              </button>
              <motion.button
                onClick={handleAccept}
                className="flex-1 py-3 rounded-xl font-semibold text-[14px] text-white"
                style={{ background: result.color }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                aria-label={`Accepter le mode ${result.name}`}
              >
                Accepter
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
