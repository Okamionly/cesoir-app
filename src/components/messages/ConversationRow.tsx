"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { m, AnimatePresence, useReducedMotion } from "motion/react";
import { springs } from "@/lib/motion-design";
import { usePointerFine } from "@/lib/hooks/usePointerFine";
import { MODES } from "@/lib/modes";
import type { ModeKey } from "@/lib/modes";
import type { ConversationPreview } from "@/lib/useConversations";
import SparkTimer from "@/components/chat/SparkTimer";
import ExpiryTimer from "@/components/chat/ExpiryTimer";

// ---------- Helpers ----------

function getModeInfo(mode: string | null) {
  if (!mode || !(mode in MODES)) return null;
  return MODES[mode as ModeKey];
}

function getAvatarColor(mode: string | null): string {
  const info = getModeInfo(mode);
  return info?.color ?? "var(--color-accent)";
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) {
    return d.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) {
    return d.toLocaleDateString("fr-FR", { weekday: "short" });
  }
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

/** Naive heuristic: peer is typing if the preview is the sentinel
 * string "typing...". Real app would pipe a realtime flag here. */
function isTyping(msg: string | null): boolean {
  if (!msg) return false;
  return /^\s*typing\.\.\.\s*$/i.test(msg);
}

// ---------- Props ----------

interface ConversationRowProps {
  convo: ConversationPreview;
  index: number;
  /** True when any sibling row is hovered — for shrink-others effect */
  isAnyHovered: boolean;
  /** True when THIS row is hovered/focused */
  isHovered: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
  onPin?: (id: string) => void;
  /** Optional mock matched-at ISO for SparkTimer / ExpiryTimer */
  matchedAt?: string;
  isNewMatch?: boolean;
}

// ---------- Component ----------

