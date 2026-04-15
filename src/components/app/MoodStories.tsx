"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";

// --- Types ---

type StoryType = "mood" | "activity" | "photo";

interface StorySegment {
  type: StoryType;
  text: string;
  emoji?: string;
  photo?: string;
}

interface UserStory {
  id: string;
  name: string;
  photo: string;
  online: boolean;
  segments: StorySegment[];
}

// --- Mock Data (6 users with multi-segment stories) ---

function avatar(gender: "women" | "men", id: number): string {
  return `https://randomuser.me/api/portraits/${gender}/${id}.jpg`;
}

const MOCK_STORIES: UserStory[] = [
  {
    id: "ms1",
    name: "Sarah",
    photo: avatar("women", 44),
    online: true,
    segments: [
      { type: "mood", text: "Je me sens aventuriere ce soir", emoji: "\uD83C\uDF19" },
      { type: "activity", text: "Qui veut un cafe a Montmartre ?", emoji: "\u2615" },
    ],
  },
  {
    id: "ms2",
    name: "Lucas",
    photo: avatar("men", 24),
    online: true,
    segments: [
      { type: "photo", text: "Vue depuis le rooftop", photo: avatar("men", 24) },
      { type: "mood", text: "Nuit parfaite pour sortir", emoji: "\u2728" },
    ],
  },
  {
    id: "ms3",
    name: "Chloe",
    photo: avatar("women", 67),
    online: false,
    segments: [
      { type: "activity", text: "Pizza au comptoir, qui me rejoint ?", emoji: "\uD83C\uDF55" },
    ],
  },
  {
    id: "ms4",
    name: "Hugo",
    photo: avatar("men", 41),
    online: true,
    segments: [
      { type: "mood", text: "Envie de decouvrir un nouveau quartier", emoji: "\uD83D\uDDFA\uFE0F" },
      { type: "activity", text: "Balade nocturne au Canal Saint-Martin", emoji: "\uD83C\uDF03" },
      { type: "photo", text: "Le spot parfait", photo: avatar("men", 41) },
    ],
  },
  {
    id: "ms5",
    name: "Ines",
    photo: avatar("women", 52),
    online: true,
    segments: [
      { type: "mood", text: "Humeur cinema d'auteur", emoji: "\uD83C\uDFAC" },
    ],
  },
  {
    id: "ms6",
    name: "Thomas",
    photo: avatar("men", 75),
    online: false,
    segments: [
      { type: "activity", text: "Concert jazz au Sunset, qui vient ?", emoji: "\uD83C\uDFB7" },
      { type: "mood", text: "Bonne vibes only ce soir", emoji: "\uD83D\uDE0E" },
    ],
  },
];

// --- Full-screen Story Viewer ---

interface StoryViewerProps {
  stories: UserStory[];
  initialIndex: number;
  onClose: () => void;
}

