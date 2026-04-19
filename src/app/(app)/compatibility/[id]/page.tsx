"use client";

import { use, useEffect, useState } from "react";
import { m } from "motion/react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { calculateCompatibility, type CompatProfile } from "@/lib/compatibility";
import { MODES } from "@/lib/modes";
import PageHeader from "@/components/ui/PageHeader";
import Container from "@/components/ui/Container";
import { springs, easings } from "@/lib/motion-design";

/**
 * /compatibility/[id] — affiche le score de compatibilité entre le user
 * connecté et le user [id] (typiquement le peer d'une conversation).
 *
 * Bug 2026-04-19 : cette route était linkée depuis /chat/[id] via
 * `href="/compatibility/${conversationId}"` mais n'existait pas (404).
 * Ce stub utilise `lib/compatibility.ts` qui existait déjà.
 *
 * NOTE: [id] peut être soit un user id, soit un conversation id.
 * On tente d'abord comme user id; si échec, on résout via la conversation.
 */
export default function CompatibilityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useAuth();

  const [peerId, setPeerId] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [peerName, setPeerName] = useState<string>("");
  const [sharedModes, setSharedModes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        // Resolve peer id from conversation if needed
        let resolvedPeerId = id;
        const { data: conv } = await supabase
          .from("conversations")
          .select("user_a, user_b")
          .eq("id", id)
          .maybeSingle();
        if (conv) {
          resolvedPeerId = conv.user_a === user!.id ? conv.user_b : conv.user_a;
        }

        // Fetch both profiles
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, name, age")
          .in("id", [user!.id, resolvedPeerId]);

        const meRow = profiles?.find((p) => p.id === user!.id);
        const peerRow = profiles?.find((p) => p.id === resolvedPeerId);
        if (!meRow || !peerRow) {
          setError("Profil introuvable");
          return;
        }

        // Fetch modes for both
        const { data: modeRows } = await supabase
          .from("mode_activations")
          .select("user_id, mode")
          .in("user_id", [user!.id, resolvedPeerId])
          .eq("is_active", true);

        const myModes = (modeRows ?? [])
          .filter((m) => m.user_id === user!.id)
          .map((m) => m.mode);
        const peerModes = (modeRows ?? [])
          .filter((m) => m.user_id === resolvedPeerId)
          .map((m) => m.mode);

        const meProfile: CompatProfile = {
          modes: myModes as CompatProfile["modes"],
          age: meRow.age ?? 25,
        };
        const peerProfile: CompatProfile = {
          modes: peerModes as CompatProfile["modes"],
          age: peerRow.age ?? 25,
        };

        const s = Math.round(calculateCompatibility(meProfile, peerProfile));
        const shared = myModes.filter((m) => peerModes.includes(m));

        if (!cancelled) {
          setScore(s);
          setPeerId(resolvedPeerId);
          setPeerName(peerRow.name ?? "");
          setSharedModes(shared);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Erreur inconnue");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id, user]);

  return (
    <div className="min-h-screen bg-bg">
      <PageHeader
        title="Compatibilité"
        subtitle={peerName ? `avec ${peerName}` : undefined}
        backHref={peerId ? `/chat/${id}` : "/chat"}
        hairlineVariant="vert-violet"
      />
      <Container size="md" className="py-8">
        {loading && (
          <div className="text-center text-text-muted text-sm py-16">Calcul…</div>
        )}
        {error && !loading && (
          <div className="text-center text-danger text-sm py-16">{error}</div>
        )}
        {score !== null && !loading && (
          <>
            {/* Score radial */}
            <m.div
              className="relative w-48 h-48 mx-auto mb-8"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ ...springs.cinematic, delay: 0.1 }}
            >
              <svg width={192} height={192} viewBox="0 0 192 192" className="absolute inset-0">
                <circle cx={96} cy={96} r={82} stroke="var(--color-border)" strokeWidth={10} fill="none" />
                <m.circle
                  cx={96}
                  cy={96}
                  r={82}
                  stroke="url(#compat-grad)"
                  strokeWidth={10}
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={2 * Math.PI * 82}
                  initial={{ strokeDashoffset: 2 * Math.PI * 82 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 82 * (1 - score / 100) }}
                  transition={{ duration: 1.2, ease: easings.out, delay: 0.2 }}
                  transform="rotate(-90 96 96)"
                />
                <defs>
                  <linearGradient id="compat-grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="var(--color-accent)" />
                    <stop offset="100%" stopColor="var(--color-accent-2)" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-5xl font-black tracking-tight text-text tabular-nums">
                  {score}
                </div>
                <div className="text-[11px] text-text-muted uppercase tracking-[0.2em] mt-1">
                  sur 100
                </div>
              </div>
            </m.div>

            <m.p
              className="text-center text-[15px] text-text-muted mb-8 leading-relaxed"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              {score >= 80 && "Super match — vous avez beaucoup en commun."}
              {score >= 60 && score < 80 && "Belle compatibilité, des intérêts partagés."}
              {score >= 40 && score < 60 && "Compatibilité correcte, un peu à découvrir."}
              {score < 40 && "Peu de modes communs — l'opposé des contraires ?"}
            </m.p>

            {sharedModes.length > 0 && (
              <m.div
                className="bg-bg-card border border-border rounded-2xl p-5"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5 }}
              >
                <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-[0.12em] mb-3">
                  Modes en commun
                </h3>
                <div className="flex flex-wrap gap-2">
                  {sharedModes.map((key) => {
                    const m = MODES[key as keyof typeof MODES];
                    if (!m) return null;
                    return (
                      <span
                        key={key}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold text-white"
                        style={{ backgroundColor: m.color }}
                      >
                        <span aria-hidden>{m.icon}</span>
                        {m.name}
                      </span>
                    );
                  })}
                </div>
              </m.div>
            )}
          </>
        )}
      </Container>
    </div>
  );
}
