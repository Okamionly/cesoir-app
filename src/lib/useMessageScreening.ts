/**
 * CeSoir useMessageScreening (V5 Wave 15)
 *
 * Two-layer defence for chat messages:
 *   1. Client-side keyword screening (messageScreening.ts) — fast, offline-safe
 *   2. Server-side OpenAI Moderation (/api/moderate-message) — semantic check
 *
 * If OPENAI_API_KEY isn't configured, the server route returns fallbackUsed:true
 * and only layer 1 applies. The hook is always safe to call.
 */

"use client";

import { useCallback, useState } from "react";
import { screenMessage } from "@/lib/messageScreening";
import { logger } from "@/lib/logger";

export interface ScreenDecision {
  allowed: boolean;
  source: "keyword" | "openai" | "both" | "clean";
  severity: "clean" | "warning" | "block";
  message: string | null;
  /** Flagged categories from OpenAI (if any) */
  categories: string[];
}

async function callOpenAIModeration(text: string): Promise<{
  flagged: boolean;
  categories: string[];
  fallbackUsed: boolean;
}> {
  try {
    const res = await fetch("/api/moderate-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      return { flagged: false, categories: [], fallbackUsed: true };
    }
    const data = (await res.json()) as {
      flagged: boolean;
      categories: string[];
      fallbackUsed?: boolean;
    };
    return {
      flagged: data.flagged,
      categories: data.categories ?? [],
      fallbackUsed: data.fallbackUsed ?? false,
    };
  } catch (err) {
    logger.warn("openai_mod_client_exception", { err: String(err) });
    return { flagged: false, categories: [], fallbackUsed: true };
  }
}

export function useMessageScreening() {
  const [isChecking, setIsChecking] = useState(false);

  const screen = useCallback(async (text: string): Promise<ScreenDecision> => {
    if (!text.trim()) {
      return { allowed: true, source: "clean", severity: "clean", message: null, categories: [] };
    }

    setIsChecking(true);
    try {
      // Layer 1 — keyword screen (instant)
      const kw = screenMessage(text);
      if (kw.severity === "block") {
        return {
          allowed: false,
          source: "keyword",
          severity: "block",
          message: kw.warningMessage ?? "Message bloque par notre systeme de protection.",
          categories: kw.category ? [kw.category] : [],
        };
      }

      // Layer 2 — OpenAI semantic check (async)
      const ai = await callOpenAIModeration(text);
      if (ai.flagged) {
        // Distinguish severe (sexual/minors/violence) from warning
        const severeCats = ai.categories.filter((c) =>
          /sexual\/minors|violence\/graphic|self-harm|harassment\/threatening/.test(c),
        );
        const severity = severeCats.length > 0 ? "block" : "warning";
        return {
          allowed: severity !== "block",
          source: kw.severity === "warning" ? "both" : "openai",
          severity,
          message:
            severity === "block"
              ? "Message bloque : contenu grave detecte."
              : "Attention : ce message pourrait violer nos regles communautaires.",
          categories: ai.categories,
        };
      }

      if (kw.severity === "warning") {
        return {
          allowed: true,
          source: "keyword",
          severity: "warning",
          message: kw.warningMessage,
          categories: kw.category ? [kw.category] : [],
        };
      }

      return {
        allowed: true,
        source: "clean",
        severity: "clean",
        message: null,
        categories: [],
      };
    } finally {
      setIsChecking(false);
    }
  }, []);

  return { screen, isChecking };
}
