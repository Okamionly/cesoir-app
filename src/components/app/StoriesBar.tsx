"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { springs, micro } from "@/lib/motion-design";
import { MOCK_PROFILES } from "@/lib/mock-profiles";
import { MODES, ModeKey } from "@/lib/modes";
import StoryCreator from "./StoryCreator";

// ─── Types ───────────────────────────────────────

interface StoryUser {
  id: string;
  name: string;
  photo: string;
  mode: ModeKey;
  online: boolean;
  viewed: boolean;
  viewCount: number;
  reactionCount: number;
  isTrending: boolean;
}

// ─── Data ────────────────────────────────────────

function generateStoryUsers(): StoryUser[] {
  const selected = MOCK_PROFILES.slice(0, 8);
  return selected.map((p, i) => ({
    id: p.id,
    name: p.name,
    photo: p.photo,
    mode: p.mode,
    online: i < 4,
    viewed: i >= 5,
    viewCount: Math.floor(Math.random() * 200) + 10,
    reactionCount: Math.floor(Math.random() * 40),
    isTrending: i < 3, // Top 3 are trending
  }));
}

// ─── Rotating gradient ring CSS ──────────────────

const ringKeyframes = `
@keyframes ring-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
`;

// ─── Component ───────────────────────────────────

export default function StoriesBar() {
  const router = useRouter();
  const [users, setUsers] = useState<StoryUser[]>([]);
  const [viewedIds, setViewedIds] = useState<Set<string>>(new Set());
  const [creatorOpen, setCreatorOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUsers(generateStoryUsers());
    const today = new Date().toISOString().split("T")[0];
    const stored = localStorage.getItem(`cesoir-stories-viewed-${today}`);
    if (stored) {
      setViewedIds(new Set(JSON.parse(stored)));
    }
  }, []);

  // Separate trending from regular stories
  const trendingUsers = users
    .filter((u) => u.isTrending)
    .sort((a, b) => b.viewCount - a.viewCount);
  const regularUsers = users.filter((u) => !u.isTrending);

  const openStory = (user: StoryUser) => {
    // Mark as viewed
    const newViewed = new Set(viewedIds);
    newViewed.add(user.id);
    setViewedIds(newViewed);
    const today = new Date().toISOString().split("T")[0];
    localStorage.setItem(
      `cesoir-stories-viewed-${today}`,
      JSON.stringify([...newViewed])
    );
    // Navigate to stories viewer
    router.push(`/stories?user=${user.id}`);
  };

  return (
    <>
      {/* Inject rotating ring animation */}
      <style dangerouslySetInnerHTML={{ __html: ringKeyframes }} />

      <div className="shrink-0 px-3 pb-2 space-y-2">
        {/* Trending section */}
        {trendingUsers.length > 0 && (
          <div>
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={springs.snap}
              className="flex items-center gap-1.5 mb-1.5 px-1"
            >
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-xs"
              >
                {"\uD83D\uDD25"}
              </motion.span>
              <span className="text-[11px] font-bold text-accent uppercase tracking-wider">
                Trending
              </span>
            </motion.div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar py-1" role="list" aria-label="Trending stories">
              {trendingUsers.map((user, i) => {
                const isViewed = viewedIds.has(user.id);
                return (
                  <motion.div
                    key={`trending-${user.id}`}
                    className="shrink-0 flex flex-col items-center gap-1"
                    role="listitem"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ ...springs.elastic, delay: i * 0.06 }}
                  >
                    <button
                      onClick={() => openStory(user)}
                      className="tap-target relative"
                      aria-label={`Trending story de ${user.name}`}
                    >
                      {/* Fire glow */}
                      <motion.div
                        className="absolute -inset-1 rounded-full"
                        animate={{
                          boxShadow: [
                            "0 0 0px rgba(255,100,0,0)",
                            "0 0 12px rgba(255,100,0,0.4)",
                            "0 0 0px rgba(255,100,0,0)",
                          ],
                        }}
                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                      />
                      <div
                        className="p-[2.5px] rounded-full"
                        style={{
                          background: isViewed
                            ? "var(--color-border)"
                            : "conic-gradient(#FF6B00, #FFD700, #FF6B00)",
                          animation: isViewed ? "none" : "ring-rotate 3s linear infinite",
                        }}
                      >
                        <div className="p-[2px] rounded-full bg-bg">
                          <div className="relative">
                            <img
                              src={user.photo}
                              alt={`Photo de ${user.name}`}
                              className="w-[52px] h-[52px] rounded-full object-cover"
                            />
                            {/* View count badge */}
                            <span className="absolute -top-1 -right-1 min-w-[20px] h-[18px] px-1 rounded-full bg-[#FF6B00] flex items-center justify-center">
                              <span className="text-[8px] text-white font-bold">{user.viewCount}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      {/* Reaction count */}
                      {user.reactionCount > 0 && (
                        <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-bg-card border border-border">
                          <span className="text-[8px]">{"\u2764\uFE0F"}</span>
                          <span className="text-[8px] font-bold text-text-muted">{user.reactionCount}</span>
                        </span>
                      )}
                    </button>
                    <span className="text-[11px] text-text-muted font-medium truncate max-w-[60px] mt-1">
                      {user.name}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Regular stories */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto no-scrollbar py-1"
          role="list"
          aria-label="Stories"
        >
          {/* Add story button */}
          <motion.div
            className="shrink-0 flex flex-col items-center gap-1"
            role="listitem"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...springs.snap, delay: 0 }}
          >
            <button
              onClick={() => setCreatorOpen(true)}
              className="relative w-[60px] h-[60px] rounded-full border-2 border-dashed border-text-muted flex items-center justify-center text-text-muted hover:border-accent hover:text-accent transition-colors tap-target group"
              aria-label="Ajouter une story"
            >
              <motion.div
                whileTap={{ scale: 0.85, rotate: 90 }}
                transition={springs.snap}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </motion.div>
              {/* Accent dot */}
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-accent flex items-center justify-center">
                <span className="text-[9px] text-white font-bold">+</span>
              </span>
            </button>
            <span className="text-[11px] text-text-muted font-medium">Ma story</span>
          </motion.div>

          {/* User story items */}
          {regularUsers.map((user, i) => {
            const isViewed = viewedIds.has(user.id);
            return (
              <motion.div
                key={user.id}
                className="shrink-0 flex flex-col items-center gap-1"
                role="listitem"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ ...springs.snap, delay: (i + 1) * 0.05 }}
              >
                <button
                  onClick={() => openStory(user)}
                  className="tap-target relative"
                  aria-label={`Story de ${user.name}`}
                >
                  {/* Ring wrapper */}
                  <div
                    className="p-[2.5px] rounded-full"
                    style={{
                      background: isViewed
                        ? "var(--color-border)"
                        : "conic-gradient(#8B5CF6, #00FF88, #8B5CF6)",
                      animation: isViewed ? "none" : "ring-rotate 4s linear infinite",
                    }}
                  >
                    {/* White/bg gap */}
                    <div className="p-[2px] rounded-full bg-bg">
                      <div className="relative">
                        <img
                          src={user.photo}
                          alt={`Photo de ${user.name}`}
                          className="w-[52px] h-[52px] rounded-full object-cover"
                        />
                        {user.online && (
                          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#00FF88] border-2 border-bg" />
                        )}
                        {/* View count badge */}
                        <span className="absolute -top-1 -right-1 min-w-[18px] h-[16px] px-1 rounded-full bg-text/80 flex items-center justify-center">
                          <span className="text-[7px] text-bg font-bold">{user.viewCount}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Reaction count */}
                  {user.reactionCount > 0 && (
                    <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-bg-card border border-border">
                      <span className="text-[7px]">{"\u2764\uFE0F"}</span>
                      <span className="text-[7px] font-bold text-text-muted">{user.reactionCount}</span>
                    </span>
                  )}
                </button>
                <span className="text-[11px] text-text-muted font-medium truncate max-w-[60px]">
                  {user.name}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Story Creator modal */}
      <StoryCreator
        open={creatorOpen}
        onClose={() => setCreatorOpen(false)}
      />
    </>
  );
}
