"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";

// ---------- Types ----------

export interface SongData {
  artist: string;
  title: string;
}

// ---------- PlaylistShareButton ----------

interface PlaylistShareButtonProps {
  onAddSong: (song: SongData) => void;
}

export function PlaylistShareButton({ onAddSong }: PlaylistShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [artist, setArtist] = useState("");
  const [title, setTitle] = useState("");

  const handleSubmit = useCallback(() => {
    if (!artist.trim() || !title.trim()) return;
    onAddSong({ artist: artist.trim(), title: title.trim() });
    setIsOpen(false);
    setArtist("");
    setTitle("");
  }, [artist, title, onAddSong]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="tap-target shrink-0 w-11 h-11 rounded-full bg-bg-card border border-border flex items-center justify-center text-text-muted hover:text-accent hover:border-accent/30 transition-colors active:scale-95"
        aria-label="Partager une chanson"
      >
        <span className="text-lg">🎵</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-bg rounded-t-2xl border-t border-border"
              style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
              role="dialog"
              aria-label="Ajouter une chanson"
            >
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>

              <div className="px-5 pb-4">
                <h3 className="text-lg font-bold text-text mb-1">Ajoute une chanson</h3>
                <p className="text-[13px] text-text-muted mb-4">pour votre playlist</p>

                <label className="text-[11px] text-text-muted uppercase tracking-widest font-semibold block mb-2">
                  Artiste
                </label>
                <input
                  type="text"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  placeholder="Nom de l'artiste"
                  className="w-full bg-bg-card border border-border rounded-xl px-3 py-2.5 text-[14px] text-text placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 mb-3"
                />

                <label className="text-[11px] text-text-muted uppercase tracking-widest font-semibold block mb-2">
                  Titre
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Titre de la chanson"
                  className="w-full bg-bg-card border border-border rounded-xl px-3 py-2.5 text-[14px] text-text placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 mb-5"
                />

                <button
                  onClick={handleSubmit}
                  disabled={!artist.trim() || !title.trim()}
                  className="w-full py-3 rounded-2xl gradient-bg text-white font-bold text-[15px] transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  Ajouter a la playlist
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ---------- MusicCard (displayed in chat) ----------

interface MusicCardProps {
  songs: SongData[];
  isOwn: boolean;
  time: string;
}

export function MusicCard({ songs, isOwn, time }: MusicCardProps) {
  const latestSong = songs[songs.length - 1];
  const previousSongs = songs.slice(0, -1);
  const totalCount = songs.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`flex ${isOwn ? "justify-end" : "justify-start"} mt-3`}
    >
      <div className="max-w-[80%] rounded-2xl bg-bg-card border border-border overflow-hidden">
        {/* Header */}
        <div className="px-3.5 pt-3 pb-2 flex items-center gap-2">
          <span className="text-lg">🎵</span>
          <span className="text-[12px] text-accent font-semibold">
            Playlist partagee — {totalCount} titre{totalCount > 1 ? "s" : ""}
          </span>
        </div>

        {/* Stacked previous songs */}
        {previousSongs.length > 0 && (
          <div className="px-3.5 pb-1">
            {previousSongs.slice(-2).map((song, i) => (
              <div
                key={i}
                className="flex items-center gap-2 py-1 opacity-50"
              >
                <div className="w-1 h-6 rounded-full bg-border shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] text-text-muted truncate">{song.title}</p>
                  <p className="text-[10px] text-text-muted truncate">{song.artist}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Latest song (highlighted) */}
        <div className="px-3.5 pb-3 flex items-center gap-2.5">
          <div
            className="w-1 h-10 rounded-full shrink-0"
            style={{ background: "linear-gradient(180deg, #8B5CF6, #00FF88)" }}
          />
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-bold text-text truncate">{latestSong.title}</p>
            <p className="text-[12px] text-text-muted truncate">{latestSong.artist}</p>
          </div>
          {/* Fake play icon */}
          <div className="shrink-0 w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
            <svg width={12} height={12} viewBox="0 0 12 12" fill="#8B5CF6">
              <path d="M2 1l9 5-9 5V1z" />
            </svg>
          </div>
        </div>

        <span className="block text-[10px] text-text-muted px-3.5 pb-2 text-right">{time}</span>
      </div>
    </motion.div>
  );
}
