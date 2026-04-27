"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

export interface CompletenessItem {
  id: string;
  label: string;
  href: string;
  weight: number;
}

export interface ProfileCompletenessResult {
  percent: number;
  missing: CompletenessItem[];
  isComplete: boolean;
  loading: boolean;
}

// ─────────────────────────────────────────
// Item catalog — ordered by weight desc
// so highest-impact items appear first
// ─────────────────────────────────────────

const ALL_ITEMS: CompletenessItem[] = [
  { id: "photo",       label: "Photo principale",        href: "/profile/edit?focus=photo",   weight: 25 },
  { id: "photos",      label: "4+ photos de profil",     href: "/profile/edit?focus=gallery", weight: 20 },
  { id: "bio",         label: "Bio (30 caractères min)", href: "/profile/edit?focus=bio",     weight: 15 },
  { id: "mode",        label: "Activer un mode",         href: "/modes",                      weight: 15 },
  { id: "verified",    label: "Vérification du compte",  href: "/profile/verify",             weight: 15 },
  { id: "voice_intro", label: "Intro vocale",            href: "/profile/edit?focus=voice",   weight: 10 },
];

// ─────────────────────────────────────────
// Checks
// ─────────────────────────────────────────

interface RawData {
  avatar_url: string | null;
  bio: string | null;
  is_verified: boolean;
  // voice_intro_url is a bonus column — may not exist yet in schema
  voice_intro_url?: string | null;
  // photos is a bonus column — may not exist yet in schema
  photos?: string[] | null;
  has_active_mode: boolean;
}

function computeMissing(data: RawData): CompletenessItem[] {
  const missing: CompletenessItem[] = [];

  for (const item of ALL_ITEMS) {
    switch (item.id) {
      case "photo":
        if (!data.avatar_url) missing.push(item);
        break;
      case "photos":
        if (!data.photos || data.photos.length < 4) missing.push(item);
        break;
      case "bio":
        if (!data.bio || data.bio.trim().length < 30) missing.push(item);
        break;
      case "mode":
        if (!data.has_active_mode) missing.push(item);
        break;
      case "verified":
        if (!data.is_verified) missing.push(item);
        break;
      case "voice_intro":
        if (!data.voice_intro_url) missing.push(item);
        break;
    }
  }

  return missing;
}

// ─────────────────────────────────────────
// Hook
// ─────────────────────────────────────────

export function useProfileCompleteness(): ProfileCompletenessResult {
  const { user } = useAuth();
  const [result, setResult] = useState<ProfileCompletenessResult>({
    percent: 0,
    missing: [],
    isComplete: false,
    loading: true,
  });

  useEffect(() => {
    if (!user) {
      setResult({ percent: 0, missing: [], isComplete: false, loading: false });
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const [profileRes, modeRes] = await Promise.all([
          supabase
            .from("profiles")
            .select("avatar_url, bio, is_verified, voice_intro_url, photos")
            .eq("id", user!.id)
            .single(),
          supabase
            .from("mode_activations")
            .select("id")
            .eq("user_id", user!.id)
            .eq("is_active", true)
            .limit(1),
        ]);

        if (cancelled) return;

        const profile = profileRes.data;
        const hasActiveMode = (modeRes.data?.length ?? 0) > 0;

        const raw: RawData = {
          avatar_url:      profile?.avatar_url ?? null,
          bio:             profile?.bio ?? null,
          is_verified:     profile?.is_verified ?? false,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          voice_intro_url: (profile as any)?.voice_intro_url ?? null,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          photos:          (profile as any)?.photos ?? null,
          has_active_mode: hasActiveMode,
        };

        const missing = computeMissing(raw);
        const earnedWeight = ALL_ITEMS.filter(
          (item) => !missing.some((m) => m.id === item.id),
        ).reduce((sum, item) => sum + item.weight, 0);

        const percent = earnedWeight;
        const isComplete = percent === 100;

        setResult({ percent, missing, isComplete, loading: false });
      } catch {
        if (!cancelled) {
          setResult({ percent: 0, missing: [], isComplete: false, loading: false });
        }
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [user]);

  return result;
}
