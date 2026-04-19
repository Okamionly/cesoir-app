"use client";

import { useState, useCallback } from "react";
import { m, AnimatePresence } from "motion/react";
import { springs } from "@/lib/motion-design";
import {
  CHAT_VIOLET_VERT_GRADIENT,
  CHAT_ALBUM_GRADIENTS,
  BRAND_VIOLET,
} from "@/lib/chat-content-colors";

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

export interface SongData {
  artist: string;
  title: string;
  /** Who added it: "me" | "them" */
  addedBy?: "me" | "them";
}

// ─────────────────────────────────────────
// Mock: 6 French songs for shared playlist
// ─────────────────────────────────────────

export const MOCK_SHARED_PLAYLIST: SongData[] = [
  { artist: "Stromae", title: "Papaoutai", addedBy: "me" },
  { artist: "Angele", title: "Balance Ton Quoi", addedBy: "them" },
  { artist: "Aya Nakamura", title: "Djadja", addedBy: "me" },
  { artist: "Edith Piaf", title: "La Vie En Rose", addedBy: "them" },
  { artist: "Indila", title: "Derniere Danse", addedBy: "me" },
  { artist: "Maitre Gims", title: "Sappes comme jamais", addedBy: "them" },
];

// ─────────────────────────────────────────
// PlaylistShareButton — add a song
// ─────────────────────────────────────────

interface PlaylistShareButtonProps {
  onAddSong: (song: SongData) => void;
}

export function PlaylistShareButton({ onAddSong }: PlaylistShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [artist, setArtist] = useState("");
  const [title, setTitle] = useState("");

  const handleSubmit = useCallback(() => {
    if (!artist.trim() || !title.trim()) return;
    onAddSong({ artist: artist.trim(), title: title.trim(), addedBy: "me" });
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
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50"
              onClick={() => setIsOpen(false)}
            />
            <m.div
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
                <p className="text-[13px] text-text-muted mb-4">pour votre playlist commune</p>

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
            </m.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ─────────────────────────────────────────
// MusicCard (displayed in chat)
// ─────────────────────────────────────────

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
    <m.div
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
            style={{ background: CHAT_VIOLET_VERT_GRADIENT }}
          />
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-bold text-text truncate">{latestSong.title}</p>
            <p className="text-[12px] text-text-muted truncate">{latestSong.artist}</p>
          </div>
          {/* Fake play icon */}
          <div className="shrink-0 w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
            <svg width={12} height={12} viewBox="0 0 12 12" fill={BRAND_VIOLET}>
              <path d="M2 1l9 5-9 5V1z" />
            </svg>
          </div>
        </div>

        <span className="block text-[10px] text-text-muted px-3.5 pb-2 text-right">{time}</span>
      </div>
    </m.div>
  );
}

// ─────────────────────────────────────────
// SharedPlaylist — "Playlist commune"
// Both users can add songs, full view
// ─────────────────────────────────────────

interface SharedPlaylistProps {
  songs: SongData[];
  onAddSong: (song: SongData) => void;
  /** Partner name */
  partnerName: string;
  className?: string;
}

export function SharedPlaylist({
  songs,
  onAddSong,
  partnerName,
  className = "",
}: SharedPlaylistProps) {
  const [showAdd, setShowAdd] = useState(false);

  return (
    <m.div
      className={`bg-bg-card border border-border rounded-2xl overflow-hidden ${className}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springs.heavy}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎶</span>
            <div>
              <h3 className="text-[15px] font-bold text-text">Playlist commune</h3>
              <p className="text-[11px] text-text-muted">
                Avec {partnerName} &middot; {songs.length} titre{songs.length > 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <m.button
            onClick={() => setShowAdd(true)}
            className="px-3 py-1.5 rounded-full bg-accent/10 text-accent text-[12px] font-semibold border border-accent/20"
            whileTap={{ scale: 0.95 }}
            transition={springs.micro}
          >
            + Ajouter
          </m.button>
        </div>
      </div>

      {/* Song list */}
      <div className="divide-y divide-border">
        {songs.map((song, i) => (
          <m.div
            key={`${song.artist}-${song.title}-${i}`}
            className="flex items-center gap-3 px-4 py-3"
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...springs.snap, delay: i * 0.05 }}
          >
            {/* Album art placeholder */}
            <div
              className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center"
              style={{
                background: CHAT_ALBUM_GRADIENTS[i % CHAT_ALBUM_GRADIENTS.length],
              }}
            >
              <svg width={14} height={14} viewBox="0 0 24 24" fill="white">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>

            {/* Song info */}
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-text truncate">{song.title}</p>
              <p className="text-[11px] text-text-muted truncate">{song.artist}</p>
            </div>

            {/* Who added it */}
            {song.addedBy && (
              <span className="text-[9px] text-text-muted font-medium shrink-0 px-2 py-0.5 rounded-full bg-bg">
                {song.addedBy === "me" ? "Toi" : partnerName}
              </span>
            )}
          </m.div>
        ))}
      </div>

      {/* "Ecouter ensemble" concept */}
      <div className="px-4 py-3 border-t border-border">
        <m.button
          className="w-full py-2.5 rounded-xl bg-accent/10 border border-accent/20 text-accent text-[13px] font-bold flex items-center justify-center gap-2"
          whileTap={{ scale: 0.97 }}
          transition={springs.micro}
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          Ecouter ensemble
        </m.button>
      </div>

      {/* Inline add song sheet */}
      <AnimatePresence>
        {showAdd && (
          <InlineAddSong
            onAdd={(song) => {
              onAddSong(song);
              setShowAdd(false);
            }}
            onClose={() => setShowAdd(false)}
          />
        )}
      </AnimatePresence>
    </m.div>
  );
}

// ─────────────────────────────────────────
// Inline add song form
// ─────────────────────────────────────────

function InlineAddSong({
  onAdd,
  onClose,
}: {
  onAdd: (song: SongData) => void;
  onClose: () => void;
}) {
  const [artist, setArtist] = useState("");
  const [title, setTitle] = useState("");

  return (
    <>
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 z-50"
        onClick={onClose}
      />
      <m.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-bg rounded-t-2xl border-t border-border"
        style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
        role="dialog"
        aria-label="Ajouter a la playlist commune"
      >
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>
        <div className="px-5 pb-4">
          <h3 className="text-lg font-bold text-text mb-4">Ajouter a la playlist</h3>

          <input
            type="text"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            placeholder="Artiste"
            className="w-full bg-bg-card border border-border rounded-xl px-3 py-2.5 text-[14px] text-text placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 mb-3"
            autoFocus
          />
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre"
            className="w-full bg-bg-card border border-border rounded-xl px-3 py-2.5 text-[14px] text-text placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 mb-4"
          />

          <button
            onClick={() => {
              if (artist.trim() && title.trim()) {
                onAdd({ artist: artist.trim(), title: title.trim(), addedBy: "me" });
              }
            }}
            disabled={!artist.trim() || !title.trim()}
            className="w-full py-3 rounded-2xl gradient-bg text-white font-bold text-[15px] transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            Ajouter
          </button>
        </div>
      </m.div>
    </>
  );
}
