"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";

interface MatchCelebrationProps {
  isOpen: boolean;
  myAvatar: string | null;
  myName: string;
  theirAvatar: string | null;
  theirName: string;
  onWrite: () => void;
  onContinue: () => void;
}

function ConfettiParticle({ index }: { index: number }) {
  const colors = ["#8B5CF6", "#00FF88", "#f59e0b", "#ec4899", "#06b6d4", "#ef4444"];
  const color = colors[index % colors.length];
  const left = Math.random() * 100;
  const tx = (Math.random() - 0.5) * 300;
  const ty = Math.random() * 400 + 200;
  const rot = Math.random() * 720 - 360;
  const delay = Math.random() * 0.6;
  const size = Math.random() * 6 + 4;

  return (
    <div
      className="absolute top-0 rounded-sm"
      style={{
        left: `${left}%`,
        width: size,
        height: size * 1.4,
        backgroundColor: color,
        // @ts-expect-error CSS custom properties for confetti animation
        "--tx": `${tx}px`,
        "--ty": `${ty}px`,
        "--rot": `${rot}deg`,
        animation: `confetti-fall 1.8s ease-out ${delay}s both`,
      }}
      aria-hidden="true"
    />
  );
}

function AvatarCircle({ src, name }: { src: string | null; name: string }) {
  return (
    <div className="w-24 h-24 rounded-full gradient-bg p-[3px] shadow-glow">
      {src ? (
        <img src={src} alt={name} loading="lazy" decoding="async" className="w-full h-full rounded-full object-cover" />
      ) : (
        <div className="w-full h-full rounded-full bg-bg flex items-center justify-center text-[32px] font-black text-accent">
          {name.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
}

export default function MatchCelebration({
  isOpen,
  myAvatar,
  myName,
  theirAvatar,
  theirName,
  onWrite,
  onContinue,
}: MatchCelebrationProps) {
  const [confetti, setConfetti] = useState<number[]>([]);

  const spawnConfetti = useCallback(() => {
    setConfetti(Array.from({ length: 40 }, (_, i) => i));
  }, []);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(spawnConfetti, 300);
      return () => clearTimeout(timer);
    }
    setConfetti([]);
  }, [isOpen, spawnConfetti]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-bg/95 backdrop-blur-sm"
          role="dialog"
          aria-label="Match celebration"
        >
          {/* Confetti layer */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {confetti.map((i) => (
              <ConfettiParticle key={i} index={i} />
            ))}
          </div>

          {/* Avatars approaching each other */}
          <div className="flex items-center gap-4 mb-8">
            <motion.div
              initial={{ x: -80, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
            >
              <AvatarCircle src={myAvatar} name={myName} />
            </motion.div>

            {/* Heart icon between avatars */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 15, delay: 0.6 }}
              className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center"
            >
              <span className="text-[24px]" aria-hidden="true">&#10084;&#65039;</span>
            </motion.div>

            <motion.div
              initial={{ x: 80, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
            >
              <AvatarCircle src={theirAvatar} name={theirName} />
            </motion.div>
          </div>

          {/* Title */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.5 }}
            className="text-center mb-10"
          >
            <h2 className="text-[32px] font-black gradient-text leading-tight">
              C&apos;est un match !
            </h2>
            <p className="text-[14px] text-text-muted mt-2">
              {myName} et {theirName} veulent se voir ce soir
            </p>
          </motion.div>

          {/* Action buttons */}
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.8 }}
            className="flex flex-col gap-3 w-full max-w-[280px]"
          >
            <button
              onClick={onWrite}
              className="w-full py-4 rounded-2xl gradient-bg text-white text-[15px] font-bold shadow-glow active:scale-[0.97] transition-transform tap-target"
            >
              Ecrire
            </button>
            <button
              onClick={onContinue}
              className="w-full py-4 rounded-2xl bg-bg-card border border-border text-[15px] font-semibold text-text active:scale-[0.97] transition-transform tap-target"
            >
              Continuer
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
