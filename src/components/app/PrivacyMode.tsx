"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

const STORAGE_KEY = "cesoir_privacy_mode";

function loadPrivacyMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function savePrivacyMode(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, enabled ? "true" : "false");
}

interface PrivacyModeProps {
  /** Callback when mode changes (to sync with DB / set is_online = false) */
  onChange?: (invisible: boolean) => void;
}

export default function PrivacyMode({ onChange }: PrivacyModeProps) {
  const [invisible, setInvisible] = useState(false);

  useEffect(() => {
    setInvisible(loadPrivacyMode());
  }, []);

  const toggle = useCallback(() => {
    const next = !invisible;
    setInvisible(next);
    savePrivacyMode(next);
    onChange?.(next);
  }, [invisible, onChange]);

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 bg-white/5 rounded-2xl border border-white/8">
      <div className="flex items-center gap-3">
        {/* Eye icon */}
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
            invisible ? "bg-[#8B5CF6]/20" : "bg-white/5"
          }`}
        >
          {invisible ? (
            // Eye closed
            <svg
              width={18}
              height={18}
              viewBox="0 0 24 24"
              fill="none"
              stroke="#8B5CF6"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          ) : (
            // Eye open
            <svg
              width={18}
              height={18}
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(255,255,255,0.5)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </div>

        <div>
          <p className="text-[14px] text-white font-semibold">Mode invisible</p>
          <p className="text-[11px] text-white/40">
            {invisible
              ? "Personne ne te voit"
              : "Tu es visible par tous"}
          </p>
        </div>
      </div>

      {/* Toggle switch */}
      <button
        role="switch"
        aria-checked={invisible}
        aria-label="Mode invisible"
        onClick={toggle}
        className={`relative w-12 h-7 rounded-full transition-colors ${
          invisible ? "bg-[#8B5CF6]" : "bg-white/10"
        }`}
      >
        <motion.div
          className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md"
          animate={{ left: invisible ? 22 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  );
}
