"use client";

import { motion } from "motion/react";
import { springs } from "@/lib/motion-design";
import type { Soiree, SoireeType } from "@/lib/useSoiree";
import { SOIREE_TYPES } from "@/lib/useSoiree";
import Link from "next/link";

// ---------- Gradient map per soiree type ----------

const TYPE_GRADIENTS: Record<SoireeType, string> = {
  diner: "from-amber-500/80 to-orange-600/80",
  bar: "from-violet-500/80 to-purple-700/80",
  jeux: "from-emerald-500/80 to-teal-600/80",
  "pique-nique": "from-lime-400/80 to-green-500/80",
  cinema: "from-blue-500/80 to-indigo-700/80",
  degustation: "from-rose-500/80 to-red-600/80",
  karaoke: "from-pink-500/80 to-fuchsia-600/80",
  mystere: "from-slate-600/80 to-gray-900/80",
};

// ---------- Places badge color ----------

function placesBadgeColor(remaining: number, max: number): string {
  if (max === 0) return "bg-accent/10 text-accent";
  if (remaining <= 0) return "bg-danger/10 text-danger";
  if (remaining <= 2) return "bg-danger/10 text-danger";
  if (remaining <= 4) return "bg-warn/10 text-warn";
  return "bg-safe/10 text-safe";
}

function placesLabel(remaining: number, max: number): string {
  if (max === 0) return "Illimite";
  if (remaining <= 0) return "Complet";
  return `${remaining} place${remaining > 1 ? "s" : ""}`;
}

// ---------- Avatar Stack ----------

function AvatarStack({ attendees, max = 5 }: { attendees: { avatar: string; name: string }[]; max?: number }) {
  const shown = attendees.slice(0, max);
  const extra = attendees.length - max;

  return (
    <div className="flex -space-x-2">
      {shown.map((a, i) => (
        <img
          key={`${a.name}-${i}`}
          src={a.avatar}
          alt={a.name}
          loading="lazy"
          decoding="async"
          className="w-7 h-7 rounded-full border-2 border-bg-card object-cover shrink-0"
          style={{ zIndex: max - i }}
        />
      ))}
      {extra > 0 && (
        <div
          className="w-7 h-7 rounded-full border-2 border-bg-card flex items-center justify-center text-[10px] font-semibold text-text-muted bg-bg shrink-0"
          style={{ zIndex: 0 }}
        >
          +{extra}
        </div>
      )}
    </div>
  );
}

// ---------- Component ----------

interface SoireeCardProps {
  soiree: Soiree;
  index?: number;
  onJoin?: (id: string) => void;
}

export default function SoireeCard({ soiree: s, index = 0, onJoin }: SoireeCardProps) {
  const typeInfo = SOIREE_TYPES.find((t) => t.key === s.type);
  const emoji = typeInfo?.emoji ?? "";
  const gradient = TYPE_GRADIENTS[s.type] ?? "from-accent/80 to-accent-2/80";
  const remaining = s.maxPlaces === 0 ? Infinity : s.maxPlaces - s.currentAttendees;
  const isFull = s.maxPlaces > 0 && remaining <= 0;
  const isJoined = s.attendees.some((a) => a.userId === "current-user");

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springs.heavy, delay: index * 0.06 }}
    >
      <Link href={`/soiree/${s.id}`} className="block group">
        <div className="bg-bg-card rounded-2xl overflow-hidden border border-border hover:border-accent/30 transition-colors">
          {/* Header gradient */}
          <div className={`relative h-28 bg-gradient-to-br ${gradient} flex items-end p-4`}>
            <div className="absolute inset-0 bg-black/10" />
            <div className="relative z-10 flex items-center gap-2">
              <span className="text-2xl">{emoji}</span>
              <h3 className="text-white font-display font-bold text-lg leading-tight line-clamp-1 drop-shadow-sm">
                {s.title}
              </h3>
            </div>
            {/* Private badge */}
            {s.isPrivate && (
              <div className="absolute top-3 right-3 z-10 bg-black/40 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                Privee
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            {/* Host row */}
            <div className="flex items-center gap-2">
              <img
                src={s.creatorAvatar}
                alt={s.creatorName}
                className="w-6 h-6 rounded-full object-cover"
              />
              <span className="text-sm text-text font-medium">{s.creatorName}</span>
              {s.creatorVerified && (
                <svg className="w-3.5 h-3.5 text-accent shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M16.403 12.652a3 3 0 010-5.304 3 3 0 00-1.056-3.745 3 3 0 00-4.308-1.06 3 3 0 00-2.078 0 3 3 0 00-4.308 1.06 3 3 0 00-1.056 3.745 3 3 0 010 5.304 3 3 0 001.056 3.745 3 3 0 004.308 1.06 3 3 0 002.078 0 3 3 0 004.308-1.06 3 3 0 001.056-3.745zm-5.403.348a1 1 0 01-.707-.293l-2-2a1 1 0 111.414-1.414L11 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-.707.293z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>

            {/* Time + Location */}
            <div className="flex items-center gap-4 text-sm text-text-muted">
              <div className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{s.date === "Ce soir" || s.date === "Demain" ? `${s.date}, ${s.time}` : s.time}</span>
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="truncate max-w-[120px]">{s.arrondissement}</span>
              </div>
            </div>

            {/* Attendees + Places */}
            <div className="flex items-center justify-between">
              <AvatarStack
                attendees={s.attendees.filter((a) => a.status === "confirmed").map((a) => ({ avatar: a.avatar, name: a.name }))}
                max={5}
              />
              <div className="flex items-center gap-2">
                {/* Budget badge */}
                <span className="text-[11px] font-medium text-text-muted bg-bg px-2 py-0.5 rounded-full border border-border">
                  {s.budget === "gratuit" ? "Gratuit" : s.budget}
                </span>
                {/* Places badge */}
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${placesBadgeColor(remaining as number, s.maxPlaces)}`}>
                  {placesLabel(remaining as number, s.maxPlaces)}
                </span>
              </div>
            </div>

            {/* CTA */}
            {!isJoined && !isFull && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onJoin?.(s.id);
                }}
                className="w-full py-2 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-colors"
              >
                {s.isPrivate ? "Demander a rejoindre" : "Rejoindre"}
              </motion.button>
            )}
            {isJoined && (
              <div className="w-full py-2 rounded-xl bg-safe/10 text-safe text-sm font-semibold text-center">
                Vous participez
              </div>
            )}
            {isFull && !isJoined && (
              <div className="w-full py-2 rounded-xl bg-bg text-text-muted text-sm font-semibold text-center border border-border">
                Complet
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
