"use client";

import { motion } from "motion/react";

/**
 * MoonHero — crescent moon SVG with violet glow, craters, and slow float.
 * Replaces the ☾ unicode with a properly designed asset.
 */
export default function MoonHero({ size = 220 }: { size?: number }) {
  return (
    <motion.div
      className="relative"
      style={{ width: size, height: size }}
      animate={{
        y: [0, -12, 0, 8, 0],
        rotate: [0, 2, 0, -2, 0],
      }}
      transition={{
        duration: 12,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      aria-hidden="true"
    >
      {/* Outer glow (3 layers for depth) */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(139,92,246,0.45) 0%, rgba(139,92,246,0) 60%)",
          transform: "scale(1.8)",
          filter: "blur(30px)",
        }}
      />
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(236,72,153,0.25) 0%, rgba(236,72,153,0) 65%)",
          transform: "scale(1.5)",
          filter: "blur(20px)",
        }}
      />

      {/* Moon SVG */}
      <svg
        viewBox="0 0 220 220"
        width={size}
        height={size}
        className="relative z-10 drop-shadow-[0_0_40px_rgba(139,92,246,0.6)]"
      >
        <defs>
          {/* Main moon gradient — violet-blue deep to lighter */}
          <radialGradient id="moonBody" cx="35%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#F5E5FF" />
            <stop offset="30%" stopColor="#C4A8F5" />
            <stop offset="60%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#4C1D95" />
          </radialGradient>
          {/* Crescent shadow gradient */}
          <radialGradient id="crescent" cx="75%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#0A0A0D" stopOpacity="0" />
            <stop offset="50%" stopColor="#0A0A0D" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#0A0A0D" stopOpacity="0.95" />
          </radialGradient>
          {/* Halo outer edge */}
          <radialGradient id="halo" cx="50%" cy="50%" r="50%">
            <stop offset="70%" stopColor="#8B5CF6" stopOpacity="0" />
            <stop offset="95%" stopColor="#8B5CF6" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#00FF88" stopOpacity="0.2" />
          </radialGradient>
        </defs>

        {/* Subtle outer halo ring */}
        <circle cx="110" cy="110" r="108" fill="url(#halo)" />

        {/* Moon body */}
        <circle cx="110" cy="110" r="90" fill="url(#moonBody)" />

        {/* Craters — subtle darker spots */}
        <ellipse cx="85" cy="90" rx="10" ry="8" fill="#4C1D95" opacity="0.35" />
        <ellipse cx="130" cy="80" rx="6" ry="5" fill="#4C1D95" opacity="0.3" />
        <ellipse cx="95" cy="130" rx="8" ry="7" fill="#4C1D95" opacity="0.4" />
        <ellipse cx="140" cy="135" rx="5" ry="4" fill="#4C1D95" opacity="0.25" />
        <ellipse cx="75" cy="120" rx="4" ry="3" fill="#4C1D95" opacity="0.3" />

        {/* Crescent shadow (dark side) */}
        <circle cx="110" cy="110" r="90" fill="url(#crescent)" />

        {/* Bright highlight on lit edge */}
        <ellipse
          cx="60"
          cy="85"
          rx="25"
          ry="18"
          fill="#FFFFFF"
          opacity="0.15"
        />
      </svg>

      {/* Tiny sparkle/star particles around moon */}
      <motion.div
        className="absolute top-[10%] right-[5%] w-1 h-1 rounded-full bg-[#00FF88]"
        style={{ boxShadow: "0 0 8px #00FF88" }}
        animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
      />
      <motion.div
        className="absolute top-[75%] left-[8%] w-1 h-1 rounded-full bg-[#EC4899]"
        style={{ boxShadow: "0 0 8px #EC4899" }}
        animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, delay: 1.5 }}
      />
      <motion.div
        className="absolute top-[25%] left-[-5%] w-1 h-1 rounded-full bg-[#8B5CF6]"
        style={{ boxShadow: "0 0 8px #8B5CF6" }}
        animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
        transition={{ duration: 3.5, repeat: Infinity, delay: 2.2 }}
      />
      <motion.div
        className="absolute top-[60%] right-[-5%] w-[3px] h-[3px] rounded-full bg-white"
        style={{ boxShadow: "0 0 10px white" }}
        animate={{ opacity: [0, 0.8, 0], scale: [0.5, 1.3, 0.5] }}
        transition={{ duration: 5, repeat: Infinity, delay: 0.8 }}
      />
    </motion.div>
  );
}
