"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PROMPTS,
  PROMPT_CATEGORIES,
  getPromptsByCategory,
  getPromptById,
  loadPromptAnswers,
  savePromptAnswers,
  type Prompt,
  type PromptAnswer,
  type PromptCategory,
} from "@/lib/prompts";

// ---------- Sub-components ----------

function CategoryTab({
  category,
  active,
  onClick,
}: {
  category: PromptCategory;
  active: boolean;
  onClick: () => void;
}) {
  const info = PROMPT_CATEGORIES[category];
  return (
    <button
      onClick={onClick}
      className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-medium transition-all ${
        active
          ? "gradient-bg text-white"
          : "bg-bg-card border border-border text-text-muted hover:border-accent/30"
      }`}
    >
      <span>{info.icon}</span>
      <span>{info.label}</span>
    </button>
  );
}

function PromptOption({
  prompt,
  selected,
  answered,
  onSelect,
}: {
  prompt: Prompt;
  selected: boolean;
  answered: string | null;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
        selected
          ? "border-accent bg-accent/5"
          : "border-border bg-bg-card hover:border-accent/30"
      }`}
    >
      <p className="text-sm font-medium text-text">{prompt.text}</p>
      {answered && (
        <p className="text-xs text-accent mt-1 truncate">
          &quot;{answered}&quot;
        </p>
      )}
    </button>
  );
}

// ---------- PromptCard (display on profile) ----------

export function PromptCard({ promptId, answer }: { promptId: string; answer: string }) {
  const prompt = getPromptById(promptId);
  if (!prompt) return null;

  const catInfo = PROMPT_CATEGORIES[prompt.category];

  return (
    <div className="bg-bg-card border border-border rounded-2xl px-4 py-3">
      <p className="text-[11px] text-text-muted font-medium mb-1">
        {catInfo.icon} {prompt.text}
      </p>
      <p className="text-sm text-text leading-relaxed">{answer}</p>
    </div>
  );
}

// ---------- Main PromptPicker (editor) ----------

export default function PromptPicker({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave?: (answers: PromptAnswer[]) => void;
}) {
  const [activeCategory, setActiveCategory] = useState<PromptCategory>("humour");
  const [answers, setAnswers] = useState<PromptAnswer[]>([]);
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const categories = Object.keys(PROMPT_CATEGORIES) as PromptCategory[];

  useEffect(() => {
    if (open) {
      setAnswers(loadPromptAnswers());
      setEditingPromptId(null);
      setEditText("");
    }
  }, [open]);

  const getAnswer = (promptId: string): string | null => {
    return answers.find((a) => a.promptId === promptId)?.answer ?? null;
  };

  const handleSelectPrompt = useCallback(
    (promptId: string) => {
      if (answers.length >= 3 && !answers.find((a) => a.promptId === promptId)) {
        // Max 3 prompts
        return;
      }
      setEditingPromptId(promptId);
      setEditText(getAnswer(promptId) ?? "");
    },
    [answers],
  );

  const handleSaveAnswer = useCallback(() => {
    if (!editingPromptId || !editText.trim()) return;

    setAnswers((prev) => {
      const filtered = prev.filter((a) => a.promptId !== editingPromptId);
      const updated = [...filtered, { promptId: editingPromptId, answer: editText.trim() }];
      return updated.slice(0, 3);
    });
    setEditingPromptId(null);
    setEditText("");
  }, [editingPromptId, editText]);

  const handleRemoveAnswer = useCallback((promptId: string) => {
    setAnswers((prev) => prev.filter((a) => a.promptId !== promptId));
  }, []);

  const handleDone = useCallback(() => {
    savePromptAnswers(answers);
    onSave?.(answers);
    onClose();
  }, [answers, onSave, onClose]);

  const prompts = getPromptsByCategory(activeCategory);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 z-50"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-bg rounded-t-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
            style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2 shrink-0">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-text">Mes Prompts</h2>
                <p className="text-xs text-text-muted">
                  Choisis 3 prompts et reponds ({answers.length}/3)
                </p>
              </div>
              <button
                onClick={handleDone}
                className="text-sm text-accent font-bold"
              >
                Terminer
              </button>
            </div>

            {/* Category tabs */}
            <div className="flex gap-2 px-5 pb-3 overflow-x-auto no-scrollbar shrink-0">
              {categories.map((cat) => (
                <CategoryTab
                  key={cat}
                  category={cat}
                  active={activeCategory === cat}
                  onClick={() => setActiveCategory(cat)}
                />
              ))}
            </div>

            {/* Selected answers summary */}
            {answers.length > 0 && (
              <div className="flex gap-2 px-5 pb-3 overflow-x-auto no-scrollbar shrink-0">
                {answers.map((a) => {
                  const p = getPromptById(a.promptId);
                  if (!p) return null;
                  return (
                    <div
                      key={a.promptId}
                      className="shrink-0 flex items-center gap-1.5 bg-accent/10 border border-accent/20 rounded-full px-3 py-1.5"
                    >
                      <span className="text-[11px] text-accent font-medium truncate max-w-[120px]">
                        {p.text}
                      </span>
                      <button
                        onClick={() => handleRemoveAnswer(a.promptId)}
                        className="text-accent/60 hover:text-accent text-sm"
                        aria-label="Supprimer"
                      >
                        x
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Prompt list */}
            <div className="flex-1 overflow-y-auto px-5 pb-4">
              <div className="flex flex-col gap-2">
                {prompts.map((prompt) => (
                  <PromptOption
                    key={prompt.id}
                    prompt={prompt}
                    selected={editingPromptId === prompt.id}
                    answered={getAnswer(prompt.id)}
                    onSelect={() => handleSelectPrompt(prompt.id)}
                  />
                ))}
              </div>
            </div>

            {/* Edit area */}
            <AnimatePresence>
              {editingPromptId && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-t border-border px-5 pt-3 shrink-0"
                >
                  <p className="text-xs text-text-muted mb-2">
                    {getPromptById(editingPromptId)?.text}
                  </p>
                  <div className="flex gap-2">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      placeholder="Ta reponse..."
                      rows={2}
                      maxLength={200}
                      className="flex-1 bg-bg-card border border-border rounded-xl px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-accent resize-none"
                    />
                    <button
                      onClick={handleSaveAnswer}
                      disabled={!editText.trim()}
                      className="shrink-0 px-4 py-2 rounded-xl gradient-bg text-white text-sm font-bold disabled:opacity-40 active:scale-95 transition-all"
                    >
                      OK
                    </button>
                  </div>
                  <p className="text-[10px] text-text-muted text-right mt-1">
                    {editText.length}/200
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
