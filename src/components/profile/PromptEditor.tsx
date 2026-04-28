"use client";

/**
 * PromptEditor — Hinge-style 3-prompt editor (Wave 17).
 *
 * UX flow:
 *   1. Open from /profile. The modal lists the user's current 0–3 picks
 *      as "slots". Empty slots show a dashed CTA "Choisir un prompt".
 *   2. Tapping a slot enters PICK mode → grouped, scrollable list of all
 *      50 PROMPT_QUESTIONS (filterable by category chips).
 *   3. Selecting a question enters ANSWER mode → single textarea with
 *      a 150-char counter. The Save button stages the change locally.
 *   4. The user can swap, reorder (move up/down), or remove any of the
 *      three slots before committing all changes via "Sauvegarder".
 *
 * Persistence: a single `saveAll()` round-trip wipes-and-rewrites the
 * server-side rows so the post-state matches the staged list exactly.
 *
 * A11y:
 *   * `<dialog>`-like role + aria-modal + Escape-to-close.
 *   * Focus moves into the modal on open and restores on close.
 *   * Each interactive element has tap-target sizing (≥44px).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Trash2,
  X,
  Check,
} from "@/components/ui/lucide";
import {
  PROMPT_QUESTIONS,
  PROMPT_QUESTION_CATEGORIES,
  PROMPT_ANSWER_MAX_LENGTH,
  PROMPT_SLOT_COUNT,
  getPromptQuestionById,
  type PromptQuestion,
  type PromptQuestionCategory,
} from "@/lib/prompts";
import {
  useProfilePrompts,
  type ResolvedProfilePrompt,
} from "@/lib/useProfilePrompts";

// ── Types ────────────────────────────────────────────────────────────────────

interface PromptEditorProps {
  /** Drives mount + initial state hydration. */
  open: boolean;
  /** Called when the user dismisses (X, Escape, backdrop click) or saves. */
  onClose: () => void;
}

/**
 * Local staged shape — `promptId === null` represents an empty slot the
 * user hasn't filled yet. We allow empties so the user can mid-edit have
 * 1 or 2 chosen prompts before saving.
 */
interface DraftSlot {
  promptId: string | null;
  answer: string;
}

type EditorView =
  | { kind: "list" }
  | { kind: "pick"; slotIndex: number }
  | { kind: "answer"; slotIndex: number; promptId: string };

// ── Helpers ──────────────────────────────────────────────────────────────────

const EMPTY_SLOT: DraftSlot = { promptId: null, answer: "" };

function hydrateFromServer(
  current: ResolvedProfilePrompt[],
): DraftSlot[] {
  // Always work in a fixed-length 3-slot array so the UI can render empty
  // slots without sentinel branches.
  const draft: DraftSlot[] = [
    { ...EMPTY_SLOT },
    { ...EMPTY_SLOT },
    { ...EMPTY_SLOT },
  ];
  current.forEach((p, idx) => {
    if (idx < PROMPT_SLOT_COUNT) {
      draft[idx] = { promptId: p.promptId, answer: p.answer };
    }
  });
  return draft;
}

function isFilled(slot: DraftSlot): boolean {
  return !!slot.promptId && slot.answer.trim().length > 0;
}

function nonEmptyDraft(
  slots: DraftSlot[],
): Array<{ promptId: string; answer: string }> {
  return slots
    .filter(isFilled)
    .map((s) => ({ promptId: s.promptId as string, answer: s.answer }));
}

// ── Component ────────────────────────────────────────────────────────────────

