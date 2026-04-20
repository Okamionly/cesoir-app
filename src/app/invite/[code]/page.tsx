"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { m, AnimatePresence } from "motion/react";
import { supabase } from "@/lib/supabase";
import { springs, ambient } from "@/lib/motion-design";
import { app } from "@/lib/design-tokens";
import type { DbSquadInvite } from "@/lib/supabase-types";

// ─── Types ───────────────────────────────

interface InviteData {
  code: string;
  inviterName: string;
  inviterInitial: string;
  squadName: string | null;
  type: "squad" | "friend";
}

type PageState = "loading" | "found" | "invalid";

// ─── Helpers ─────────────────────────────

async function fetchInviteData(code: string): Promise<InviteData | null> {
  // Look up the invite code in squad_invites
  const { data: invite, error } = await supabase
    .from("squad_invites")
    .select("*")
    .eq("code", code.toUpperCase())
    .is("used_by", null)
    .single();

  if (error || !invite) return null;

  const typedInvite = invite as DbSquadInvite;

  // Fetch inviter profile
  const { data: inviter } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", typedInvite.inviter_id)
    .single();

  const inviterName = inviter?.name ?? "Quelqu'un";

  // Fetch squad name if squad invite
  let squadName: string | null = null;
  if (typedInvite.squad_id) {
    const { data: squad } = await supabase
      .from("squads")
      .select("name")
      .eq("id", typedInvite.squad_id)
      .single();
    squadName = squad?.name ?? null;
  }

  return {
    code: typedInvite.code,
    inviterName,
    inviterInitial: inviterName.charAt(0).toUpperCase(),
    squadName,
    type: squadName ? "squad" : "friend",
  };
}

// ─── Component ───────────────────────────

export default function InvitePage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const [state, setState] = useState<PageState>("loading");
  const [invite, setInvite] = useState<InviteData | null>(null);

  useEffect(() => {
    if (!params.code) {
      setState("invalid");
      return;
    }

    fetchInviteData(params.code).then((data) => {
      if (data) {
        setInvite(data);
        setState("found");
      } else {
        setState("invalid");
      }
    });
  }, [params.code]);

  function handleJoin() {
    if (!invite) return;
    router.push(`/register?invite=${invite.code}`);
  }

  return (
    <div className="min-h-screen bg-bg-dark flex flex-col items-center justify-center px-5 py-10 overflow-hidden relative">
      {/* Ambient gradient background */}
      <div className="absolute inset-0 pointer-events-none">
        <m.div
          className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full opacity-[0.06]"
          style={{ background: `radial-gradient(circle, ${app.violet} 0%, transparent 70%)` }}
          animate={ambient.float(8)}
        />
        <m.div
          className="absolute bottom-[-15%] right-[-10%] w-[50vw] h-[50vw] rounded-full opacity-[0.04]"
          style={{ background: `radial-gradient(circle, ${app.vert} 0%, transparent 70%)` }}
          animate={ambient.float(10)}
        />
      </div>

      <AnimatePresence mode="wait">
        {/* ─── Loading ─── */}
        {state === "loading" && (
          <m.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <m.span
              className="text-[48px] text-accent"
              animate={ambient.float(3)}
              aria-hidden="true"
            >
              ☾
            </m.span>
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </m.div>
        )}

        {/* ─── Invalid code ─── */}
        {state === "invalid" && (
          <m.div
            key="invalid"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={springs.elastic}
            className="text-center max-w-sm"
          >
            <m.span
              className="block text-[56px] mb-4"
              animate={ambient.float(5)}
              aria-hidden="true"
            >
              ☾
            </m.span>
            <h1 className="text-2xl font-bold text-text-inv mb-2">
              Lien invalide
            </h1>
            <p className="text-sm text-text-muted mb-8">
              Ce lien d&apos;invitation a expire ou n&apos;existe pas.
            </p>
            <m.a
              href="/"
              className="inline-block px-8 py-3.5 rounded-full gradient-bg text-white text-sm font-semibold shadow-glow"
              whileTap={{ scale: 0.95, transition: springs.micro }}
            >
              Decouvrir CeSoir
            </m.a>
          </m.div>
        )}

        {/* ─── Invite found ─── */}
        {state === "found" && invite && (
          <m.div
            key="found"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-sm flex flex-col items-center"
          >
            {/* Moon logo with ambient float */}
            <m.span
              className="text-[56px] text-accent mb-6"
              animate={ambient.float(6)}
              aria-hidden="true"
            >
              ☾
            </m.span>

            {/* Invite card -- cinematic entrance, scale from 0.8 */}
            <m.div
              initial={{ opacity: 0, scale: 0.8, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={springs.elastic}
              className="w-full bg-bg-card border border-border rounded-2xl p-6 text-center shadow-glow"
            >
              {/* Inviter avatar */}
              <m.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ ...springs.elastic, delay: 0.15 }}
                className="mx-auto w-20 h-20 rounded-full gradient-bg p-[3px] mb-4"
              >
                <div className="w-full h-full rounded-full bg-bg flex items-center justify-center text-[28px] font-black text-accent">
                  {invite.inviterInitial}
                </div>
              </m.div>

              {/* Inviter message */}
              <m.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springs.cinematic, delay: 0.25 }}
              >
                <h1 className="text-xl font-bold text-text mb-1">
                  {invite.inviterName}
                </h1>
                <p className="text-sm text-text-muted mb-4">
                  {invite.type === "squad" && invite.squadName
                    ? `t'invite a rejoindre "${invite.squadName}"`
                    : "t'invite sur CeSoir"}
                </p>
              </m.div>

              {/* Headline */}
              <m.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springs.cinematic, delay: 0.35 }}
                className="text-lg font-display font-bold gradient-text mb-6"
              >
                Rejoins-moi sur CeSoir
              </m.p>

              {/* Value props */}
              <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.45 }}
                className="space-y-2.5 mb-6"
              >
                {[
                  { icon: "🌙", text: "14 modes de rencontre" },
                  { icon: "📍", text: "Trouve des gens pres de toi, ce soir" },
                  { icon: "💯", text: "100% gratuit, zero paywall" },
                ].map((item, i) => (
                  <m.div
                    key={item.text}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...springs.heavy, delay: 0.5 + i * 0.08 }}
                    className="flex items-center gap-2.5 text-left"
                  >
                    <span className="text-base shrink-0" aria-hidden="true">
                      {item.icon}
                    </span>
                    <span className="text-[13px] text-text font-medium">
                      {item.text}
                    </span>
                  </m.div>
                ))}
              </m.div>

              {/* CTA Button */}
              <m.button
                onClick={handleJoin}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springs.elastic, delay: 0.6 }}
                whileTap={{ scale: 0.95, transition: springs.micro }}
                className="w-full py-4 rounded-2xl gradient-bg text-white text-[15px] font-bold shadow-glow active:scale-[0.97] transition-transform tap-target"
              >
                Rejoindre
              </m.button>

              {/* Invite code display */}
              <m.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.7 }}
                className="text-[11px] text-text-muted mt-3"
              >
                Code : <span className="font-mono font-bold text-accent">{invite.code}</span>
              </m.p>
            </m.div>

            {/* Already have an account? */}
            <m.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.8 }}
              className="text-sm text-text-muted mt-6"
            >
              Deja inscrit ?{" "}
              <a href="/login" className="text-accent font-semibold">
                Se connecter
              </a>
            </m.p>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
