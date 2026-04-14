"use client";

import { useState, useEffect } from "react";
import { supabase, DbProfile } from "./supabase";

export function useProfile(userId?: string) {
  const [profile, setProfile] = useState<DbProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    async function fetch() {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (!error && data) {
        setProfile(data as DbProfile);
      }
      setLoading(false);
    }

    fetch();
  }, [userId]);

  const updateProfile = async (updates: Partial<DbProfile>) => {
    if (!userId) return;
    const { error } = await supabase
      .from("profiles")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (!error) {
      setProfile(prev => prev ? { ...prev, ...updates } : null);
    }
    return !error;
  };

  return { profile, loading, updateProfile };
}
