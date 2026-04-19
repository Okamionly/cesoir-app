"use client";

import { forwardRef } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { springs } from "@/lib/motion-design";
import {
  SHARE_CARD_GRADIENT_PRESETS,
  SHARE_CARD_NEON_BG,
  type ShareCardGradientPreset,
} from "@/lib/share-card-presets";
import MockQR from "./MockQR";

export type CardStyle = "minimal" | "gradient" | "neon";

export type GradientPreset = ShareCardGradientPreset;

export const GRADIENT_PRESETS = SHARE_CARD_GRADIENT_PRESETS;

export interface ShareCardData {
  name: string;
  age: number;
  city: string;
  avatarUrl: string | null;
  mode: string;
  stats: { meetups: number; karma: number; streak: number };
  userId: string;
}

interface ProfileShareCardProps {
  data: ShareCardData;
  style: CardStyle;
  gradient: GradientPreset;
  showStats: boolean;
  showMode: boolean;
  showQR: boolean;
  aspectRatio?: "square" | "story" | "wide";
}

const ASPECT_CLASSES: Record<string, string> = {
  square: "aspect-square",
  story: "aspect-[9/16]",
  wide: "aspect-video",
};

// ─── Minimal Style ───────────────────────────────────

function MinimalCard({
  data,
  gradient,
  showStats,
  showMode,
  showQR,
}: Omit<ProfileShareCardProps, "style" | "aspectRatio">) {
  return (
    <div className="w-full h-full bg-white rounded-3xl border border-border flex flex-col items-center justify-center gap-4 p-6 relative overflow-hidden">
      {/* Subtle corner accent */}
      <div
        className="absolute top-0 right-0 w-32 h-32 opacity-10 rounded-bl-full"
        style={{ background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})` }}
      />

      {/* Logo */}
      <div className="flex items-center gap-1.5 absolute top-4 left-5">
        <span className="text-[16px]" style={{ color: gradient.from }}>&#9790;</span>
        <span className="text-[11px] font-black tracking-tight text-text">CeSoir</span>
      </div>

      {/* Avatar */}
      <div
        className="w-20 h-20 rounded-2xl p-[2px]"
        style={{ background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})` }}
      >
        <div className="relative w-full h-full rounded-[14px] bg-white flex items-center justify-center overflow-hidden">
          {data.avatarUrl ? (
            <Image src={data.avatarUrl} alt="" fill sizes="80px" className="object-cover" />
          ) : (
            <span className="text-[28px] font-black" style={{ color: gradient.from }}>
              {data.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Name + info */}
      <div className="text-center">
        <h3 className="text-[22px] font-black text-text tracking-tight">{data.name}</h3>
        <p className="text-[13px] text-text-soft">{data.age} ans &middot; {data.city}</p>
      </div>

      {/* Mode badge */}
      {showMode && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={springs.elastic}
          className="px-3 py-1 rounded-full text-[11px] font-bold text-white"
          style={{ background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})` }}
        >
          {data.mode}
        </motion.div>
      )}

      {/* Stats */}
      {showStats && (
        <div className="flex gap-6 text-center">
          {[
            { n: data.stats.meetups, l: "Meetups" },
            { n: data.stats.karma, l: "Karma" },
            { n: data.stats.streak, l: "Streak" },
          ].map((s) => (
            <div key={s.l}>
              <p className="text-[18px] font-black" style={{ color: gradient.from }}>{s.n}</p>
              <p className="text-[9px] text-text-soft uppercase tracking-wider font-semibold">{s.l}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tagline */}
      <p className="text-[11px] text-text-soft italic">Retrouve-moi sur CeSoir</p>

      {/* QR */}
      {showQR && (
        <div className="mt-auto">
          <MockQR userId={data.userId} size={64} color={gradient.from} showLabel={false} />
        </div>
      )}
    </div>
  );
}

// ─── Gradient Style ──────────────────────────────────

function GradientCard({
  data,
  gradient,
  showStats,
  showMode,
  showQR,
}: Omit<ProfileShareCardProps, "style" | "aspectRatio">) {
  return (
    <div
      className="w-full h-full rounded-3xl flex flex-col items-center justify-center gap-4 p-6 relative overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})` }}
    >
      {/* Noise overlay */}
      <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")" }} />

      {/* Logo */}
      <div className="flex items-center gap-1.5 absolute top-4 left-5">
        <span className="text-[16px] text-white/90">&#9790;</span>
        <span className="text-[11px] font-black tracking-tight text-white/90">CeSoir</span>
      </div>

      {/* Avatar */}
      <div className="w-24 h-24 rounded-2xl p-[3px] bg-white/20 backdrop-blur">
        <div className="relative w-full h-full rounded-[13px] bg-white/10 backdrop-blur flex items-center justify-center overflow-hidden">
          {data.avatarUrl ? (
            <Image src={data.avatarUrl} alt="" fill sizes="96px" className="object-cover" />
          ) : (
            <span className="text-[36px] font-black text-white">
              {data.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Name — large */}
      <div className="text-center">
        <h3 className="text-[32px] font-black text-white tracking-tight drop-shadow-lg">{data.name}</h3>
        <p className="text-[14px] text-white/70 font-medium">{data.age} ans &middot; {data.city}</p>
      </div>

      {/* Mode */}
      {showMode && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={springs.elastic}
          className="px-4 py-1.5 rounded-full text-[12px] font-bold bg-white/20 backdrop-blur text-white border border-white/20"
        >
          {data.mode}
        </motion.div>
      )}

      {/* Stats overlay */}
      {showStats && (
        <div className="flex gap-6 text-center mt-2">
          {[
            { n: data.stats.meetups, l: "Meetups" },
            { n: data.stats.karma, l: "Karma" },
            { n: data.stats.streak, l: "Streak" },
          ].map((s) => (
            <div key={s.l}>
              <p className="text-[20px] font-black text-white drop-shadow">{s.n}</p>
              <p className="text-[9px] text-white/60 uppercase tracking-wider font-semibold">{s.l}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tagline */}
      <p className="text-[12px] text-white/60 italic mt-2">Retrouve-moi sur CeSoir</p>

      {/* QR */}
      {showQR && (
        <div className="mt-auto">
          <MockQR userId={data.userId} size={64} color="white" showLabel={false} />
        </div>
      )}
    </div>
  );
}

// ─── Neon Style ──────────────────────────────────────

function NeonEqualizer({ color }: { color: string }) {
  return (
    <div className="flex items-end gap-[3px] h-6">
      {[0.6, 1, 0.4, 0.8, 0.5, 0.9, 0.3].map((h, i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full"
          style={{ backgroundColor: color, height: `${h * 100}%` }}
          animate={{
            height: [`${h * 100}%`, `${(1 - h) * 80 + 20}%`, `${h * 100}%`],
          }}
          transition={{
            duration: 0.8 + i * 0.1,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.08,
          }}
        />
      ))}
    </div>
  );
}

function NeonCard({
  data,
  gradient,
  showStats,
  showMode,
  showQR,
}: Omit<ProfileShareCardProps, "style" | "aspectRatio">) {
  return (
    <div
      className="w-full h-full rounded-3xl flex flex-col items-center justify-center gap-4 p-6 relative overflow-hidden"
      style={{ background: SHARE_CARD_NEON_BG }}
    >
      {/* Neon glow border via pseudo-like inner div */}
      <div
        className="absolute inset-0 rounded-3xl opacity-40"
        style={{
          boxShadow: `inset 0 0 40px ${gradient.from}30, inset 0 0 80px ${gradient.to}15`,
        }}
      />
      {/* Animated border glow */}
      <div
        className="absolute inset-[1px] rounded-3xl"
        style={{
          border: `1px solid ${gradient.from}40`,
          boxShadow: `0 0 15px ${gradient.from}20, 0 0 30px ${gradient.to}10`,
        }}
      />

      {/* Logo + equalizer */}
      <div className="flex items-center gap-3 absolute top-4 left-5">
        <span className="text-[16px]" style={{ color: gradient.from, textShadow: `0 0 10px ${gradient.from}` }}>&#9790;</span>
        <span className="text-[11px] font-black tracking-tight text-white/80">CeSoir</span>
        <NeonEqualizer color={gradient.from} />
      </div>

      {/* Avatar with neon ring */}
      <div
        className="w-22 h-22 rounded-2xl p-[2px]"
        style={{
          background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`,
          boxShadow: `0 0 20px ${gradient.from}50, 0 0 40px ${gradient.to}25`,
        }}
      >
        <div className="relative w-20 h-20 rounded-[14px] bg-[var(--share-card-neon-bg)] flex items-center justify-center overflow-hidden">
          {data.avatarUrl ? (
            <Image src={data.avatarUrl} alt="" fill sizes="80px" className="object-cover" />
          ) : (
            <span
              className="text-[30px] font-black"
              style={{ color: gradient.from, textShadow: `0 0 15px ${gradient.from}60` }}
            >
              {data.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Name with neon glow */}
      <div className="text-center">
        <h3
          className="text-[26px] font-black tracking-tight text-white"
          style={{ textShadow: `0 0 20px ${gradient.from}40` }}
        >
          {data.name}
        </h3>
        <p className="text-[13px] text-white/40">{data.age} ans &middot; {data.city}</p>
      </div>

      {/* Mode */}
      {showMode && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={springs.elastic}
          className="px-3 py-1 rounded-full text-[11px] font-bold text-white border"
          style={{
            borderColor: `${gradient.from}50`,
            backgroundColor: `${gradient.from}15`,
            boxShadow: `0 0 10px ${gradient.from}20`,
          }}
        >
          {data.mode}
        </motion.div>
      )}

      {/* Stats */}
      {showStats && (
        <div className="flex gap-6 text-center">
          {[
            { n: data.stats.meetups, l: "Meetups" },
            { n: data.stats.karma, l: "Karma" },
            { n: data.stats.streak, l: "Streak" },
          ].map((s) => (
            <div key={s.l}>
              <p
                className="text-[18px] font-black"
                style={{ color: gradient.from, textShadow: `0 0 10px ${gradient.from}40` }}
              >
                {s.n}
              </p>
              <p className="text-[9px] text-white/60 uppercase tracking-wider font-semibold">{s.l}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tagline */}
      <p className="text-[11px] text-white/70 italic">Retrouve-moi sur CeSoir</p>

      {/* QR */}
      {showQR && (
        <div className="mt-auto">
          <MockQR userId={data.userId} size={64} color={gradient.from} showLabel={false} />
        </div>
      )}
    </div>
  );
}

// ─── Exported composite ──────────────────────────────

const ProfileShareCard = forwardRef<HTMLDivElement, ProfileShareCardProps>(
  function ProfileShareCard(
    { data, style, gradient, showStats, showMode, showQR, aspectRatio = "square" },
    ref,
  ) {
    const shared = { data, gradient, showStats, showMode, showQR };
    return (
      <div ref={ref} className={`w-full max-w-[340px] ${ASPECT_CLASSES[aspectRatio]}`}>
        {style === "minimal" && <MinimalCard {...shared} />}
        {style === "gradient" && <GradientCard {...shared} />}
        {style === "neon" && <NeonCard {...shared} />}
      </div>
    );
  },
);

export default ProfileShareCard;
