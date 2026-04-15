"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { springs } from "@/lib/motion-design";
import { MOCK_PROFILES } from "@/lib/mock-profiles";
import { MODES, type ModeKey } from "@/lib/modes";

// ─── Types ───────────────────────────────────────

interface StoryItem {
  id: string;
  text: string;
  gradient: string;
  mood: string;
  location: string;
  timestamp: string;
}

interface UserStoryGroup {
  userId: string;
  name: string;
  photo: string;
  mode: ModeKey;
  stories: StoryItem[];
}

// ─── Gradient presets ────────────────────────────

const GRADIENTS = [
  "linear-gradient(135deg, #8B5CF6, #6D28D9)",
  "linear-gradient(135deg, #00FF88, #059669)",
  "linear-gradient(135deg, #3B82F6, #1D4ED8)",
  "linear-gradient(135deg, #EC4899, #DB2777)",
  "linear-gradient(135deg, #F59E0B, #D97706)",
  "linear-gradient(135deg, #06B6D4, #0891B2)",
];

const STORY_CONTENT = [
  { text: "Ce soir je suis au Marais, qui veut me rejoindre ?", mood: "🔥", location: "Le Marais" },
  { text: "Petit resto japonais dans le 11e, une place en plus !", mood: "🍽️", location: "11e arrondissement" },
  { text: "Balade le long du canal, il fait trop beau", mood: "✨", location: "Canal Saint-Martin" },
  { text: "Concert gratuit au Petit Bain, j'y vais a 21h !", mood: "🎬", location: "Petit Bain" },
  { text: "Soiree jeux de societe chez moi ce soir", mood: "🎉", location: "Bastille" },
  { text: "Running au Luxembourg a 19h, tous niveaux", mood: "💪", location: "Jardin du Luxembourg" },
  { text: "Premier soir a Paris, montrez-moi vos spots", mood: "😎", location: "Paris Centre" },
  { text: "Qui connait un bon bar a cocktails ?", mood: "🥂", location: "Oberkampf" },
  { text: "Kebab a minuit et discussion, qui est partant ?", mood: "🌙", location: "Republique" },
  { text: "Vernissage dans le Marais + cocktails offerts", mood: "🎉", location: "Le Marais" },
  { text: "Escape game ce soir, il manque un joueur !", mood: "🔥", location: "Chatelet" },
  { text: "Film en plein air au parc de la Villette", mood: "✨", location: "La Villette" },
  { text: "Yoga au coucher du soleil puis smoothie", mood: "💜", location: "Buttes-Chaumont" },
];

// ─── Mock data: 5 users, 2-3 stories each ───────

function generateUserStories(): UserStoryGroup[] {
  const selected = MOCK_PROFILES.slice(0, 5);
  let contentIdx = 0;

  return selected.map((profile) => {
    const storyCount = 2 + (parseInt(profile.id) % 2); // 2 or 3
    const stories: StoryItem[] = [];

    for (let i = 0; i < storyCount; i++) {
      const content = STORY_CONTENT[contentIdx % STORY_CONTENT.length];
      stories.push({
        id: `${profile.id}-${i}`,
        text: content.text,
        gradient: GRADIENTS[(contentIdx + parseInt(profile.id)) % GRADIENTS.length],
        mood: content.mood,
        location: content.location,
        timestamp: `il y a ${Math.floor(Math.random() * 4) + 1}h`,
      });
      contentIdx++;
    }

    return {
      userId: profile.id,
      name: profile.name,
      photo: profile.photo,
      mode: profile.mode,
      stories,
    };
  });
}

// ─── Quick Reaction Emojis ───────────────────────

const REACTION_EMOJIS = ["❤️", "🔥", "😂", "😮", "👏", "💜"];

// ─── Component ───────────────────────────────────