export default function PromptEditor({ open, onClose }: PromptEditorProps) {
  const { prompts, saveAll } = useProfilePrompts();

  const [draft, setDraft] = useState<DraftSlot[]>(() =>
    hydrateFromServer(prompts),
  );
  const [view, setView] = useState<EditorView>({ kind: "list" });
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Re-hydrate the draft whenever the modal (re)opens. Closing without
  // saving discards local edits — same convention as iOS Settings sheets.
  useEffect(() => {
    if (open) {
      setDraft(hydrateFromServer(prompts));
      setView({ kind: "list" });
      setErrorMsg(null);
    }
  }, [open, prompts]);

  // Escape closes the modal — only trap when actually open to avoid leaking
  // listeners across mount/unmount.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Lock body scroll while the modal is open (mobile is the dominant target).
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // ── Mutators ───────────────────────────────────────────────────────────────

  const updateSlot = useCallback(
    (index: number, next: DraftSlot) => {
      setDraft((cur) => {
        const copy = cur.slice();
        copy[index] = next;
        return copy;
      });
    },
    [],
  );

  const removeSlot = useCallback((index: number) => {
    setDraft((cur) => {
      const copy = cur.slice();
      copy.splice(index, 1);
      copy.push({ ...EMPTY_SLOT });
      return copy;
    });
  }, []);

  const moveSlot = useCallback((index: number, direction: -1 | 1) => {
    setDraft((cur) => {
      const target = index + direction;
      if (target < 0 || target >= cur.length) return cur;
      const copy = cur.slice();
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setErrorMsg(null);
    try {
      await saveAll(nonEmptyDraft(draft));
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  }, [draft, saveAll, onClose]);

  const filledCount = useMemo(
    () => draft.filter(isFilled).length,
    [draft],
  );

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="prompt-editor"
        className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label="Édition des prompts du profil"
      >
        <motion.div
          className="relative w-full sm:max-w-lg max-h-[92vh] sm:max-h-[80vh] flex flex-col bg-bg sm:rounded-3xl rounded-t-3xl border-t border-border sm:border shadow-2xl overflow-hidden"
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
          onClick={(e) => e.stopPropagation()}
        >
          {view.kind === "list" && (
            <ListView
              draft={draft}
              filledCount={filledCount}
              saving={saving}
              errorMsg={errorMsg}
              onClose={onClose}
              onPickSlot={(idx) => setView({ kind: "pick", slotIndex: idx })}
              onEditSlot={(idx) => {
                const slot = draft[idx];
                if (slot.promptId) {
                  setView({
                    kind: "answer",
                    slotIndex: idx,
                    promptId: slot.promptId,
                  });
                } else {
                  setView({ kind: "pick", slotIndex: idx });
                }
              }}
              onRemove={removeSlot}
              onMove={moveSlot}
              onSave={handleSave}
            />
          )}

          {view.kind === "pick" && (
            <PickView
              currentIds={draft.map((s) => s.promptId)}
              onCancel={() => setView({ kind: "list" })}
              onPick={(promptId) =>
                setView({
                  kind: "answer",
                  slotIndex: view.slotIndex,
                  promptId,
                })
              }
            />
          )}

          {view.kind === "answer" && (
            <AnswerView
              slotIndex={view.slotIndex}
              promptId={view.promptId}
              initialAnswer={
                draft[view.slotIndex]?.promptId === view.promptId
                  ? draft[view.slotIndex].answer
                  : ""
              }
              onBack={() => setView({ kind: "pick", slotIndex: view.slotIndex })}
              onCommit={(answer) => {
                updateSlot(view.slotIndex, {
                  promptId: view.promptId,
                  answer,
                });
                setView({ kind: "list" });
              }}
              onCancel={() => setView({ kind: "list" })}
            />
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Sub-views ────────────────────────────────────────────────────────────────

interface ListViewProps {
  draft: DraftSlot[];
  filledCount: number;
  saving: boolean;
  errorMsg: string | null;
  onClose: () => void;
  onPickSlot: (index: number) => void;
  onEditSlot: (index: number) => void;
  onRemove: (index: number) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onSave: () => void;
}

function ListView({
  draft,
  filledCount,
  saving,
  errorMsg,
  onClose,
  onPickSlot,
  onEditSlot,
  onRemove,
  onMove,
  onSave,
}: ListViewProps) {
  return (
    <>
      <ModalHeader
        title="Mes prompts"
        subtitle={`${filledCount} / ${PROMPT_SLOT_COUNT} sélectionnés`}
        onClose={onClose}
      />

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {draft.map((slot, idx) => (
          <SlotRow
            key={idx}
            index={idx}
            slot={slot}
            canMoveUp={idx > 0 && isFilled(slot)}
            canMoveDown={idx < PROMPT_SLOT_COUNT - 1 && isFilled(slot)}
            onPick={() => onPickSlot(idx)}
            onEdit={() => onEditSlot(idx)}
            onRemove={() => onRemove(idx)}
            onMoveUp={() => onMove(idx, -1)}
            onMoveDown={() => onMove(idx, 1)}
          />
        ))}

        <p className="text-[12px] text-text-muted leading-relaxed pt-2">
          Choisis 3 prompts pour montrer ta personnalité au-delà des photos.
          Tu peux les changer à tout moment.
        </p>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="px-5 py-2 text-[12px] text-red-500 bg-red-500/10 border-t border-red-500/20"
        >
          {errorMsg}
        </div>
      )}

      <div className="border-t border-border px-5 py-4 bg-bg flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-3 rounded-2xl border border-border text-[14px] font-medium text-text-muted hover:text-text hover:border-text/30 transition-colors tap-target"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="flex-[1.4] py-3 rounded-2xl bg-text text-bg text-[14px] font-semibold tracking-tight hover:opacity-90 transition-all tap-target disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? "Enregistrement…" : "Sauvegarder"}
        </button>
      </div>
    </>
  );
}

interface SlotRowProps {
  index: number;
  slot: DraftSlot;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onPick: () => void;
  onEdit: () => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function SlotRow({
  index,
  slot,
  canMoveUp,
  canMoveDown,
  onPick,
  onEdit,
  onRemove,
  onMoveUp,
  onMoveDown,
}: SlotRowProps) {
  const question = slot.promptId ? getPromptQuestionById(slot.promptId) : null;

  if (!isFilled(slot) || !question) {
    return (
      <button
        type="button"
        onClick={onPick}
        className="w-full text-left flex items-center gap-3 px-4 py-4 rounded-2xl border border-dashed border-border hover:border-accent/50 hover:bg-accent/5 transition-colors tap-target focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        aria-label={`Slot ${index + 1} — choisir un prompt`}
      >
        <span
          className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold text-text-muted bg-bg-card border border-border"
          aria-hidden="true"
        >
          {index + 1}
        </span>
        <span className="text-[14px] text-text-muted font-medium">
          Choisir un prompt
        </span>
      </button>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="rounded-2xl border border-border bg-bg-card overflow-hidden"
    >
      <button
        type="button"
        onClick={onEdit}
        className="w-full text-left px-4 py-3 hover:bg-bg transition-colors tap-target focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
      >
        <div className="flex items-start gap-3">
          <span
            className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[15px] bg-bg border border-border"
            aria-hidden="true"
          >
            {question.emoji}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-text-muted uppercase tracking-wider mb-1">
              {question.question}
            </p>
            <p className="text-[14px] text-text italic leading-snug">
              {slot.answer}
            </p>
          </div>
        </div>
      </button>

      <div className="flex items-center justify-end gap-1 px-2 py-1.5 border-t border-border bg-bg">
        <SlotIconButton
          label="Monter"
          disabled={!canMoveUp}
          onClick={onMoveUp}
        >
          <ChevronUp size={16} strokeWidth={1.8} aria-hidden="true" />
        </SlotIconButton>
        <SlotIconButton
          label="Descendre"
          disabled={!canMoveDown}
          onClick={onMoveDown}
        >
          <ChevronDown size={16} strokeWidth={1.8} aria-hidden="true" />
        </SlotIconButton>
        <SlotIconButton label="Supprimer" onClick={onRemove}>
          <Trash2 size={15} strokeWidth={1.8} aria-hidden="true" />
        </SlotIconButton>
      </div>
    </motion.div>
  );
}

function SlotIconButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="w-9 h-9 rounded-full flex items-center justify-center text-text-muted hover:text-text hover:bg-bg-card transition-colors tap-target disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      {children}
    </button>
  );
}

// ── Pick view (browse the 50-question catalogue) ─────────────────────────────

interface PickViewProps {
  /** prompt_ids already used in other slots — kept selectable but flagged. */
  currentIds: Array<string | null>;
  onCancel: () => void;
  onPick: (promptId: string) => void;
}

const ALL_CATEGORIES = Object.keys(
  PROMPT_QUESTION_CATEGORIES,
) as PromptQuestionCategory[];

function PickView({ currentIds, onCancel, onPick }: PickViewProps) {
  const [filter, setFilter] = useState<PromptQuestionCategory | "all">("all");

  const filtered = useMemo(() => {
    if (filter === "all") return PROMPT_QUESTIONS;
    return PROMPT_QUESTIONS.filter((q) => q.category === filter);
  }, [filter]);

  return (
    <>
      <ModalHeader
        title="Choisir un prompt"
        subtitle="Pioche dans 50 questions"
        onClose={onCancel}
        leadingBack
      />

      <div className="px-5 pt-3 pb-2 border-b border-border bg-bg">
        <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1">
          <CategoryChip
            active={filter === "all"}
            onClick={() => setFilter("all")}
            label="Toutes"
            emoji="✨"
          />
          {ALL_CATEGORIES.map((cat) => {
            const meta = PROMPT_QUESTION_CATEGORIES[cat];
            return (
              <CategoryChip
                key={cat}
                active={filter === cat}
                onClick={() => setFilter(cat)}
                label={meta.label}
                emoji={meta.emoji}
              />
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
        {filtered.map((q) => {
          const alreadyUsed = currentIds.includes(q.id);
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => onPick(q.id)}
              className={`w-full text-left flex items-start gap-3 px-4 py-3 rounded-2xl border transition-colors tap-target focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                alreadyUsed
                  ? "border-accent/40 bg-accent/5"
                  : "border-border bg-bg-card hover:border-text/20 hover:bg-bg"
              }`}
            >
              <span
                className="shrink-0 text-[18px] leading-none mt-0.5"
                aria-hidden="true"
              >
                {q.emoji}
              </span>
              <span className="flex-1 text-[14px] text-text font-medium leading-snug">
                {q.question}
              </span>
              {alreadyUsed && (
                <span
                  className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-accent"
                  aria-label="Déjà utilisé"
                >
                  Utilisé
                </span>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}

function CategoryChip({
  active,
  onClick,
  label,
  emoji,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  emoji: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-colors tap-target focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
        active
          ? "bg-text text-bg border border-text"
          : "bg-bg-card text-text border border-border hover:border-text/30"
      }`}
    >
      <span aria-hidden="true">{emoji}</span>
      <span>{label}</span>
    </button>
  );
}

// ── Answer view ──────────────────────────────────────────────────────────────

interface AnswerViewProps {
  slotIndex: number;
  promptId: string;
  initialAnswer: string;
  onBack: () => void;
  onCommit: (answer: string) => void;
  onCancel: () => void;
}

function AnswerView({
  slotIndex,
  promptId,
  initialAnswer,
  onBack,
  onCommit,
  onCancel,
}: AnswerViewProps) {
  const question = getPromptQuestionById(promptId);
  const [value, setValue] = useState(initialAnswer);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Autofocus on mount — the user just navigated specifically to type.
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const trimmed = value.trim();
  const remaining = PROMPT_ANSWER_MAX_LENGTH - value.length;
  const valid = trimmed.length > 0 && value.length <= PROMPT_ANSWER_MAX_LENGTH;

  const submit = useCallback(() => {
    if (!valid) return;
    onCommit(trimmed);
  }, [onCommit, trimmed, valid]);

  if (!question) {
    // Defensive — prompt removed from catalogue between pick and render.
    return (
      <>
        <ModalHeader
          title="Prompt introuvable"
          onClose={onCancel}
          leadingBack
          onBack={onBack}
        />
        <div className="flex-1 flex items-center justify-center px-5 py-12 text-text-muted text-[13px]">
          Cette question n'est plus disponible. Reviens en arrière pour en
          choisir une autre.
        </div>
      </>
    );
  }

  return (
    <>
      <ModalHeader
        title={`Prompt ${slotIndex + 1}`}
        subtitle="Réponds en une phrase"
        onClose={onCancel}
        leadingBack
        onBack={onBack}
      />

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        <div className="flex items-center gap-2">
          <span
            className="text-[20px] leading-none"
            aria-hidden="true"
          >
            {question.emoji}
          </span>
          <span className="text-[10px] font-bold text-accent uppercase tracking-[0.18em]">
            {PROMPT_QUESTION_CATEGORIES[question.category].label}
          </span>
        </div>

        <p className="text-[20px] font-bold tracking-tight text-text leading-tight">
          {question.question}
        </p>

        <label className="block">
          <span className="sr-only">Ta réponse</span>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value.slice(0, PROMPT_ANSWER_MAX_LENGTH))}
            placeholder="Écris ta réponse… (sois honnête + spécifique)"
            rows={4}
            className="w-full px-4 py-3 rounded-2xl border border-border bg-bg-card text-[15px] text-text leading-relaxed focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors resize-none"
            maxLength={PROMPT_ANSWER_MAX_LENGTH}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
            aria-describedby={`prompt-counter-${slotIndex}`}
          />
        </label>

        <div className="flex items-center justify-between text-[12px]">
          <span className="text-text-muted">
            Tip : 1–2 phrases, un détail concret.
          </span>
          <span
            id={`prompt-counter-${slotIndex}`}
            className={`tabular-nums font-medium ${remaining < 20 ? "text-red-500" : "text-text-muted"}`}
            aria-live="polite"
          >
            {remaining} caractères
          </span>
        </div>
      </div>

      <div className="border-t border-border px-5 py-4 bg-bg flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-3 rounded-2xl border border-border text-[14px] font-medium text-text-muted hover:text-text hover:border-text/30 transition-colors tap-target"
        >
          Changer la question
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={!valid}
          className="flex-[1.4] py-3 rounded-2xl bg-text text-bg text-[14px] font-semibold tracking-tight hover:opacity-90 transition-all tap-target disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
        >
          <Check size={16} strokeWidth={2.2} aria-hidden="true" />
          Valider
        </button>
      </div>
    </>
  );
}

// ── Shared header ────────────────────────────────────────────────────────────

interface ModalHeaderProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  leadingBack?: boolean;
  onBack?: () => void;
}

function ModalHeader({
  title,
  subtitle,
  onClose,
  leadingBack,
  onBack,
}: ModalHeaderProps) {
  return (
    <div className="relative flex items-center justify-center px-5 py-4 border-b border-border bg-bg">
      {leadingBack && (
        <button
          type="button"
          onClick={onBack ?? onClose}
          aria-label="Retour"
          className="absolute left-3 w-10 h-10 rounded-full flex items-center justify-center text-text-muted hover:text-text hover:bg-bg-card transition-colors tap-target focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <ChevronLeft size={20} strokeWidth={1.8} aria-hidden="true" />
        </button>
      )}
      <div className="text-center">
        <p className="text-[15px] font-semibold tracking-tight text-text">
          {title}
        </p>
        {subtitle && (
          <p className="text-[11px] text-text-muted mt-0.5">{subtitle}</p>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer"
        className="absolute right-3 w-10 h-10 rounded-full flex items-center justify-center text-text-muted hover:text-text hover:bg-bg-card transition-colors tap-target focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <X size={18} strokeWidth={1.8} aria-hidden="true" />
      </button>
    </div>
  );
}
