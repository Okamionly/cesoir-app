"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";
import type { User } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({ user: null, loading: true, error: null });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState({ user: session?.user ?? null, loading: false, error: null });
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ user: session?.user ?? null, loading: false, error: null });
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = useCallback(async (email: string, password: string, metadata: { name: string; age: number; gender: string; looking_for: string }) => {
    setState(s => ({ ...s, loading: true, error: null }));
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });

    if (error) {
      setState(s => ({ ...s, loading: false, error: error.message }));
      return null;
    }

    // Create profile row
    if (data.user) {
      await supabase.from("profiles").insert({
        id: data.user.id,
        name: metadata.name,
        age: metadata.age,
        gender: metadata.gender,
        looking_for: metadata.looking_for,
        bio: "",
        is_online: true,
      });
    }

    setState({ user: data.user, loading: false, error: null });
    return data.user;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setState(s => ({ ...s, loading: true, error: null }));
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setState(s => ({ ...s, loading: false, error: error.message }));
      return null;
    }

    // Mark online
    if (data.user) {
      await supabase.from("profiles").update({ is_online: true, last_seen: new Date().toISOString() }).eq("id", data.user.id);
    }

    setState({ user: data.user, loading: false, error: null });
    return data.user;
  }, []);

  const signOut = useCallback(async () => {
    if (state.user) {
      await supabase.from("profiles").update({ is_online: false }).eq("id", state.user.id);
    }
    await supabase.auth.signOut();
    setState({ user: null, loading: false, error: null });
  }, [state.user]);

  return { ...state, signUp, signIn, signOut };
}
