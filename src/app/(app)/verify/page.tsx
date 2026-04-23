"use client";

/**
 * /verify — V5 Wave 15 real selfie verification page
 * (distinct from /profile/verify which is the mock methods picker)
 *
 * Uses face-api.js to match a 3-pose liveness capture against the avatar.
 * Falls back to moderation_queue for human review if face-api fails or
 * descriptors are ambiguous (distance >= 0.7).
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import SelfieVerification from "@/components/profile/SelfieVerification";

export default function VerifyPage() {
  const { user } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<{ verified: boolean; queued: boolean } | null>(
    null,
  );

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user.id)
        .single();
      if (active) {
        setAvatarUrl(data?.avatar_url ?? null);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user?.id]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg px-6">
        <div className="text-center">
          <p className="text-text-muted text-[14px] mb-4">
            Tu dois etre connecte pour te verifier.
          </p>
          <Link
            href="/auth/login"
            className="text-accent font-semibold underline"
          >
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg px-5 pt-6 pb-24">
      <div className="max-w-md mx-auto">
        <h1 className="text-[22px] font-black text-text mb-2">Verification selfie</h1>
        <p className="text-[13px] text-text-muted mb-6 leading-relaxed">
          Capture 3 poses dans l&apos;ordre. Nous comparons ton visage a ta photo
          de profil avec un modele local (aucune image envoyee sans ton accord).
        </p>

        {loading && (
          <p className="text-[13px] text-text-muted">Chargement...</p>
        )}

        {!loading && !avatarUrl && (
          <div className="bg-warning/8 border border-warning/20 rounded-2xl p-4 mb-4">
            <p className="text-[13px] text-text">
              Ajoute d&apos;abord une photo de profil pour pouvoir te verifier.
            </p>
            <Link
              href="/profile/edit"
              className="text-[13px] text-accent font-semibold underline mt-2 inline-block"
            >
              Ajouter une photo
            </Link>
          </div>
        )}

        {!loading && avatarUrl && !result && (
          <SelfieVerification
            userId={user.id}
            avatarUrl={avatarUrl}
            onComplete={(r) => setResult(r)}
          />
        )}

        {result && (
          <div
            className={`mt-6 rounded-2xl p-5 text-center ${
              result.verified
                ? "bg-safe/10 border border-safe/30"
                : "bg-warning/10 border border-warning/30"
            }`}
          >
            {result.verified ? (
              <>
                <p className="text-[18px] font-black text-safe mb-1">Verifie !</p>
                <p className="text-[13px] text-text-muted">
                  Ton badge apparait sur ton profil.
                </p>
              </>
            ) : (
              <>
                <p className="text-[18px] font-black text-warning mb-1">
                  En attente de revue
                </p>
                <p className="text-[13px] text-text-muted">
                  Ta verification a ete envoyee a notre equipe pour revue manuelle
                  (sous 24h).
                </p>
              </>
            )}
            <Link
              href="/profile"
              className="mt-4 inline-block text-accent font-semibold underline"
            >
              Retour au profil
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
