"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { wipeServiceWorkerCaches } from "@/lib/registerSW";
import { logger } from "@/lib/logger";
import type { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string, metadata: { name: string; age: number; gender: string; looking_for: string }) => Promise<User | null>;
  signIn: (email: string, password: string) => Promise<User | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

let _currentUserId: string | null = null;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      _currentUserId = session?.user?.id ?? null;
      // Inject access token into Realtime so WebSocket auth matches the
      // current session. With @supabase/ssr the session is cookie-backed,
      // so Realtime does not auto-refresh its token like the default client
      // does; without this call the WS connection opens with the anon key
      // and Supabase rejects `postgres_changes` subscriptions.
      supabase.realtime.setAuth(session?.access_token ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      _currentUserId = session?.user?.id ?? null;
      // Keep Realtime auth in sync on sign-in / sign-out / token refresh.
      supabase.realtime.setAuth(session?.access_token ?? null);
      setLoading(false);
    });

    // Refresh token every 50 minutes
    const refreshInterval = setInterval(async () => {
      const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        // Token refresh failed — force re-login
        logger.error("auth_session_refresh_failed", { err: refreshError.message });
        await supabase.auth.signOut();
        setUser(null);
        _currentUserId = null;
        window.location.href = "/login";
      } else {
        // Push the rotated token into the Realtime client so active
        // WebSocket channels re-authenticate instead of spamming
        // "HTTP Authentication failed".
        supabase.realtime.setAuth(refreshed.session?.access_token ?? null);
      }
    }, 50 * 60 * 1000); // 50 minutes

    // Mark offline when user closes tab
    const handleUnload = () => {
      const uid = _currentUserId;
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (uid && url) {
        navigator.sendBeacon(
          `${url}/rest/v1/profiles?id=eq.${uid}`,
          JSON.stringify({ is_online: false, last_seen: new Date().toISOString() })
        );
      }
    };
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      subscription.unsubscribe();
      clearInterval(refreshInterval);
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, []);

  const signUp = useCallback(async (email: string, password: string, metadata: { name: string; age: number; gender: string; looking_for: string }) => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase.auth.signUp({ email, password, options: { data: metadata } });

    if (err) {
      setError(err.message);
      setLoading(false);
      return null;
    }

    // Profile is auto-created by DB trigger on auth.users INSERT
    // (handle_new_user function with SECURITY DEFINER)

    setUser(data.user);
    setLoading(false);
    return data.user;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });

    if (err) {
      setError(err.message);
      setLoading(false);
      return null;
    }

    if (data.user) {
      await supabase.from("profiles").update({ is_online: true, last_seen: new Date().toISOString() }).eq("id", data.user.id);
    }

    setUser(data.user);
    setLoading(false);
    return data.user;
  }, []);

  const signOut = useCallback(async () => {
    if (user) {
      await supabase.from("profiles").update({ is_online: false }).eq("id", user.id);
    }
    await supabase.auth.signOut();
    // RGPD: wipe every CacheStorage bucket so the next user on this device
    // cannot access the previous session's photos/messages via the SW cache.
    // Must run *after* signOut() so in-flight Supabase requests finish first.
    await wipeServiceWorkerCaches();
    setUser(null);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, error, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
