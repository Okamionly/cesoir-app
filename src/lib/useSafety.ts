"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useAsyncResource } from "@/lib/hooks/useAsyncResource";
import { logger } from "@/lib/logger";
import type { ReportReason } from "@/lib/supabase-types";

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------

export interface SafetyAction {
  id: string;
  type: "sos" | "checkin" | "report" | "alert_sent";
  description: string;
  timestamp: string;
}

export interface TrustedContact {
  id: string;
  name: string;
  phone: string;
  share_location: boolean;
  alert_no_checkin: boolean;
  share_route: boolean;
}

export interface UseSafetyResult {
  /** Trigger the SOS: logs event, fetches contacts from Supabase, notifies them with current location */
  triggerSOS: () => Promise<void>;
  /** Start a periodic check-in timer. If user doesn't check in within intervalMinutes, contacts are alerted */
  startCheckIn: (intervalMinutes?: number) => void;
  /** User confirms they are safe -- resets the timer */
  checkIn: () => void;
  /** Cancel the check-in timer entirely */
  cancelCheckIn: () => void;
  /** Report a user for violating community guidelines */
  reportUser: (userId: string, reason: ReportReason, details?: string) => Promise<void>;
  /** Whether a check-in timer is currently running */
  isCheckInActive: boolean;
  /** Seconds left until the next check-in prompt */
  checkInTimeLeft: number;
  /** Whether the SOS has been triggered and is in-flight */
  sosActive: boolean;
  /** Recent safety actions log */
  recentActions: SafetyAction[];
  /** Trusted contacts loaded from Supabase */
  trustedContacts: TrustedContact[];
  /** Reload trusted contacts */
  refreshContacts: () => Promise<void>;
}

// ------------------------------------------------------------------
// Constants
// ------------------------------------------------------------------

const DEFAULT_CHECKIN_MINUTES = 30;
const ACTIONS_STORAGE_KEY = "cesoir_safety_actions";
const MAX_ACTIONS = 20;

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

function loadActions(): SafetyAction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ACTIONS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SafetyAction[]) : [];
  } catch {
    return [];
  }
}

function persistActions(actions: SafetyAction[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ACTIONS_STORAGE_KEY, JSON.stringify(actions.slice(0, MAX_ACTIONS)));
  } catch {
    // storage full -- ignore
  }
}