export function ConversationRow({
  convo,
  index,
  isAnyHovered,
  isHovered,
  onHoverStart,
  onHoverEnd,
  onArchive,
  onDelete,
  onPin,
  matchedAt,
  isNewMatch = false,
}: ConversationRowProps) {
  const reducedMotion = useReducedMotion();
  const pointerFine = usePointerFine();
  const modeInfo = getModeInfo(convo.mode);
  const hasUnread = convo.unreadCount > 0;
  const avatarColor = getAvatarColor(convo.mode);
  const peerIsTyping = isTyping(convo.lastMessage);

  const [isFocused, setIsFocused] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [contextMenu, setContextMenu] = useState(false);
  const [kebabOpen, setKebabOpen] = useState(false);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartXRef = useRef(0);
  const kebabMenuRef = useRef<HTMLDivElement | null>(null);
  const kebabButtonRef = useRef<HTMLButtonElement | null>(null);
  const swipeThreshold = 80;

  // Close kebab menu on Escape, outside click, and refocus the trigger button
  useEffect(() => {
    if (!kebabOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setKebabOpen(false);
        kebabButtonRef.current?.focus();
      }
    };
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (
        target &&
        !kebabMenuRef.current?.contains(target) &&
        !kebabButtonRef.current?.contains(target)
      ) {
        setKebabOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [kebabOpen]);

  const handleDelete = useCallback(() => {
    if (!onDelete) return;
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        `Supprimer la conversation avec ${convo.peer.name} ? Cette action est irreversible.`,
      )
    ) {
      return;
    }
    onDelete(convo.id);
  }, [convo.id, convo.peer.name, onDelete]);

  const active = isHovered || isFocused;
  const applyFocusEffect = pointerFine && !reducedMotion;

  const scale = applyFocusEffect
    ? active
      ? 1.015
      : isAnyHovered
        ? 0.985
        : 1
    : 1;
  const opacity = applyFocusEffect && isAnyHovered && !active ? 0.55 : 1;

  // --- Touch handlers for swipe reveal / long-press context menu ---

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    longPressTimerRef.current = setTimeout(() => {
      setContextMenu(true);
    }, 600);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const deltaX = touchStartXRef.current - e.touches[0].clientX;
    if (Math.abs(deltaX) > 10 && longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (deltaX > swipeThreshold) {
      setShowActions(true);
    } else if (deltaX < -30) {
      setShowActions(false);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  return (
    <m.div
      className="relative overflow-hidden will-change-transform"
      role="listitem"
      onHoverStart={onHoverStart}
      onHoverEnd={onHoverEnd}
      initial={
        reducedMotion
          ? { opacity: 0 }
          : { opacity: 0, x: -24, filter: "blur(4px)" }
      }
      animate={
        reducedMotion
          ? { opacity: 1 }
          : {
              opacity,
              x: 0,
              filter: "blur(0px)",
              scale,
            }
      }
      transition={{ ...springs.heavy, delay: index * 0.05 }}
      whileTap={!pointerFine ? { scale: 0.98, transition: springs.micro } : undefined}
    >
      {/* Glow halo behind active row (desktop only) */}
      {active && applyFocusEffect && (
        <m.div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            background: `radial-gradient(ellipse at 10% 50%, ${avatarColor}18, transparent 60%)`,
          }}
        />
      )}

      {/* Swipe reveal actions (mobile) */}
      <AnimatePresence>
        {showActions && (
          <m.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            className="absolute right-0 top-0 bottom-0 flex items-stretch z-10"
          >
            {onPin && (
              <button
                onClick={() => {
                  onPin(convo.id);
                  setShowActions(false);
                }}
                className="flex items-center justify-center px-4 bg-accent text-white text-xs font-bold tap-target"
                aria-label="Epingler la conversation"
              >
                Epingler
              </button>
            )}
            <button
              onClick={() => {
                onArchive?.(convo.id);
                setShowActions(false);
              }}
              className="flex items-center justify-center px-4 bg-amber-500 text-white text-xs font-bold tap-target"
              aria-label="Archiver la conversation"
            >
              Archiver
            </button>
            <button
              onClick={() => {
                onDelete?.(convo.id);
                setShowActions(false);
              }}
              className="flex items-center justify-center px-4 bg-red-500 text-white text-xs font-bold tap-target"
              aria-label="Supprimer la conversation"
            >
              Supprimer
            </button>
          </m.div>
        )}
      </AnimatePresence>

      {/* Context menu on long-press / right-click */}
      <AnimatePresence>
        {contextMenu && (
          <>
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setContextMenu(false)}
            />
            <m.div
              initial={{ opacity: 0, scale: 0.9, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -4 }}
              transition={springs.micro}
              className="absolute right-4 top-2 z-50 bg-bg-card border border-border rounded-xl shadow-xl overflow-hidden min-w-[160px]"
            >
              {onPin && (
                <>
                  <button
                    onClick={() => {
                      onPin(convo.id);
                      setContextMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-text hover:bg-bg active:bg-border/50 transition-colors"
                  >
                    <span className="text-base" aria-hidden="true">
                      {"\u{1F4CC}"}
                    </span>
                    <span>Epingler</span>
                  </button>
                  <div className="h-px bg-border" />
                </>
              )}
              <button
                onClick={() => {
                  onArchive?.(convo.id);
                  setContextMenu(false);
                }}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-text hover:bg-bg active:bg-border/50 transition-colors"
              >
                <span className="text-base" aria-hidden="true">
                  {"\u{1F4E6}"}
                </span>
                <span>Archiver</span>
              </button>
              <div className="h-px bg-border" />
              <button
                onClick={() => {
                  onDelete?.(convo.id);
                  setContextMenu(false);
                }}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-500 hover:bg-bg active:bg-border/50 transition-colors"
              >
                <span className="text-base" aria-hidden="true">
                  {"\u{1F5D1}"}
                </span>
                <span>Supprimer</span>
              </button>
            </m.div>
          </>
        )}
      </AnimatePresence>

      {/* Keyboard-accessible kebab menu — always visible so keyboard users can
          reach archive/pin/delete (swipe gesture is touch-only). Sits outside
          the Link to avoid nested interactive elements. */}
      {(onArchive || onDelete || onPin) && (
        <div className="absolute top-1/2 -translate-y-1/2 right-2 z-30">
          <button
            ref={kebabButtonRef}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setKebabOpen((v) => !v);
            }}
            className="w-8 h-8 rounded-full bg-bg-card/80 border border-border flex items-center justify-center text-text-muted opacity-60 hover:opacity-100 focus-visible:opacity-100 hover:text-text focus-visible:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 transition-opacity"
            aria-label="Actions de conversation"
            aria-haspopup="menu"
            aria-expanded={kebabOpen}
          >
            <span className="text-lg leading-none" aria-hidden="true">
              {"⋮"}
            </span>
          </button>
          <AnimatePresence>
            {kebabOpen && (
              <m.div
                ref={kebabMenuRef}
                role="menu"
                aria-label="Actions de conversation"
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={springs.micro}
                className="absolute right-0 top-full mt-1 z-50 bg-bg-card border border-border rounded-xl shadow-xl overflow-hidden min-w-[160px]"
              >
                {onPin && (
                  <>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        onPin(convo.id);
                        setKebabOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-text hover:bg-bg active:bg-border/50 focus-visible:bg-bg focus-visible:outline-none transition-colors"
                      aria-label="Epingler la conversation"
                    >
                      <span className="text-base" aria-hidden="true">
                        {"\u{1F4CC}"}
                      </span>
                      <span>Epingler</span>
                    </button>
                    <div className="h-px bg-border" />
                  </>
                )}
                {onArchive && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      onArchive(convo.id);
                      setKebabOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-text hover:bg-bg active:bg-border/50 focus-visible:bg-bg focus-visible:outline-none transition-colors"
                    aria-label="Archiver la conversation"
                  >
                    <span className="text-base" aria-hidden="true">
                      {"\u{1F4E6}"}
                    </span>
                    <span>Archiver</span>
                  </button>
                )}
                {onDelete && (
                  <>
                    {onArchive && <div className="h-px bg-border" />}
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        handleDelete();
                        setKebabOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-danger hover:bg-bg active:bg-border/50 focus-visible:bg-bg focus-visible:outline-none transition-colors"
                      aria-label="Supprimer la conversation"
                    >
                      <span className="text-base" aria-hidden="true">
                        {"\u{1F5D1}"}
                      </span>
                      <span>Supprimer</span>
                    </button>
                  </>
                )}
              </m.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <Link
        href={`/chat/${convo.id}`}
        onFocus={() => {
          setIsFocused(true);
          onHoverStart();
        }}
        onBlur={() => {
          setIsFocused(false);
          onHoverEnd();
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onContextMenu={(e) => {
          e.preventDefault();
          setContextMenu(true);
        }}
        className={`relative flex items-center gap-3.5 px-4 py-3.5 cursor-pointer border-b border-border/50 transition-colors active:bg-bg-card outline-none z-0 ${
          isFocused ? "bg-bg-card ring-2 ring-accent/50 ring-inset" : ""
        } ${active ? "bg-bg-card/40" : ""}`}
      >
        {/* Avatar + online pulse ring */}
        <div className="relative shrink-0">
          {convo.peer.avatar_url ? (
            <Image
              src={convo.peer.avatar_url}
              alt={convo.peer.name}
              width={56}
              height={56}
              className="w-14 h-14 rounded-full object-cover"
              unoptimized
            />
          ) : (
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-white"
              style={{ background: avatarColor }}
            >
              {convo.peer.name[0]}
            </div>
          )}

          {/* Online pulse ring — green, gated on reduced-motion */}
          {convo.peer.is_online && (
            <>
              {!reducedMotion && (
                <m.span
                  aria-hidden
                  className="absolute -inset-0.5 rounded-full border-2 pointer-events-none"
                  style={{ borderColor: "var(--color-safe)"}}
                  animate={{ scale: [1, 1.15, 1], opacity: [0.8, 0, 0.8] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              )}
              <span
                className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-bg"
                style={{ background: "var(--color-safe)"}}
                aria-label="En ligne"
              />
            </>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5 gap-2">
            <span
              className={`truncate text-[15px] ${
                hasUnread ? "font-bold text-text" : "font-semibold text-text"
              }`}
            >
              {convo.peer.name}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              {isNewMatch && matchedAt && (
                <ExpiryTimer
                  matchedAt={matchedAt}
                  compact
                  conversationStarted={false}
                />
              )}
              {matchedAt && <SparkTimer matchedAt={matchedAt} compact />}
              <span
                className={`text-[11px] ${
                  hasUnread
                    ? "text-accent font-semibold"
                    : "text-text-muted"
                }`}
              >
                {formatTime(convo.lastMessageAt)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            {/* Last message preview with fade-out ellipsis */}
            <div className="flex-1 min-w-0 relative">
              <p
                className={`truncate text-[13px] ${
                  peerIsTyping
                    ? "text-accent italic"
                    : hasUnread
                      ? "text-text font-medium"
                      : "text-text-muted"
                }`}
              >
                {peerIsTyping ? (
                  <span className="inline-flex items-center gap-1.5">
                    ecrit...
                    {!reducedMotion &&
                      [0, 1, 2].map((i) => (
                        <m.span
                          key={i}
                          className="inline-block w-1 h-1 rounded-full bg-accent"
                          animate={{ y: [0, -3, 0] }}
                          transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            delay: i * 0.15,
                            ease: "easeInOut",
                          }}
                        />
                      ))}
                  </span>
                ) : (
                  (convo.lastMessage ?? "Aucun message")
                )}
              </p>
              {/* Right-side fade-out mask for ellipsis polish */}
              <span
                aria-hidden
                className="pointer-events-none absolute top-0 right-0 bottom-0 w-6"
                style={{
                  background:
                    "linear-gradient(to right, transparent, var(--color-bg))",
                }}
              />
            </div>

            {hasUnread && (
              <m.span
                className="shrink-0 px-2 h-5 min-w-[1.25rem] gradient-bg rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                key={convo.unreadCount /* re-animates on change */}
                initial={{ scale: 0 }}
                animate={
                  reducedMotion
                    ? { scale: 1 }
                    : {
                        scale: [0, 1.15, 0.95, 1.05, 1],
                      }
                }
                transition={
                  reducedMotion
                    ? { duration: 0.2 }
                    : {
                        duration: 0.55,
                        times: [0, 0.35, 0.55, 0.75, 1],
                      }
                }
                aria-label={`${convo.unreadCount} non lu${convo.unreadCount > 1 ? "s" : ""}`}
              >
                {convo.unreadCount}
              </m.span>
            )}
          </div>

          {modeInfo && (
            <span className="text-[10px] text-text-muted mt-0.5 block">
              {modeInfo.icon} {modeInfo.name}
            </span>
          )}
        </div>

        {/* Desktop hover quick-actions (right edge) */}
        {active && applyFocusEffect && (onArchive || onDelete || onPin) && (
          <m.div
            initial={{ opacity: 0, x: 6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 6 }}
            transition={springs.micro}
            className="hidden sm:flex items-center gap-1 shrink-0"
          >
            {onPin && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onPin(convo.id);
                }}
                className="w-8 h-8 rounded-full bg-bg border border-border flex items-center justify-center text-text-muted hover:text-accent hover:border-accent/40 transition-colors"
                aria-label="Epingler"
                title="Epingler"
              >
                <span className="text-xs" aria-hidden="true">
                  {"\u{1F4CC}"}
                </span>
              </button>
            )}
            {onArchive && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onArchive(convo.id);
                }}
                className="w-8 h-8 rounded-full bg-bg border border-border flex items-center justify-center text-text-muted hover:text-amber-500 hover:border-amber-500/40 transition-colors"
                aria-label="Archiver"
                title="Archiver"
              >
                <span className="text-xs" aria-hidden="true">
                  {"\u{1F4E6}"}
                </span>
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onDelete(convo.id);
                }}
                className="w-8 h-8 rounded-full bg-bg border border-border flex items-center justify-center text-text-muted hover:text-red-500 hover:border-red-500/40 transition-colors"
                aria-label="Supprimer"
                title="Supprimer"
              >
                <span className="text-xs" aria-hidden="true">
                  {"\u{1F5D1}"}
                </span>
              </button>
            )}
          </m.div>
        )}
      </Link>
    </m.div>
  );
}

export default ConversationRow;
