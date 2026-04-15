"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MOCK_PROFILES } from "@/lib/mock-profiles";
import { MODES, ModeKey } from "@/lib/modes";

interface Story {
  id: string;
  name: string;
  photo: string;
  mode: ModeKey;
  text: string;
  online: boolean;
  viewed: boolean;
  timestamp: string;
}

function getHoursUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / (1000 * 60 * 60)));
}

function getMinutesUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diff = midnight.getTime() - now.getTime();
  return Math.max(0, Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)));
}

const STORY_TEXTS = [
  "Ce soir je suis au Marais, qui veut me rejoindre ?",
  "Petit resto japonais dans le 11e, une place en plus !",
  "Balade le long du canal, il fait trop beau ce soir",
  "Qui connait un bon bar a cocktails pres de Bastille ?",
  "Concert gratuit au Petit Bain, j'y vais a 21h !",
  "Premier soir a Paris, montrez-moi vos spots preferes",
  "Soiree jeux de societe chez moi, ramenez des snacks !",
  "Running au Luxembourg a 19h, tous niveaux",
];

function generateStories(): Story[] {
  const selected = MOCK_PROFILES.slice(0, 8);
  return selected.map((p, i) => ({
    id: p.id,
    name: p.name,
    photo: p.photo,
    mode: p.mode,
    text: STORY_TEXTS[i % STORY_TEXTS.length],
    online: i < 4,
    viewed: i >= 5,
    timestamp: `il y a ${Math.floor(Math.random() * 3) + 1}h`,
  }));
}

export default function StoriesBar() {
  const [stories, setStories] = useState<Story[]>([]);
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [viewedIds, setViewedIds] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setStories(generateStories());
    // Load viewed stories from localStorage
    const today = new Date().toISOString().split("T")[0];
    const stored = localStorage.getItem(`cesoir-stories-viewed-${today}`);
    if (stored) {
      setViewedIds(new Set(JSON.parse(stored)));
    }
  }, []);

  const openStory = (story: Story) => {
    setActiveStory(story);
    const newViewed = new Set(viewedIds);
    newViewed.add(story.id);
    setViewedIds(newViewed);
    const today = new Date().toISOString().split("T")[0];
    localStorage.setItem(
      `cesoir-stories-viewed-${today}`,
      JSON.stringify([...newViewed])
    );
  };

  const hours = getHoursUntilMidnight();
  const minutes = getMinutesUntilMidnight();

  return (
    <>
      {/* Stories scroll row */}
      <div className="shrink-0 px-3 pb-2">
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto no-scrollbar py-1"
          role="list"
          aria-label="Stories"
        >
          {/* Add story button */}
          <div className="shrink-0 flex flex-col items-center gap-1" role="listitem">
            <button
              className="w-[60px] h-[60px] rounded-full border-2 border-dashed border-text-muted flex items-center justify-center text-text-muted hover:border-accent hover:text-accent transition-colors tap-target"
              aria-label="Ajouter une story"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            <span className="text-[11px] text-text-muted font-medium">Ma story</span>
          </div>

          {/* Story items */}
          {stories.map((story) => {
            const isViewed = viewedIds.has(story.id);
            return (
              <div
                key={story.id}
                className="shrink-0 flex flex-col items-center gap-1"
                role="listitem"
              >
                <button
                  onClick={() => openStory(story)}
                  className={`${isViewed ? "story-ring-off" : "story-ring"} tap-target`}
                  aria-label={`Story de ${story.name}`}
                >
                  <div className="relative">
                    <img
                      src={story.photo}
                      alt={`Photo de ${story.name}`}
                      className="w-[56px] h-[56px] rounded-full object-cover bg-bg"
                    />
                    {story.online && (
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#00FF88] border-2 border-bg" />
                    )}
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

      {/* Story viewer overlay */}
      <AnimatePresence>
        {activeStory && (
          <motion.div
            className="fixed inset-0 z-50 bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {/* Background photo */}
            <img
              src={activeStory.photo}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/30" />

            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-10 pt-[env(safe-area-inset-top)] px-4">
              {/* Progress bar */}
              <div className="w-full h-0.5 bg-white/20 rounded-full mt-3 mb-3">
                <motion.div
                  className="h-full bg-white rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 5, ease: "linear" }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="story-ring">
                    <img
                      src={activeStory.photo}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-white">{activeStory.name}</p>
                    <p className="text-[10px] text-white/50">{activeStory.timestamp}</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveStory(null)}
                  className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white tap-target"
                  aria-label="Fermer la story"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-6 pb-[calc(env(safe-area-inset-bottom)+24px)] z-10">
              {/* Mode badge */}
              <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md rounded-full px-3 py-1.5 w-fit mb-4">
                <span className="text-[12px]" aria-hidden="true">{MODES[activeStory.mode].icon}</span>
                <span className="text-[10px] text-white/80 font-semibold">{MODES[activeStory.mode].name}</span>
              </div>

              {/* Story text */}
              <motion.p
                className="text-[20px] font-bold text-white leading-snug mb-4"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                {activeStory.text}
              </motion.p>

              {/* Expiry */}
              <motion.p
                className="text-[11px] text-white/40 font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Expire dans {hours}h{minutes > 0 ? `${String(minutes).padStart(2, "0")}` : ""}
              </motion.p>
            </div>

            {/* Tap to close on background */}
            <button
              className="absolute inset-0 z-[5]"
              onClick={() => setActiveStory(null)}
              aria-label="Fermer"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
