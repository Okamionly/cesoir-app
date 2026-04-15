"use client";

import { useState, useCallback } from "react";
import { motion, MotionValue } from "motion/react";
import { Profile } from "@/lib/mock-profiles";
import { MODES, ModeKey } from "@/lib/modes";
import { MODE_ICONS } from "@/components/ui/Icons";
import SmartQueueBadge from "@/components/app/SmartQueueBadge";

interface SwipeCardProps {
  profile: Profile;
  index: number;
  total: number;
  expanded: boolean;
  onToggleExpand: () => void;
  x: MotionValue<number>;
  rotate: MotionValue<number>;
  likeOpacity: MotionValue<number>;
  nopeOpacity: MotionValue<number>;
  onDragEnd: (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => void;
  onLike: () => void;
  onReport?: () => void;
  onPass: () => void;
}

export default function SwipeCard({
  profile: p,
  index,
  total,
  expanded,
  onToggleExpand,
  x,
  rotate,
  likeOpacity,
  nopeOpacity,
  onDragEnd,
  onLike,
  onPass,
  onReport,
}: SwipeCardProps) {
  const ModeIcon = MODE_ICONS[p.mode];

  // Multi-photo carousel state
  // photos array: profile photos + one "info" slide at the end
  const photoList = p.photos && p.photos.length > 0 ? p.photos : [p.photo];
  const totalSlides = photoList.length + 1; // +1 for info slide
  const [photoIdx, setPhotoIdx] = useState(0);
  const isInfoSlide = photoIdx === photoList.length;

  const goNextPhoto = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (photoIdx < totalSlides - 1) {
      setPhotoIdx(photoIdx + 1);
    }
  }, [photoIdx, totalSlides]);

  const goPrevPhoto = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (photoIdx > 0) {
      setPhotoIdx(photoIdx - 1);
    }
  }, [photoIdx]);

  const handleCardClick = useCallback((e: React.MouseEvent) => {
    // Get click position relative to the card
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const cardWidth = rect.width;

    // Left third = prev photo, right third = next photo, middle = toggle expand
    if (clickX < cardWidth * 0.33) {
      if (photoIdx > 0) {
        setPhotoIdx(photoIdx - 1);
        return;
      }
    } else if (clickX > cardWidth * 0.67) {
      if (photoIdx < totalSlides - 1) {
        setPhotoIdx(photoIdx + 1);
        return;
      }
    }

    // Middle area or no navigation possible: toggle expand
    onToggleExpand();
  }, [photoIdx, totalSlides, onToggleExpand]);

  return (
    <motion.div
      className="relative w-full h-full rounded-[28px] overflow-hidden select-none z-[2]"
      style={{ x, rotate, cursor: "grab" }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={onDragEnd}
      onClick={handleCardClick}
      whileDrag={{ cursor: "grabbing" }}
      role="button"
      tabIndex={0}
      aria-label={`${p.name}, ${p.age} ans`}
      aria-expanded={expanded}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") onLike();
        else if (e.key === "ArrowLeft") onPass();
        else if (e.key === "ArrowUp") { e.preventDefault(); goNextPhoto(e as unknown as React.MouseEvent); }
        else if (e.key === "ArrowDown") { e.preventDefault(); goPrevPhoto(e as unknown as React.MouseEvent); }
        else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggleExpand(); }
      }}
    >
      {/* Photo slides */}
      {isInfoSlide ? (
        /* Last slide: info/bio on dark background */
        <div className="absolute inset-0 bg-[#111] flex flex-col justify-center p-8">
          <h2 className="text-[32px] font-black text-white mb-2">{p.name}</h2>
          <p className="text-[15px] text-white/50 mb-4">
            {p.age} ans · {p.distance} km · <span className="text-[#00FF88] font-medium">{p.time}</span>
          </p>
          <p className="text-[15px] text-white/70 leading-relaxed mb-5">{p.bio}</p>
          <ProfileTags profile={p} />
          <ExpandedDetails profile={p} />
        </div>
      ) : (
        <>
          {/* Full-bleed photo */}
          <img
            src={photoList[photoIdx]}
            alt={`Photo ${photoIdx + 1} de ${p.name}`}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        </>
      )}

      {/* Dot indicators at top */}
      <div className="absolute top-3 left-12 right-12 z-10 flex gap-1">
        {Array.from({ length: totalSlides }).map((_, i) => (
          <div
            key={i}
            className="flex-1 h-[3px] rounded-full transition-all duration-200"
            style={{
              backgroundColor: i === photoIdx ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.25)",
            }}
          />
        ))}
      </div>

      {/* Swipe indicators */}
      <motion.div className="absolute top-8 left-6 z-10" style={{ opacity: likeOpacity }}>
        <div className="px-5 py-2 rounded-2xl border-2 border-[#00FF88] bg-[#00FF88]/15 backdrop-blur-sm -rotate-6">
          <span className="text-[#00FF88] text-[18px] font-black tracking-widest">LIKE</span>
        </div>
      </motion.div>
      <motion.div className="absolute top-8 right-6 z-10" style={{ opacity: nopeOpacity }}>
        <div className="px-5 py-2 rounded-2xl border-2 border-[#ff4466] bg-[#ff4466]/15 backdrop-blur-sm rotate-6">
          <span className="text-[#ff4466] text-[18px] font-black tracking-widest">NOPE</span>
        </div>
      </motion.div>

      {/* Counter + Report */}
      <div className="absolute top-5 right-5 flex items-center gap-2 z-10">
        {onReport && (
          <button
            onClick={(e) => { e.stopPropagation(); onReport(); }}
            className="bg-black/40 backdrop-blur-md rounded-full w-8 h-8 flex items-center justify-center text-white/70 text-[14px] tap-target"
            aria-label="Signaler ce profil"
          >
            ···
          </button>
        )}
        <div className="bg-black/40 backdrop-blur-md rounded-full px-3 py-1.5 text-[10px] text-white/70 font-semibold">
          {index + 1} / {total}
        </div>
      </div>

      {/* Mode badge */}
      <div className="absolute top-5 left-5 z-10 flex items-center gap-1.5 bg-black/40 backdrop-blur-md rounded-full px-3 py-1.5">
        {ModeIcon && <ModeIcon size={14} className="text-white/80" />}
        <span className="text-[10px] text-white/80 font-semibold">{MODES[p.mode].name}</span>
      </div>

      {/* Smart Queue Badges - below mode badge */}
      <div className="absolute top-14 left-5 z-10">
        <SmartQueueBadge profile={p} />
      </div>

      {/* Info panel (not shown on info slide) */}
      {!isInfoSlide && (
        <div className={`absolute bottom-0 left-0 right-0 transition-all duration-300 ${expanded ? "h-[65%]" : "h-[38%]"}`}>
          <div className={`relative h-full flex flex-col justify-end p-6 ${expanded ? "overflow-y-auto" : ""}`}>
            {p.time === "Dispo maintenant" && (
              <div className="flex items-center gap-1.5 mb-3">
                <span className="w-2 h-2 rounded-full bg-[#00FF88]" />
                <span className="text-[11px] text-[#00FF88] font-bold uppercase tracking-widest">Maintenant</span>
              </div>
            )}

            <h2 className="text-[38px] font-black leading-[0.95] tracking-tight text-white mb-1">{p.name}</h2>
            <p className="text-[15px] text-white/50 font-light mb-3">
              {p.age} ans · {p.distance} km · <span className="text-[#00FF88] font-medium">{p.time}</span>
            </p>

            <p className={`text-[14px] text-white/70 leading-relaxed ${expanded ? "" : "line-clamp-2"}`}>{p.bio}</p>

            <ProfileTags profile={p} />

            {expanded && <ExpandedDetails profile={p} />}

            <div className="flex justify-center mt-3">
              <div className={`w-8 h-[3px] rounded-full bg-white/20 transition-transform ${expanded ? "rotate-180" : ""}`} />
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function ProfileTags({ profile: p }: { profile: Profile }) {
  const tags: React.ReactNode[] = [];
  if (p.cuisine) tags.push(<Tag key="c" text={p.cuisine} />);
  if (p.event) tags.push(<Tag key="e" text={p.event} accent />);
  if (p.dog) tags.push(<Tag key="d" text={`${p.dog} · ${p.breed}`} />);
  if (p.safe) tags.push(<Tag key="s" text="Safe Space" green />);
  if (p.from) tags.push(<Tag key="f" text={p.from} />);
  if (p.speaks) tags.push(<Tag key="l" text={`${p.speaks.join(" · ")} → ${p.learns}`} />);
  if (tags.length === 0) return null;
  return <div className="flex flex-wrap gap-1.5 mt-3">{tags}</div>;
}

function Tag({ text, accent, green }: { text: string; accent?: boolean; green?: boolean }) {
  const cls = accent
    ? "bg-[#8B5CF6]/15 text-[#8B5CF6]"
    : green
    ? "bg-[#00FF88]/15 text-[#00FF88]"
    : "bg-white/8 text-white/70";
  return <span className={`px-3 py-1 rounded-full text-[11px] font-medium ${cls}`}>{text}</span>;
}

function ExpandedDetails({ profile: p }: { profile: Profile }) {
  return (
    <motion.div
      className="mt-4 pt-4 border-t border-white/8 space-y-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {p.speaks && (
        <DetailSection title="Langues">
          <div className="flex gap-1.5">
            {p.speaks.map(l => <span key={l} className="text-[11px] bg-[#06b6d4]/15 px-2.5 py-0.5 rounded-full text-[#06b6d4] font-medium">{l}</span>)}
            {p.learns && <span className="text-[11px] bg-[#8B5CF6]/15 px-2.5 py-0.5 rounded-full text-[#8B5CF6] font-medium">→ {p.learns}</span>}
          </div>
        </DetailSection>
      )}
      {p.dog && (
        <DetailSection title="Compagnon">
          <p className="text-[13px] text-white/80">{p.dog} — {p.breed}, {p.dogAge}</p>
        </DetailSection>
      )}
      {p.event && (
        <DetailSection title="Event">
          <p className="text-[13px] text-white/80">{p.event}</p>
        </DetailSection>
      )}
    </motion.div>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[9px] text-white/30 uppercase tracking-[0.2em] font-bold mb-1">{title}</p>
      {children}
    </div>
  );
}
