"use client";

import { useState, useEffect, useCallback } from "react";
import { registerServiceWorker } from "./registerSW";

// ---------- Types ----------

type PermissionState = "default" | "granted" | "denied";

interface PushNotificationHook {
  /** Browser supports push notifications */
  isSupported: boolean;
  /** Current permission state */
  permission: PermissionState;
  /** Whether a push subscription is active */
  isSubscribed: boolean;
  /** Subscribe to push notifications (requests permission if needed) */
  subscribe: () => Promise<boolean>;
  /** Unsubscribe from push notifications */
  unsubscribe: () => Promise<void>;
  /** Loading state during subscribe/unsubscribe */
  isLoading: boolean;
}

// ---------- Helpers ----------

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function checkSupport(): boolean {
  if (typeof window === "undefined") return false;
  return (
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

async function sendSubscriptionToServer(
  subscription: PushSubscription,
): Promise<void> {
  // TODO: Replace with actual Supabase edge function endpoint
  const endpoint = process.env.NEXT_PUBLIC_PUSH_SUBSCRIPTION_URL;
  if (!endpoint) {
    console.warn(
      "[Push] NEXT_PUBLIC_PUSH_SUBSCRIPTION_URL non configuree. Abonnement stocke localement.",
    );
    return;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      subscription: subscription.toJSON(),
      timestamp: Date.now(),
    }),
  });

  if (!response.ok) {
    throw new Error(`Echec envoi abonnement : ${response.status}`);
  }
}

async function removeSubscriptionFromServer(
  subscription: PushSubscription,
): Promise<void> {
  const endpoint = process.env.NEXT_PUBLIC_PUSH_SUBSCRIPTION_URL;
  if (!endpoint) return;

  await fetch(endpoint, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint: subscription.endpoint,
    }),
  });
}

// ---------- Hook ----------

export function usePushNotifications(): PushNotificationHook {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<PermissionState>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check support and current state on mount
  useEffect(() => {
    const supported = checkSupport();
    setIsSupported(supported);

    if (!supported) return;

    setPermission(Notification.permission as PermissionState);

    // Check if already subscribed
    navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((sub) => {
        setIsSubscribed(sub !== null);
      })
      .catch(() => {
        // Silently fail — SW might not be registered yet
      });
  }, []);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!checkSupport()) return false;

    setIsLoading(true);

    try {
      // 1. Request notification permission
      const result = await Notification.requestPermission();
      setPermission(result as PermissionState);

      if (result !== "granted") {
        setIsLoading(false);
        return false;
      }

      // 2. Ensure service worker is registered
      let registration = await navigator.serviceWorker.getRegistration("/");
      if (!registration) {
        registration = await registerServiceWorker();
        if (!registration) {
          setIsLoading(false);
          return false;
        }
      }

      // Wait for SW to be ready
      registration = await navigator.serviceWorker.ready;

      // 3. Subscribe to push
      const applicationServerKey = VAPID_PUBLIC_KEY
        ? urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        : undefined;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        ...(applicationServerKey ? { applicationServerKey } : {}),
      });

      // 4. Send subscription to backend
      await sendSubscriptionToServer(subscription);

      setIsSubscribed(true);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("[Push] Erreur lors de l'abonnement :", error);
      setIsLoading(false);
      return false;
    }
  }, []);

  const unsubscribe = useCallback(async (): Promise<void> => {
    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription =
        await registration.pushManager.getSubscription();

      if (subscription) {
        await removeSubscriptionFromServer(subscription);
        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
    } catch (error) {
      console.error("[Push] Erreur lors du desabonnement :", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isSupported,
    permission,
    isSubscribed,
    subscribe,
    unsubscribe,
    isLoading,
  };
}
