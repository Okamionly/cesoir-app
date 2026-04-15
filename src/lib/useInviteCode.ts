import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

// ─── Types ───────────────────────────────

type InviteType = "squad" | "friend";

interface UseInviteCodeReturn {
  /** The currently generated invite code (null until generated) */
  code: string | null;
  /** Whether an async operation is in progress */
  loading: boolean;
  /** Last error message, if any */
  error: string | null;
  /** Generate a random 6-char alphanumeric invite code */
  generateInviteCode: () => string;
  /** Save the invite code to the squad_invites table in Supabase */
  saveInviteCode: (code: string, type: InviteType, squadId?: string) => Promise<boolean>;
  /** Get the full shareable invite URL for a given code */
  getInviteUrl: (code: string) => string;
  /** Share the invite link using native share API (mobile) or copy to clipboard */
  shareInvite: (code: string) => Promise<"shared" | "copied" | "failed">;
}

// ─── Constants ───────────────────────────

const ALPHANUMERIC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const CODE_LENGTH = 6;
const BASE_URL = "https://cesoir-app.vercel.app";

// ─── Hook ────────────────────────────────

export function useInviteCode(): UseInviteCodeReturn {
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Generate a random 6-character alphanumeric code.
   * Uses crypto.getRandomValues for better randomness when available.
   */
  const generateInviteCode = useCallback((): string => {
    let result = "";
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      const values = new Uint32Array(CODE_LENGTH);
      crypto.getRandomValues(values);
      for (let i = 0; i < CODE_LENGTH; i++) {
        result += ALPHANUMERIC[values[i] % ALPHANUMERIC.length];
      }
    } else {
      for (let i = 0; i < CODE_LENGTH; i++) {
        result += ALPHANUMERIC[Math.floor(Math.random() * ALPHANUMERIC.length)];
      }
    }
    setCode(result);
    return result;
  }, []);

  /**
   * Save the invite code to Supabase `squad_invites` table.
   * Returns true on success, false on failure.
   */
  const saveInviteCode = useCallback(
    async (inviteCode: string, type: InviteType, squadId?: string): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        // Get current authenticated user
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setError("Non authentifie");
          setLoading(false);
          return false;
        }

        const { error: insertError } = await supabase.from("squad_invites").insert({
          squad_id: squadId ?? user.id, // fallback to user id for friend invites
          inviter_id: user.id,
          code: inviteCode.toUpperCase(),
        });

        if (insertError) {
          // Handle duplicate code
          if (insertError.code === "23505") {
            setError("Ce code existe deja, regenere un nouveau code");
          } else {
            setError(insertError.message);
          }
          setLoading(false);
          return false;
        }

        setLoading(false);
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur inconnue";
        setError(message);
        setLoading(false);
        return false;
      }
    },
    [],
  );

  /**
   * Get the full shareable URL for an invite code.
   */
  const getInviteUrl = useCallback((inviteCode: string): string => {
    return `${BASE_URL}/invite/${inviteCode.toUpperCase()}`;
  }, []);

  /**
   * Share the invite link via native share API on mobile,
   * with clipboard copy as fallback for desktop.
   */
  const shareInvite = useCallback(
    async (inviteCode: string): Promise<"shared" | "copied" | "failed"> => {
      const url = getInviteUrl(inviteCode);
      const shareData: ShareData = {
        title: "Rejoins-moi sur CeSoir",
        text: `Rejoins-moi sur CeSoir ce soir ! Utilise mon code ${inviteCode.toUpperCase()} ou clique ici :`,
        url,
      };

      // Try native share API first (mobile browsers)
      if (typeof navigator !== "undefined" && navigator.share) {
        try {
          await navigator.share(shareData);
          return "shared";
        } catch (err) {
          // User cancelled or share failed -- fall through to clipboard
          if (err instanceof Error && err.name === "AbortError") {
            return "failed";
          }
        }
      }

      // Fallback: copy to clipboard
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(url);
          return "copied";
        } catch {
          // Clipboard API might be blocked
        }
      }

      // Last resort: execCommand fallback
      try {
        const textarea = document.createElement("textarea");
        textarea.value = url;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        return "copied";
      } catch {
        return "failed";
      }
    },
    [getInviteUrl],
  );

  return {
    code,
    loading,
    error,
    generateInviteCode,
    saveInviteCode,
    getInviteUrl,
    shareInvite,
  };
}
