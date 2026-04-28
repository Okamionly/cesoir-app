/**
 * useUserSettings — single source of truth for /profile + /settings persistence.
 *
 * Backs Migration 011 columns on `public.user_settings`:
 *   - tonight_chips: text[]            (activity chips on /profile)
 *   - notifications_prefs: jsonb       (per-toggle notification opt-ins)
 *   - privacy_prefs: jsonb             (profile_visible, location_blur, ...)
 *   - app_prefs: jsonb                 (dark_mode, reduced_motion, language, ...)
 *
 * Strategy:
 *   1. Fetch row on mount (lazy-create via upsert if missing).
 *   2. Expose typed updaters that merge partial JSON and upsert.
 *   3. Callers keep their own localStorage fallback for offline/fast-paint.
 *      This hook is only responsible for syncing with the server.
 *
 * Uses useSupabaseQuery for initial load (SSR-safe, race-free).
 */
"use client";

import { useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useSupabaseQuery } from "@/lib/hooks/useSupabaseQuery";
import { logger } from "@/lib/logger";

interface ReadReceiptRow {
  read_receipts_enabled: boolean | null;
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface NotificationPrefs {
  matches?: boolean;
  likes?: boolean;
  messages?: boolean;
  events?: boolean;
  feed?: boolean;
  challenges?: boolean;
  reminder17h?: boolean;
  newsletter?: boolean;
  plansFlash?: boolean;
  sons?: boolean;
  /**
   * Daily 19h45 (Europe/Paris) "Last Call" push showing the top 3
   * events near the user tonight. OPT-IN by default (false). Backed
   * by /api/push/last-call cron. See migration 032 for the rate-limit
   * log + nearby-events RPC.
   */
  lastCall?: boolean;
}

export type LocationBlur = "exact" | "block" | "km";

export interface PrivacyPrefs {
  profile_visible?: boolean;
  location_blur?: LocationBlur;
  women_first?: boolean;
  invisible?: boolean;
  blocked_users?: string[];
}

export type DarkModeValue = "auto" | "light" | "dark";
export type Language = "fr" | "en";
export type FontSize = "normal" | "large" | "xlarge";

export interface AppPrefs {
  dark_mode?: DarkModeValue;
  reduced_motion?: boolean | null;
  language?: Language;
  font_size?: FontSize;
  sounds?: boolean;
  women_first?: boolean;
}

export interface UserSettingsRow {
  id: string;
  user_id: string;
  tonight_chips: string[];
  notifications_prefs: NotificationPrefs;
  privacy_prefs: PrivacyPrefs;
  app_prefs: AppPrefs;
  smart_notifications: boolean | null;
  mode_alerts: boolean | null;
  match_alerts: boolean | null;
  chat_messages: boolean | null;
  personality_type: string | null;
  onboarding_completed: boolean | null;
  updated_at: string | null;
}

// Shape returned to consumers — always resolved, never null.
export interface UserSettings {
  tonightChips: string[];
  notifications: NotificationPrefs;
  privacy: PrivacyPrefs;
  app: AppPrefs;
  /**
   * Wave 17 — opt-in chat read receipts. Reciprocal: when false, the user
   * neither sends nor receives "Vu" indicators. Backed by
   * `profiles.read_receipts_enabled` (migration 038), NOT user_settings,
   * because the read-receipts RPC needs to do a JOIN against profiles
   * directly. False by default.
   */
  readReceiptsEnabled: boolean;
}

const EMPTY_SETTINGS: UserSettings = {
  tonightChips: [],
  notifications: {},
  privacy: {},
  app: {},
  readReceiptsEnabled: false,
};

// ── Hook ─────────────────────────────────────────────────────────────────────

export interface UseUserSettingsReturn {
  settings: UserSettings;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  updateTonightChips: (chips: string[]) => Promise<void>;
  updateNotifications: (partial: NotificationPrefs) => Promise<void>;
  updatePrivacy: (partial: PrivacyPrefs) => Promise<void>;
  updateAppPrefs: (partial: AppPrefs) => Promise<void>;
  /**
   * Wave 17 — toggle chat read receipts (writes profiles.read_receipts_enabled).
   * Reciprocal: server-side mark_messages_read RPC verifies BOTH parties
   * have it enabled before stamping read_at, so flipping this off both
   * stops outgoing receipts AND blocks incoming ones from showing as "Vu".
   */
  updateReadReceipts: (enabled: boolean) => Promise<void>;
}

export function useUserSettings(): UseUserSettingsReturn {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const { data, loading, error, refetch } = useSupabaseQuery<UserSettingsRow>(
    async (client) => {
      if (!userId) return { data: null, error: null };
      const result = await client
        .from("user_settings")
        .select(
          "id, user_id, tonight_chips, notifications_prefs, privacy_prefs, app_prefs, smart_notifications, mode_alerts, match_alerts, chat_messages, personality_type, onboarding_completed, updated_at",
        )
        .eq("user_id", userId)
        .maybeSingle();
      return result as { data: UserSettingsRow | null; error: typeof result.error };
    },
    [userId],
    { enabled: Boolean(userId) },
  );

  // `read_receipts_enabled` lives on `profiles` (migration 038) — it has to,
  // because the mark_messages_read RPC needs to JOIN profiles to enforce
  // reciprocal opt-in server-side. We fetch it separately here so the
  // /settings page can drive the toggle from the same hook.
  const {
    data: profileFlag,
    refetch: refetchProfileFlag,
  } = useSupabaseQuery<ReadReceiptRow>(
    async (client) => {
      if (!userId) return { data: null, error: null };
      const result = await client
        .from("profiles")
        .select("read_receipts_enabled")
        .eq("id", userId)
        .maybeSingle();
      return result as { data: ReadReceiptRow | null; error: typeof result.error };
    },
    [userId],
    { enabled: Boolean(userId) },
  );

  const settings: UserSettings = data
    ? {
        tonightChips: data.tonight_chips ?? [],
        notifications: data.notifications_prefs ?? {},
        privacy: data.privacy_prefs ?? {},
        app: data.app_prefs ?? {},
        readReceiptsEnabled: profileFlag?.read_receipts_enabled ?? false,
      }
    : { ...EMPTY_SETTINGS, readReceiptsEnabled: profileFlag?.read_receipts_enabled ?? false };

  // Upsert patch merges JSON buckets client-side then writes the whole column.
  // Relies on RLS (user_id = auth.uid()) + UNIQUE(user_id) constraint.
  const applyPatch = useCallback(
    async (patch: Partial<Pick<UserSettingsRow, "tonight_chips" | "notifications_prefs" | "privacy_prefs" | "app_prefs">>) => {
      if (!userId) return;
      const { error: upsertError } = await supabase
        .from("user_settings")
        .upsert(
          { user_id: userId, ...patch },
          { onConflict: "user_id" },
        );
      if (upsertError) {
        logger.error("use_user_settings_upsert_failed", { err: upsertError.message });
        throw new Error(upsertError.message);
      }
      await refetch();
    },
    [userId, refetch],
  );

  const updateTonightChips = useCallback(
    (chips: string[]) => applyPatch({ tonight_chips: chips }),
    [applyPatch],
  );

  const updateNotifications = useCallback(
    (partial: NotificationPrefs) => {
      const merged: NotificationPrefs = { ...settings.notifications, ...partial };
      return applyPatch({ notifications_prefs: merged });
    },
    [applyPatch, settings.notifications],
  );

  const updatePrivacy = useCallback(
    (partial: PrivacyPrefs) => {
      const merged: PrivacyPrefs = { ...settings.privacy, ...partial };
      return applyPatch({ privacy_prefs: merged });
    },
    [applyPatch, settings.privacy],
  );

  const updateAppPrefs = useCallback(
    (partial: AppPrefs) => {
      const merged: AppPrefs = { ...settings.app, ...partial };
      return applyPatch({ app_prefs: merged });
    },
    [applyPatch, settings.app],
  );

  const updateReadReceipts = useCallback(
    async (enabled: boolean) => {
      if (!userId) return;
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ read_receipts_enabled: enabled })
        .eq("id", userId);
      if (updateError) {
        logger.error("read_receipts_update_failed", { err: updateError.message });
        throw new Error(updateError.message);
      }
      await refetchProfileFlag();
    },
    [userId, refetchProfileFlag],
  );

  return {
    settings,
    loading,
    error: error as Error | null,
    refetch,
    updateTonightChips,
    updateNotifications,
    updatePrivacy,
    updateAppPrefs,
    updateReadReceipts,
  };
}
