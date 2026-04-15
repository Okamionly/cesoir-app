"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";

interface GifPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (gif: GifItem) => void;
}

interface GifItem {
  id: string;
  label: string;
  gradient: string;
  category: string;
}

type Category = "Trending" | "Reactions" | "Amour" | "LOL" | "Salut";

const CATEGORIES: Category[] = ["Trending", "Reactions", "Amour", "LOL", "Salut"];

const MOCK_GIFS: GifItem[] = [
  { id: "g1", label: "Bravo", gradient: "linear-gradient(135deg, #8B5CF6, #06b6d4)", category: "Trending" },
  { id: "g2", label: "Wow", gradient: "linear-gradient(135deg, #f59e0b, #ef4444)", category: "Trending" },
  { id: "g3", label: "Trop bien", gradient: "linear-gradient(135deg, #00FF88, #8B5CF6)", category: "Trending" },
  { id: "g4", label: "Danse", gradient: "linear-gradient(135deg, #ec4899, #8B5CF6)", category: "Trending" },
  { id: "g5", label: "Oui oui", gradient: "linear-gradient(135deg, #8B5CF6, #3b82f6)", category: "Reactions" },
  { id: "g6", label: "Non non", gradient: "linear-gradient(135deg, #ef4444, #f97316)", category: "Reactions" },
  { id: "g7", label: "Choque", gradient: "linear-gradient(135deg, #f59e0b, #84cc16)", category: "Reactions" },
  { id: "g8", label: "Triste", gradient: "linear-gradient(135deg, #6366f1, #3b82f6)", category: "Reactions" },
  { id: "g9", label: "Coeur", gradient: "linear-gradient(135deg, #ef4444, #ec4899)", category: "Amour" },
  { id: "g10", label: "Bisou", gradient: "linear-gradient(135deg, #ec4899, #f43f5e)", category: "Amour" },
  { id: "g11", label: "Calin", gradient: "linear-gradient(135deg, #f97316, #ef4444)", category: "Amour" },
  { id: "g12", label: "Papillon", gradient: "linear-gradient(135deg, #a855f7, #ec4899)", category: "Amour" },
  { id: "g13", label: "MDR", gradient: "linear-gradient(135deg, #facc15, #f59e0b)", category: "LOL" },
  { id: "g14", label: "Ptdr", gradient: "linear-gradient(135deg, #84cc16, #22c55e)", category: "LOL" },
  { id: "g15", label: "Fou rire", gradient: "linear-gradient(135deg, #f59e0b, #ef4444)", category: "LOL" },
  { id: "g16", label: "Troll", gradient: "linear-gradient(135deg, #8B5CF6, #6366f1)", category: "LOL" },
  { id: "g17", label: "Coucou", gradient: "linear-gradient(135deg, #00FF88, #06b6d4)", category: "Salut" },
  { id: "g18", label: "Salut", gradient: "linear-gradient(135deg, #3b82f6, #8B5CF6)", category: "Salut" },
  { id: "g19", label: "Yo", gradient: "linear-gradient(135deg, #f97316, #facc15)", category: "Salut" },
  { id: "g20", label: "Hey", gradient: "linear-gradient(135deg, #06b6d4, #00FF88)", category: "Salut" },
];

export default function GifPicker({ open, onClose, onSelect }: GifPickerProps) {
  const [activeCategory, setActiveCategory] = useState<Category>("Trending");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let items = MOCK_GIFS;
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((g) => g.label.toLowerCase().includes(q));
    } else {
      items = items.filter((g) => g.category === activeCategory);
    }
    return items;
  }, [activeCategory, search]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.4)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl max-h-[70vh] flex flex-col"
            style={{ background: "#141414", borderTop: "1px solid #222" }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            role="dialog"
            aria-label="Selecteur de GIFs"
          >
            {/* Handle */}
            <div className="flex justify-center py-3">
              <div className="w-10 h-1 rounded-full" style={{ background: "#444" }} />
            </div>

            {/* Search */}
            <div className="px-4 pb-3">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un GIF..."
                className="w-full px-4 py-2.5 rounded-xl text-[14px] text-white placeholder-gray-500 outline-none"
                style={{ background: "#222", border: "1px solid #333" }}
                aria-label="Rechercher un GIF"
              />
            </div>

            {/* Category tabs */}
            {!search.trim() && (
              <div className="flex gap-2 px-4 pb-3 overflow-x-auto" role="tablist" aria-label="Categories de GIFs">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className="px-4 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-colors"
                    style={{
                      background: activeCategory === cat ? "#8B5CF6" : "#222",
                      color: activeCategory === cat ? "#FFF" : "#999",
                    }}
                    role="tab"
                    aria-selected={activeCategory === cat}
                    aria-label={`Categorie ${cat}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* Grid */}
            <div className="flex-1 overflow-y-auto px-4 pb-6">
              <div className="grid grid-cols-4 gap-2" role="listbox" aria-label="GIFs disponibles">
                {filtered.map((gif, i) => (
                  <motion.button
                    key={gif.id}
                    onClick={() => onSelect(gif)}
                    className="aspect-square rounded-xl flex items-center justify-center"
                    style={{ background: gif.gradient }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.03 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.9 }}
                    role="option"
                    aria-label={`GIF ${gif.label}`}
                  >
                    <span className="text-white text-[11px] font-semibold drop-shadow-lg">
                      {gif.label}
                    </span>
                  </motion.button>
                ))}
              </div>
              {filtered.length === 0 && (
                <p className="text-center py-8 text-[14px]" style={{ color: "#666" }}>
                  Aucun GIF trouve
                </p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
