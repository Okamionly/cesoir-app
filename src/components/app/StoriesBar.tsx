"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { springs } from "@/lib/motion-design";
import { MOCK_PROFILES } from "@/lib/mock-profiles";
import { ModeKey } from "@/lib/modes";
import { Plus } from "@/components/ui/lucide";
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
    const newViewed = new Set(viewedIds);
    newViewed.add(user.id);
    setViewedIds(newViewed);
    const today = new Date().toISOString().split("T")[0];
    localStorage.setItem(
      `cesoir-stories-viewed-${today}`,
      JSON.stringify([...newViewed])
    );
    router.push(`/stories?user=${user.id}`);
  };

  return (
    <>
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto no-scrollbar px-4 py-3"
        role="list"
        aria-label="Stories"
      >
        {/* Add story button */}
        <motion.div
          className="shrink-0 flex flex-col items-center gap-1.5"
          role="listitem"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <button
            onClick={() => setCreatorOpen(true)}
            className="relative w-[56px] h-[56px] rounded-full border-2 border-dashed border-border flex items-center justify-center text-text-muted hover:border-accent hover:text-accent transition-colors"
            aria-label="Ajouter une story"
          >
            <Plus size={20} strokeWidth={2.5} aria-hidden="true" />
          </button>
          <span className="text-[11px] text-text-muted font-medium">Ma story</span>
        </motion.div>

        {/* Story avatars */}
        {users.map((user, i) => {
          const isViewed = viewedIds.has(user.id) || user.viewed;
          return (
            <motion.div
              key={user.id}
              className="shrink-0 flex flex-col items-center gap-1.5"
              role="listitem"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: i * 0.03 }}
            >
              <button
                onClick={() => openStory(user)}
                className="relative"
                aria-label={`Story de ${user.name}`}
              >
                {/* Gradient ring: purple-green for unread, gray for read */}
                <div
                  className="p-[2.5px] rounded-full"
                  style={{
                    background: isViewed
                      ? "var(--color-border)"
                      : "linear-gradient(135deg, var(--color-accent), var(--color-accent-2))",
                  }}
                >
                  <div className="p-[2px] rounded-full bg-bg">
                    <img
                      src={user.photo}
                      alt={`Photo de ${user.name}`}
                      className="w-[50px] h-[50px] rounded-full object-cover"
                    />
                  </div>
                </div>
                {/* Online indicator */}
                {user.online && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-accent-2 border-2 border-bg" />
                )}
              </button>
              <span className="text-[11px] text-text-muted font-medium truncate max-w-[56px]">
                {user.name}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Story Creator modal */}
      <StoryCreator
        open={creatorOpen}
        onClose={() => setCreatorOpen(false)}
      />
    </>
  );
}
