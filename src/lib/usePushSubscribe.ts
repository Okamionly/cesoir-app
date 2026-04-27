"use client";

/**
 * usePushSubscribe — Wave 16 Bet #4 client-side hook.
 *
 * Thin React hook around the Notification + Push APIs that:
 *   1. Asks for OS permission (`Notification.requestPermission()`)
 *   2. Subscribes the active service worker to push via VAPID
 *   3. POSTs the subscription to /api/push/subscribe with the user's
 *      Bearer token so the row can be inserted under their auth.uid()
 *   4. Mirrors the unsubscribe flow on opt-out
 *
 * Required env vars:
 *   - NEXT_PUBLIC_VAPID_PUBLIC_KEY  (browser-readable VAPID public key)
 *
 * The corresponding server-side env vars are documented in
 * src/lib/push/sendPush.ts. Both halves must be set for push to work.
 *
 * Returns:
 *   { permission, isSubscribed, error,
 *     requestPermissionAndSubscribe(), unsubscribe(),
 *     isSupported, isLoading }
 *
 * Note: this hook does NOT replace usePushNotifications.ts (which is
 * still wired to the existing settings page). It exposes the spec's
 * exact API surface for new callers introduced by Wave 16 Bet #4 —
 * the soft prompt and the master-toggle UI.
 */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase";
import { registerServiceWorker } from "./registerSW";
import { logger } from "./logger";

// ---------- Types ----------

export type PushPermissionState = "default" | "granted" | "denied";

export interface UsePushSubscribeResult {
  /** True when the browser supports the Notification + Push APIs. */
  isSupported: boolean;
  /** Latest read of `Notification.permission`. */
  permission: PushPermissionState;
  /** Whether a `PushSubscription` is currently active for this device. */
  isSubscribed: boolean;
  /** Last operation error (subscribe/unsubscribe). Null when healthy. */
  error: string | null;
  /** True while a subscribe/unsubscribe round-trip is in flight. */
  isLoading: boolean;
  /**
   * Request OS permission (if needed) and register a push subscription.
   * Returns true on success, false if the user denied or anything else
   * went wrong. The `error` field is set on failure.
   */
  requestPermissionAndSubscribe: () => Promise<boolean>;
  /** Tear down the local subscription and DELETE it on the server. */
  unsubscribe: () => Promise<void>;
}

// ---------- Helpers ----------

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const out = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) out[i] = rawData.charCodeAt(i);
  return out;
}

function checkSupport(): boolean {
  if (typeof window === "undefined") return false;
  return (
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

async function postSubscriptionToServer(sub: PushSubscription): Promise<void> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error("not_authenticated");
  }
  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      subscription: sub.toJSON(),
      timestamp: Date.now(),
    }),
  });
  if (!res.ok) {
    throw new Error(`subscribe_http_${res.status}`);
  }
}

async function deleteSubscriptionOnServer(sub: PushSubscription): Promise<void> {
  const token = await getAccessToken();
  if (!token) {
    // No session — nothing to delete server-side; keep going so the
    // local pushManager still tears down the subscription.
    return;
  }
  await fetch("/api/push/subscribe", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ endpoint: sub.endpoint }),
  });
}

// ---------- Hook ----------

export function usePushSubscribe(): UsePushSubscribeResult {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<PushPermissionState>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initial state on mount
  useEffect(() => {
    const supported = checkSupport();
    setIsSupported(supported);
    if (!supported) return;

    setPermission(Notification.permission as PushPermissionState);

    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setIsSubscribed(sub !== null))
      .catch(() => {
        // SW not registered yet — leave isSubscribed=false; the next
        // requestPermissionAndSubscribe will register it.
      });
  }, []);

  const requestPermissionAndSubscribe = useCallback(async (): Promise<boolean> => {
    if (!checkSupport()) {
      setError("not_supported");
      return false;
    }

    setError(null);
    setIsLoading(true);

    try {
      // 1. OS permission prompt
      const result = (await Notification.requestPermission()) as PushPermissionState;
      setPermission(result);
      if (result !== "granted") {
        setError(result === "denied" ? "permission_denied" : "permission_dismissed");
        return false;
      }

      // 2. Make sure the service worker is registered
      const existing = await navigator.serviceWorker.getRegistration("/");
      if (!existing) {
        const fresh = await registerServiceWorker();
        if (!fresh) {
          setError("sw_registration_failed");
          return false;
        }
      }
      const reg = await navigator.serviceWorker.ready;

      // 3. Subscribe (idempotent — returns existing sub if any)
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        const opts: PushSubscriptionOptionsInit = { userVisibleOnly: true };
        if (VAPID_PUBLIC_KEY) {
          opts.applicationServerKey =
            urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer;
        } else {
          // Without a VAPID key the push won't be deliverable, but the
          // browser will still mint a subscription. Log a warning so
          // misconfiguration is visible in dev.
          logger.warn("push_subscribe_missing_vapid_public_key");
        }
        sub = await reg.pushManager.subscribe(opts);
      }

      // 4. Persist on the server (Bearer-authed)
      await postSubscriptionToServer(sub);

      setIsSubscribed(true);
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error("push_subscribe_failed", { err: msg });
      setError(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const unsubscribe = useCallback(async (): Promise<void> => {
    setError(null);
    setIsLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await deleteSubscriptionOnServer(sub);
        await sub.unsubscribe();
      }
      setIsSubscribed(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error("push_unsubscribe_failed", { err: msg });
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isSupported,
    permission,
    isSubscribed,
    error,
    isLoading,
    requestPermissionAndSubscribe,
    unsubscribe,
  };
}
