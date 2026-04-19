"use client";

import {
  createContext,
  useContext,
  useCallback,
  useState,
  useRef,
  type ReactNode,
} from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "motion/react";
import { X } from "@/components/ui/lucide";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ToastType = "success" | "error" | "info" | "match";

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType, duration?: number) => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

// ---------------------------------------------------------------------------
// Colours per type
// ---------------------------------------------------------------------------

const TYPE_STYLES: Record<ToastType, { bg: string; border: string; bar: string }> = {
  success: {
    bg: "bg-safe/10",
    border: "border-safe/30",
    bar: "bg-safe",
  },
  error: {
    bg: "bg-danger/10",
    border: "border-danger/30",
    bar: "bg-danger",
  },
  info: {
    bg: "bg-accent/10",
    border: "border-accent/30",
    bar: "bg-accent",
  },
  match: {
    bg: "bg-gradient-to-r from-accent/10 to-accent-2/10",
    border: "border-accent/30",
    bar: "bg-gradient-to-r from-accent to-accent-2",
  },
};

// ---------------------------------------------------------------------------
// Single toast component
// ---------------------------------------------------------------------------

function ToastCard({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const style = TYPE_STYLES[item.type];
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-150, 0, 150], [0, 1, 0]);

  return (
    <motion.div
      layout
      initial={{ y: -60, opacity: 0, scale: 0.95 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: -40, opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.5}
      onDragEnd={(_, info) => {
        if (Math.abs(info.offset.x) > 100) onDismiss(item.id);
      }}
      style={{ x, opacity }}
      className={`relative w-full max-w-sm rounded-2xl border px-4 py-3 shadow-lg backdrop-blur-md ${style.bg} ${style.border}`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-text flex-1">{item.message}</p>
        <button
          onClick={() => onDismiss(item.id)}
          className="shrink-0 rounded-full p-1 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          aria-label="Fermer"
        >
          <X size={14} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-4 right-4 h-[2px] overflow-hidden rounded-full bg-black/5 dark:bg-white/5">
        <motion.div
          className={`h-full ${style.bar}`}
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{ duration: item.duration / 1000, ease: "linear" }}
          onAnimationComplete={() => onDismiss(item.id)}
        />
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

const MAX_VISIBLE = 3;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counterRef = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = "info", duration = 3000) => {
      counterRef.current += 1;
      const id = `toast-${counterRef.current}-${Date.now()}`;
      setToasts((prev) => [{ id, type, message, duration }, ...prev].slice(0, MAX_VISIBLE));
    },
    [],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      <div
        aria-live="polite"
        className="fixed top-4 left-1/2 z-[9999] flex w-full max-w-sm -translate-x-1/2 flex-col items-center gap-2 px-4"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <ToastCard key={t.id} item={t} onDismiss={dismiss} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