function StoryViewer({ stories, initialIndex, onClose }: StoryViewerProps) {
  const [storyIndex, setStoryIndex] = useState(initialIndex);
  const [segmentIndex, setSegmentIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const story = stories[storyIndex];
  const segment = story?.segments[segmentIndex];
  const totalSegments = story?.segments.length ?? 1;

  const nextSegment = useCallback(() => {
    if (segmentIndex < totalSegments - 1) {
      setSegmentIndex((s) => s + 1);
    } else if (storyIndex < stories.length - 1) {
      setStoryIndex((s) => s + 1);
      setSegmentIndex(0);
    } else {
      onClose();
    }
  }, [segmentIndex, totalSegments, storyIndex, stories.length, onClose]);

  const prevSegment = useCallback(() => {
    if (segmentIndex > 0) {
      setSegmentIndex((s) => s - 1);
    } else if (storyIndex > 0) {
      setStoryIndex((s) => s - 1);
      setSegmentIndex(stories[storyIndex - 1].segments.length - 1);
    }
  }, [segmentIndex, storyIndex, stories]);

  // Auto-advance after 5s
  useEffect(() => {
    timerRef.current = setTimeout(nextSegment, 5000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [storyIndex, segmentIndex, nextSegment]);

  if (!story || !segment) return null;

  const bgImage = segment.type === "photo" && segment.photo ? segment.photo : story.photo;

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Background blurred photo */}
      <img
        src={bgImage}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        style={{ filter: segment.type !== "photo" ? "blur(20px) brightness(0.4)" : "brightness(0.5)" }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/40" />

      {/* Progress bars */}
      <div className="absolute top-0 left-0 right-0 z-20 pt-[env(safe-area-inset-top)] px-3">
        <div className="flex gap-1 mt-3 mb-3" aria-label={`Story ${segmentIndex + 1} sur ${totalSegments}`}>
          {Array.from({ length: totalSegments }).map((_, i) => (
            <div key={i} className="flex-1 h-0.5 bg-white/20 rounded-full overflow-hidden">
              {i < segmentIndex ? (
                <div className="h-full w-full bg-white rounded-full" />
              ) : i === segmentIndex ? (
                <motion.div
                  className="h-full bg-white rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 5, ease: "linear" }}
                  key={`${storyIndex}-${segmentIndex}`}
                />
              ) : null}
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-full p-[2px]"
              style={{ background: "linear-gradient(135deg, #8B5CF6, #00FF88)" }}
            >
              <img src={story.photo} alt="" className="w-full h-full rounded-full object-cover" />
            </div>
            <div>
              <p className="text-[13px] font-bold text-white">{story.name}</p>
              <p className="text-[10px] text-white/50">il y a 2h</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white"
            aria-label="Fermer la story"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${storyIndex}-${segmentIndex}`}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            {segment.emoji && (
              <span className="text-5xl block mb-4" aria-hidden="true">{segment.emoji}</span>
            )}
            <p className="text-2xl font-bold text-white leading-snug">{segment.text}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom CTA */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-6 pb-[calc(env(safe-area-inset-bottom)+24px)]">
        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="w-full py-3 rounded-2xl text-sm font-bold text-white"
          style={{ background: "linear-gradient(135deg, #8B5CF6, #00FF88)" }}
          aria-label="Proposer un plan"
        >
          Proposer un plan
        </motion.button>
      </div>

      {/* Tap zones for navigation */}
      <button
        className="absolute left-0 top-0 w-1/3 h-full z-[15]"
        onClick={prevSegment}
        aria-label="Story precedente"
      />
      <button
        className="absolute right-0 top-0 w-1/3 h-full z-[15]"
        onClick={nextSegment}
        aria-label="Story suivante"
      />
    </motion.div>
  );
}

// --- Main Component ---

export default function MoodStories() {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [viewedIds, setViewedIds] = useState<Set<string>>(new Set());

  const openStory = (index: number) => {
    setViewerIndex(index);
    const newViewed = new Set(viewedIds);
    newViewed.add(MOCK_STORIES[index].id);
    setViewedIds(newViewed);
  };

  return (
    <>
      {/* Horizontal scroll of avatars */}
      <div className="shrink-0 px-3 pb-2">
        <div
          className="flex gap-3 overflow-x-auto no-scrollbar py-1"
          role="list"
          aria-label="Stories d'humeur"
        >
          {MOCK_STORIES.map((story, i) => {
            const isViewed = viewedIds.has(story.id);
            return (
              <div key={story.id} className="shrink-0 flex flex-col items-center gap-1" role="listitem">
                <button
                  onClick={() => openStory(i)}
                  className="tap-target"
                  aria-label={`Story de ${story.name}`}
                >
                  <div
                    className="w-[60px] h-[60px] rounded-full p-[2px]"
                    style={{
                      background: isViewed
                        ? "rgba(128,128,128,0.3)"
                        : "linear-gradient(135deg, #8B5CF6, #00FF88)",
                    }}
                  >
                    <div className="relative">
                      <img
                        src={story.photo}
                        alt={`Photo de ${story.name}`}
                        className="w-[56px] h-[56px] rounded-full object-cover border-2 border-bg"
                      />
                      {story.online && (
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#00FF88] border-2 border-bg" />
                      )}
                    </div>
                  </div>
                </button>
                <span className="text-[11px] text-text-muted font-medium truncate max-w-[60px]">
                  {story.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Full-screen viewer */}
      <AnimatePresence>
        {viewerIndex !== null && (
          <StoryViewer
            stories={MOCK_STORIES}
            initialIndex={viewerIndex}
            onClose={() => setViewerIndex(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
