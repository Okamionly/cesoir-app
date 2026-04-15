"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { springs } from "@/lib/motion-design";
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

      <div className="shrink-0 px-3 pb-2">
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
          {users.map((user, i) => {
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
                  className="tap-target"
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
                      </div>
                    </div>
                  </div>
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
