"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { haptics } from "@/lib/haptics";

interface PhotoRatingProps {
  photos?: string[];
}

interface PhotoVote {
  url: string;
  up: number;
  down: number;
}

const MOCK_PHOTOS = [
  "/mock/photo-1.jpg",
  "/mock/photo-2.jpg",
  "/mock/photo-3.jpg",
  "/mock/photo-4.jpg",
];

export default function PhotoRating({ photos }: PhotoRatingProps) {
  const photoList = photos && photos.length > 0 ? photos : MOCK_PHOTOS;
  const [currentIdx, setCurrentIdx] = useState(0);
  const [votes, setVotes] = useState<PhotoVote[]>(() =>
    photoList.map((url) => ({
      url,
      up: Math.floor(Math.random() * 15) + 3,
      down: Math.floor(Math.random() * 8) + 1,
    })),
  );
  const [showResults, setShowResults] = useState(false);
  const [voted, setVoted] = useState<Set<number>>(new Set());

  const vote = useCallback(
    (isUp: boolean) => {
      if (voted.has(currentIdx)) return;
      haptics.medium();
      setVoted((prev) => new Set(prev).add(currentIdx));
      setVotes((prev) => {
        const next = [...prev];
        if (isUp) {
          next[currentIdx] = { ...next[currentIdx], up: next[currentIdx].up + 1 };
        } else {
          next[currentIdx] = { ...next[currentIdx], down: next[currentIdx].down + 1 };
        }
        return next;
      });

      // Auto-advance after a brief delay
      setTimeout(() => {
        if (currentIdx < photoList.length - 1) {
          setCurrentIdx((p) => p + 1);
        } else {
          setShowResults(true);
        }
      }, 600);
    },
    [currentIdx, photoList.length, voted],
  );

  const winnerIdx = useMemo(() => {
    let best = 0;
    let bestPct = 0;
    votes.forEach((v, i) => {
      const total = v.up + v.down;
      const pct = total > 0 ? v.up / total : 0;
      if (pct > bestPct) {
        bestPct = pct;
        best = i;
      }
    });
    return best;
  }, [votes]);

  const shareLink = useCallback(() => {
    haptics.success();
    if (navigator.share) {
      navigator.share({
        title: "Aide-moi a choisir ma photo de profil !",
        text: "Quelle est ma meilleure photo ? Vote sur CeSoir !",
        url: window.location.origin,
      });
    } else {
      navigator.clipboard?.writeText(
        `${window.location.origin}?photo-vote=true`,
      );
    }
  }, []);

  // Results view
  if (showResults) {
    return (
      <div className="w-full space-y-4" role="region" aria-label="Resultats du vote photo">
        <h3 className="text-sm font-semibold" style={{ color: "#111111" }}>
          Resultats
        </h3>
        {votes.map((v, i) => {
          const total = v.up + v.down;
          const pct = total > 0 ? Math.round((v.up / total) * 100) : 0;
          const isWinner = i === winnerIdx;
          return (
            <motion.div
              key={v.url}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3"
            >
              <div
                className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl"
                style={{
                  backgroundColor: "#e5e7eb",
                  border: isWinner ? "2px solid #8B5CF6" : "2px solid transparent",
                }}
              >
                <div
                  className="flex h-full w-full items-center justify-center text-2xl"
                  aria-label={`Photo ${i + 1}`}
                >
                  {String.fromCodePoint(0x1f4f7)}
                </div>
                {isWinner && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 text-lg"
                    aria-label="Meilleure photo"
                  >
                    {String.fromCodePoint(0x1f451)}
                  </motion.span>
                )}
              </div>
              <div className="flex-1">
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span style={{ color: "#111111" }}>Photo {i + 1}</span>
                  <span style={{ color: "#8B5CF6" }} className="font-medium">
                    {pct}%
                  </span>
                </div>
                <div
                  className="h-2 w-full overflow-hidden rounded-full"
                  style={{ backgroundColor: "rgba(0,0,0,0.06)" }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: isWinner
                        ? "linear-gradient(90deg, #8B5CF6, #00FF88)"
                        : "#8B5CF6",
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, delay: i * 0.15 }}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={() => {
              setShowResults(false);
              setCurrentIdx(0);
              setVoted(new Set());
            }}
            className="flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors"
            style={{ backgroundColor: "rgba(139,92,246,0.1)", color: "#8B5CF6" }}
          >
            Recommencer
          </button>
          <button
            type="button"
            onClick={shareLink}
            className="flex-1 rounded-xl py-2.5 text-sm font-medium text-white transition-colors"
            style={{ backgroundColor: "#8B5CF6" }}
          >
            Demander a des amis
          </button>
        </div>
      </div>
    );
  }

  // Voting view
  return (
    <div className="w-full" role="region" aria-label="Vote pour la meilleure photo">
      <div className="mb-3 flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold" style={{ color: "#111111" }}>
          Meilleure photo de profil ?
        </h3>
        <span className="text-xs" style={{ color: "#8B5CF6" }}>
          {currentIdx + 1}/{photoList.length}
        </span>
      </div>

      <div className="relative overflow-hidden rounded-2xl" style={{ aspectRatio: "3/4" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIdx}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="flex h-full w-full items-center justify-center text-6xl"
            style={{ backgroundColor: "#f3f4f6" }}
            aria-label={`Photo ${currentIdx + 1}`}
          >
            {String.fromCodePoint(0x1f4f7)}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Vote buttons */}
      <div className="mt-3 flex gap-3">
        <motion.button
          type="button"
          onClick={() => vote(false)}
          disabled={voted.has(currentIdx)}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-colors disabled:opacity-50"
          style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#ef4444" }}
          whileTap={{ scale: 0.95 }}
          aria-label="Je n'aime pas cette photo"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
          </svg>
          Bof
        </motion.button>
        <motion.button
          type="button"
          onClick={() => vote(true)}
          disabled={voted.has(currentIdx)}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium text-white transition-colors disabled:opacity-50"
          style={{ backgroundColor: "#22c55e" }}
          whileTap={{ scale: 0.95 }}
          aria-label="J'aime cette photo"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
          </svg>
          Top !
        </motion.button>
      </div>

      {/* Share button */}
      <button
        type="button"
        onClick={shareLink}
        className="mt-3 w-full rounded-xl py-2.5 text-sm font-medium transition-colors"
        style={{ backgroundColor: "rgba(139,92,246,0.1)", color: "#8B5CF6" }}
      >
        Demander a des amis
      </button>
    </div>
  );
}