function addAction(
  setter: React.Dispatch<React.SetStateAction<SafetyAction[]>>,
  type: SafetyAction["type"],
  description: string,
): void {
  const action: SafetyAction = {
    id: `sa-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    description,
    timestamp: new Date().toISOString(),
  };
  setter((prev) => {
    const next = [action, ...prev].slice(0, MAX_ACTIONS);
    persistActions(next);
    return next;
  });
}

/** Get current GPS position as a promise */
function getCurrentPosition(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  });
}

// ------------------------------------------------------------------
// Hook
// ------------------------------------------------------------------

export function useSafety(): UseSafetyResult {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  // ---- State ----
  const [sosActive, setSosActive] = useState(false);
  const [isCheckInActive, setIsCheckInActive] = useState(false);
  const [checkInTimeLeft, setCheckInTimeLeft] = useState(0);
  const [recentActions, setRecentActions] = useState<SafetyAction[]>([]);

  // ---- Refs for timers ----
  const checkInIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const checkInDeadlineRef = useRef<number>(0);
  const checkInMinutesRef = useRef<number>(DEFAULT_CHECKIN_MINUTES);

  // ---- Load persisted actions on mount ----
  useEffect(() => {
    setRecentActions(loadActions());
  }, []);

  // ---- Fetch trusted contacts from Supabase (unified hook) ----
  const {
    data: trustedContactsData,
    refetch: refetchContacts,
  } = useAsyncResource<TrustedContact[]>(
    async (signal) => {
      if (!userId) return [];
      try {
        const { data, error } = await supabase
          .from("trusted_contacts")
          .select("*")
          .eq("user_id", userId)
          .abortSignal(signal);
        if (!error && data) return data as TrustedContact[];
        return [];
      } catch {
        return [];
      }
    },
    [userId],
  );
  const trustedContacts = trustedContactsData ?? [];

  const refreshContacts = useCallback(async () => {
    await refetchContacts();
  }, [refetchContacts]);

  // ---- Cleanup timers on unmount ----
  useEffect(() => {
    return () => {
      if (checkInIntervalRef.current) clearInterval(checkInIntervalRef.current);
    };
  }, []);

  // ------------------------------------------------------------------
  // triggerSOS
  // ------------------------------------------------------------------
  const triggerSOS = useCallback(async () => {
    if (!userId) return;
    setSosActive(true);

    const position = await getCurrentPosition();
    const lat = position?.lat ?? 0;
    const lng = position?.lng ?? 0;
    const timestamp = new Date().toISOString();

    // 1. Log SOS event in database
    try {
      await supabase.from("sos_events").insert({
        user_id: userId,
        latitude: lat,
        longitude: lng,
        contacts_notified: trustedContacts.length,
        status: "triggered",
        created_at: timestamp,
      });
    } catch (err) {
      logger.error("use_safety_sos_log_failed", { err: String(err) });
    }

    // 2. Notify each trusted contact via edge functions
    const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
    const message = [
      "ALERTE SOS CeSoir",
      "Un(e) ami(e) a declenche une alerte de securite.",
      `Position: ${mapsUrl}`,
      `Heure: ${new Date(timestamp).toLocaleTimeString("fr-FR")}`,
      "Contactez-le/la immediatement.",
    ].join("\n");

    for (const contact of trustedContacts) {
      // SMS
      if (contact.phone) {
        try {
          await supabase.functions.invoke("send-sms", {
            body: { to: contact.phone, message },
          });
        } catch {
          logger.warn("use_safety_sms_failed", { contact: contact.name });
        }
      }
    }

    // 3. Log action locally
    addAction(
      setRecentActions,
      "sos",
      `SOS declenche - ${trustedContacts.length} contact(s) alerte(s)`,
    );

    setSosActive(false);
  }, [userId, trustedContacts]);

  // ------------------------------------------------------------------
  // startCheckIn
  // ------------------------------------------------------------------
  const startCheckIn = useCallback(
    (intervalMinutes: number = DEFAULT_CHECKIN_MINUTES) => {
      // Clear any existing timer
      if (checkInIntervalRef.current) clearInterval(checkInIntervalRef.current);

      checkInMinutesRef.current = intervalMinutes;
      const durationMs = intervalMinutes * 60 * 1000;
      checkInDeadlineRef.current = Date.now() + durationMs;
      setIsCheckInActive(true);
      setCheckInTimeLeft(intervalMinutes * 60);

      // Insert a checkin record in Supabase
      if (userId) {
        void Promise.resolve(
          supabase
            .from("checkins")
            .insert({
              user_id: userId,
              status: "active" as const,
              started_at: new Date().toISOString(),
              last_checkin_at: new Date().toISOString(),
            }),
        ).catch((err) => {
          logger.error("use_safety_checkin_create_failed", { err: String(err) });
        });
      }

      // Tick every second
      checkInIntervalRef.current = setInterval(() => {
        const left = Math.max(0, Math.floor((checkInDeadlineRef.current - Date.now()) / 1000));
        setCheckInTimeLeft(left);

        if (left <= 0) {
          // Time's up! Auto-alert contacts
          if (checkInIntervalRef.current) clearInterval(checkInIntervalRef.current);
          checkInIntervalRef.current = null;

          addAction(
            setRecentActions,
            "alert_sent",
            "Check-in manque - alerte envoyee aux contacts",
          );

          // Notify contacts that user didn't check in
          if (userId) {
            void Promise.resolve(
              supabase
                .from("checkins")
                .update({ status: "alert" as const })
                .eq("user_id", userId)
                .eq("status", "active"),
            ).catch((err) => {
              logger.error("use_safety_checkin_alert_failed", { err: String(err) });
            });

            // Trigger SOS-like notification for missed check-in
            getCurrentPosition().then((pos) => {
              const lat = pos?.lat ?? 0;
              const lng = pos?.lng ?? 0;
              const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

              for (const contact of trustedContacts) {
                if (contact.alert_no_checkin && contact.phone) {
                  void Promise.resolve(
                    supabase.functions.invoke("send-sms", {
                      body: {
                        to: contact.phone,
                        message: [
                          "ALERTE CeSoir - Check-in manque",
                          "Votre ami(e) n'a pas confirme sa securite.",
                          `Derniere position connue: ${mapsUrl}`,
                          "Verifiez qu'il/elle va bien.",
                        ].join("\n"),
                      },
                    }),
                  ).catch((err) => {
                    logger.error("use_safety_checkin_alert_sms_failed", {
                      contact: contact.name,
                      err: String(err),
                    });
                  });
                }
              }
            });
          }
        }
      }, 1000);

      addAction(
        setRecentActions,
        "checkin",
        `Check-in demarre (${intervalMinutes} min)`,
      );
    },
    [userId, trustedContacts],
  );

  // ------------------------------------------------------------------
  // checkIn (user confirms they are safe)
  // ------------------------------------------------------------------
  const checkIn = useCallback(() => {
    if (!isCheckInActive) return;

    // Reset timer with same interval
    const durationMs = checkInMinutesRef.current * 60 * 1000;
    checkInDeadlineRef.current = Date.now() + durationMs;
    setCheckInTimeLeft(checkInMinutesRef.current * 60);

    // Update Supabase record
    if (userId) {
      void Promise.resolve(
        supabase
          .from("checkins")
          .update({
            status: "safe" as const,
            last_checkin_at: new Date().toISOString(),
          })
          .eq("user_id", userId)
          .eq("status", "active"),
      ).catch((err) => {
        logger.error("use_safety_checkin_safe_failed", { err: String(err) });
      });
    }

    addAction(setRecentActions, "checkin", "Check-in confirme - tout va bien");

    // Restart a fresh timer
    startCheckIn(checkInMinutesRef.current);
  }, [isCheckInActive, userId, startCheckIn]);

  // ------------------------------------------------------------------
  // cancelCheckIn
  // ------------------------------------------------------------------
  const cancelCheckIn = useCallback(() => {
    if (checkInIntervalRef.current) {
      clearInterval(checkInIntervalRef.current);
      checkInIntervalRef.current = null;
    }
    setIsCheckInActive(false);
    setCheckInTimeLeft(0);

    // Mark DB record as safe
    if (userId) {
      void Promise.resolve(
        supabase
          .from("checkins")
          .update({ status: "safe" as const })
          .eq("user_id", userId)
          .eq("status", "active"),
      ).catch((err) => {
        logger.error("use_safety_checkin_cancel_failed", { err: String(err) });
      });
    }

    addAction(setRecentActions, "checkin", "Check-in desactive");
  }, [userId]);

  // ------------------------------------------------------------------
  // reportUser
  // ------------------------------------------------------------------
  const reportUser = useCallback(
    async (reportedUserId: string, reason: ReportReason, details: string = "") => {
      if (!userId) return;

      try {
        await supabase.from("reports").insert({
          reporter_id: userId,
          reported_id: reportedUserId,
          reason,
          details,
          status: "pending" as const,
          created_at: new Date().toISOString(),
        });
      } catch (err) {
        logger.error("use_safety_report_insert_failed", { err: String(err) });
      }

      addAction(
        setRecentActions,
        "report",
        `Profil signale: ${reason}`,
      );
    },
    [userId],
  );

  // ------------------------------------------------------------------
  // Return
  // ------------------------------------------------------------------
  return {
    triggerSOS,
    startCheckIn,
    checkIn,
    cancelCheckIn,
    reportUser,
    isCheckInActive,
    checkInTimeLeft,
    sosActive,
    recentActions,
    trustedContacts,
    refreshContacts,
  };
}