export default function StoriesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const userParam = searchParams.get("user");

  const [allGroups] = useState<UserStoryGroup[]>(generateUserStories);
  const [groupIdx, setGroupIdx] = useState(0);
  const [storyIdx, setStoryIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showReactions, setShowReactions] = useState(false);
  const [sentReaction, setSentReaction] = useState<string | null>(null);
  const [direction, setDirection] = useState<1 | -1>(1);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const STORY_DURATION = 5000; // 5 seconds

  // Navigate to the correct user on mount
  useEffect(() => {
    if (userParam) {
      const idx = allGroups.findIndex((g) => g.userId === userParam);
      if (idx >= 0) {
        setGroupIdx(idx);
        setStoryIdx(0);
      }
    }
  }, [userParam, allGroups]);

  const currentGroup = allGroups[groupIdx];
  const currentStory = currentGroup?.stories[storyIdx];
  const totalStoriesInGroup = currentGroup?.stories.length ?? 0;

  // ─── Auto-advance timer ──────────────────────

  const advanceStory = useCallback(() => {
    setDirection(1);
    if (storyIdx < totalStoriesInGroup - 1) {
      setStoryIdx((s) => s + 1);
    } else if (groupIdx < allGroups.length - 1) {
      setGroupIdx((g) => g + 1);
      setStoryIdx(0);
    } else {
      router.back();
    }
  }, [storyIdx, totalStoriesInGroup, groupIdx, allGroups.length, router]);

  useEffect(() => {
    startTimeRef.current = Date.now();
    setProgress(0);
    setSentReaction(null);

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min(elapsed / STORY_DURATION, 1);
      setProgress(pct);
      if (pct >= 1) {
        if (timerRef.current) clearInterval(timerRef.current);
        advanceStory();
      }
    }, 30);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [groupIdx, storyIdx, advanceStory]);

  // ─── Navigation handlers ─────────────────────

  const goNext = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setDirection(1);
    if (storyIdx < totalStoriesInGroup - 1) {
      setStoryIdx((s) => s + 1);
    } else if (groupIdx < allGroups.length - 1) {
      setGroupIdx((g) => g + 1);
      setStoryIdx(0);
    } else {
      router.back();
    }
  }, [storyIdx, totalStoriesInGroup, groupIdx, allGroups.length, router]);

  const goPrev = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setDirection(-1);
    if (storyIdx > 0) {
      setStoryIdx((s) => s - 1);
    } else if (groupIdx > 0) {
      setGroupIdx((g) => g - 1);
      const prevGroup = allGroups[groupIdx - 1];
      setStoryIdx(prevGroup.stories.length - 1);
    }
  }, [storyIdx, groupIdx, allGroups]);

  const handleTap = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      if (x < rect.width / 3) {
        goPrev();
      } else {
        goNext();
      }
    },
    [goNext, goPrev]
  );

  // ─── Swipe up to profile ────────────────────

  const touchStartY = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const dy = touchStartY.current - e.changedTouches[0].clientY;
      if (dy > 80) {
        router.push(`/profile?id=${currentGroup.userId}`);
      }
    },
    [router, currentGroup]
  );

  // ─── Send reaction ──────────────────────────

  const sendReaction = useCallback((emoji: string) => {
    setSentReaction(emoji);
    setShowReactions(false);
    setTimeout(() => setSentReaction(null), 1500);
  }, []);

  if (!currentGroup || !currentStory) {
    return null;
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black select-none"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      transition={springs.elastic}
    >
      {/* Tap areas + swipe */}
      <div
        className="absolute inset-0 z-[15]"
        onClick={handleTap}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      />

      {/* Story content with transitions */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentStory.id}
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: currentStory.gradient }}
          initial={{ x: direction === 1 ? 80 : -80, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: direction === 1 ? -80 : 80, opacity: 0 }}
          transition={springs.heavy}
        >
          {/* Story text */}
          <motion.div
            className="px-8 text-center"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ ...springs.elastic, delay: 0.1 }}
          >
            <motion.span
              className="text-[48px] block mb-4"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ ...springs.elastic, delay: 0.15 }}
            >
              {currentStory.mood}
            </motion.span>
            <p className="text-[22px] sm:text-[26px] font-bold text-white leading-snug max-w-[320px] mx-auto drop-shadow-lg">
              {currentStory.text}
            </p>
            <motion.p
              className="text-[13px] text-white/60 mt-3 font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              📍 {currentStory.location}
            </motion.p>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Top overlay: progress + user info */}
      <div className="absolute top-0 left-0 right-0 z-20 pt-[env(safe-area-inset-top)] px-3">
        {/* Progress bars */}
        <div className="flex gap-1 mt-3 mb-3">
          {currentGroup.stories.map((story, i) => (
            <div
              key={story.id}
              className="flex-1 h-[2.5px] bg-white/20 rounded-full overflow-hidden"
            >
              <motion.div
                className="h-full bg-white rounded-full origin-left"
                style={{
                  scaleX:
                    i < storyIdx
                      ? 1
                      : i === storyIdx
                        ? progress
                        : 0,
                }}
                transition={i === storyIdx ? { duration: 0.03, ease: "linear" } : undefined}
              />
            </div>
          ))}
        </div>

        {/* User info + close */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="story-ring">
              <img
                src={currentGroup.photo}
                alt=""
                className="w-8 h-8 rounded-full object-cover"
              />
            </div>
            <div>
              <p className="text-[13px] font-bold text-white">{currentGroup.name}</p>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px]">{MODES[currentGroup.mode].icon}</span>
                <p className="text-[10px] text-white/50">{currentStory.timestamp}</p>
              </div>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.back();
            }}
            className="relative z-30 w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white tap-target"
            aria-label="Fermer les stories"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Bottom: Reagir button */}
      <div className="absolute bottom-0 left-0 right-0 z-20 pb-[calc(env(safe-area-inset-bottom)+24px)] px-4">
        {/* Sent reaction feedback */}
        <AnimatePresence>
          {sentReaction && (
            <motion.div
              className="absolute bottom-24 left-1/2 -translate-x-1/2"
              initial={{ y: 40, scale: 0.3, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: -60, scale: 0.5, opacity: 0 }}
              transition={springs.elastic}
            >
              <span className="text-[56px]">{sentReaction}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reaction picker */}
        <AnimatePresence>
          {showReactions && (
            <motion.div
              className="flex items-center justify-center gap-3 mb-4 bg-black/50 backdrop-blur-xl rounded-full px-4 py-3 mx-auto w-fit"
              initial={{ y: 40, opacity: 0, scale: 0.8 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 40, opacity: 0, scale: 0.8 }}
              transition={springs.elastic}
              onClick={(e) => e.stopPropagation()}
            >
              {REACTION_EMOJIS.map((emoji, i) => (
                <motion.button
                  key={emoji}
                  className="text-[28px] tap-target flex items-center justify-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    sendReaction(emoji);
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ ...springs.elastic, delay: i * 0.04 }}
                  whileTap={{ scale: 1.4 }}
                  aria-label={`Reagir avec ${emoji}`}
                >
                  {emoji}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reagir button */}
        <motion.button
          className="relative z-30 mx-auto flex items-center gap-2 bg-white/15 backdrop-blur-xl rounded-full px-5 py-2.5 text-white font-semibold text-[14px] tap-target"
          onClick={(e) => {
            e.stopPropagation();
            setShowReactions((v) => !v);
          }}
          whileTap={{ scale: 0.92 }}
          transition={springs.snap}
        >
          <span className="text-[16px]">💬</span>
          Reagir
        </motion.button>

        {/* Swipe up hint */}
        <motion.p
          className="text-center text-[10px] text-white/30 mt-3 font-medium"
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          Glisser vers le haut pour voir le profil
        </motion.p>
      </div>

      {/* User navigation dots (group indicator) */}
      <div className="absolute bottom-[calc(env(safe-area-inset-bottom)+100px)] right-3 z-20 flex flex-col gap-2">
        {allGroups.map((group, i) => (
          <motion.button
            key={group.userId}
            className={`w-2 h-2 rounded-full transition-colors ${
              i === groupIdx ? "bg-white" : "bg-white/30"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              setDirection(i > groupIdx ? 1 : -1);
              setGroupIdx(i);
              setStoryIdx(0);
            }}
            whileTap={{ scale: 1.5 }}
            aria-label={`Stories de ${group.name}`}
          />
        ))}
      </div>
    </motion.div>
  );
}
