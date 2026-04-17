"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
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
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      _currentUserId = session?.user?.id ?? null;
      setLoading(false);
    });

    // Refresh token every 50 minutes
    const refreshInterval = setInterval(async () => {
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        // Token refresh failed — force re-login
        console.error("Session refresh failed:", refreshError.message);
        await supabase.auth.signOut();
        setUser(null);
        _currentUserId = null;
        window.location.href = "/login";
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
