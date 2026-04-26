"use client";

import { useState } from "react";
import Image from "next/image";
import { m, AnimatePresence } from "motion/react";
import { springs, ambient } from "@/lib/motion-design";
import { useSquad } from "@/lib/useSquad";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { Plus, Check } from "@/components/ui/lucide";

// --- Types ---

interface SquadMember {
  id: string;
  name: string;
  photo: string;
}

interface Squad {
  id: string;
  members: SquadMember[];
  activity: string;
  distance: number;
  mode: string;
}

// --- Helpers ---

// Initials avatar fallback (no real people, PNG generated from name + violet background).
// 2026-04-26 fix: format=svg returned 400 through next/image because
// dangerouslyAllowSVG defaults to false. Use format=png — same visual,
// works through the optimization pipeline.
function avatarFor(name: string, _fallbackId: number): string {
  const safe = encodeURIComponent(name || "?");
  return `https://ui-avatars.com/api/?name=${safe}&background=8B5CF6&color=fff&bold=true&size=256&format=png`;
}

// --- Component ---

export default function SquadPage() {
  const { mySquad: dbSquad, activeSquads, myInvite, createSquad, generateInvite, joinByCode } = useSquad();

  const [joinCode, setJoinCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const inviteCode = myInvite?.code ?? null;
  const inviteLink = inviteCode ? `cesoir.app/invite/${inviteCode}` : "Pas encore de squad";

  // Derive a view-model compatible with existing UI
  const mySquad: SquadMember[] = dbSquad
    ? dbSquad.members.map((m, i) => ({
        id: m.id,
        name: m.name,
        photo: m.avatar ?? avatarFor(m.name, i),
      }))
    : [];

  // Map real DB squads to view-model shape
  const displaySquads: Squad[] = activeSquads.map((s, idx) => ({
    id: s.id,
    members: s.members.map((m, i) => ({
      id: m.id,
      name: m.name,
      photo: m.avatar ?? avatarFor(m.name, idx * 4 + i),
    })),
    activity: s.name,
    distance: 1 + (idx % 4) * 0.7,
    mode: s.mode ?? "CeSoir",
  }));

  const handleCopy = async () => {
    if (!inviteCode) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleJoin = async () => {
    if (joinCode.trim().length !== 6 || busy) return;
    setBusy(true);
    setJoinError(null);
    const ok = await joinByCode(joinCode.trim());
    setBusy(false);
    if (ok) {
      setJoinCode("");
    } else {
      setJoinError("Code invalide ou squad complet");
    }
  };

  const handleCreateSquad = async () => {
    if (busy) return;
    setBusy(true);
    const id = await createSquad("Mon squad");
    if (id) {
      await generateInvite(id);
    }
    setBusy(false);
  };

  return (
    <div className="min-h-screen bg-bg pb-24">
      <PageHeader
        title={
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: "linear-gradient(135deg, var(--color-accent), var(--color-accent-2))" /* Squad gradient heading */ }}
          >
            Squad Mode
          </span>
        }
        icon={<span className="inline-block w-1.5 h-1.5 rounded-full bg-accent" />}
        iconAnimation="pulse"
        hairlineVariant="vert-violet"
        rackFocus
      />

      <div className="px-4 py-4 space-y-6">
        {/* Create squad card */}
        <m.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springs.heavy}
          className="bg-card border border-border rounded-2xl p-5"
          aria-label="Creer ton squad"
        >
          {/* 6. Squad name: slide from left with springs.heavy */}
          <m.h2
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={springs.heavy}
            className="text-base font-display font-bold text-text mb-1"
          >
            Cree ton squad
          </m.h2>
          <p className="text-xs text-text-muted mb-4">Invite jusqu&apos;a 3 amis pour matcher ensemble</p>

          {/* My squad members */}
          {mySquad.length > 0 && (
            <div className="flex items-center gap-[-8px] mb-4" aria-label="Membres de ton squad">
              {mySquad.map((member, i) => (
                <m.div
                  key={member.id}
                  /* 3. Member avatars: scale from 0 with springs.elastic, stagger 0.06 */
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ ...springs.elastic, delay: i * 0.06 }}
                  className="relative w-10 h-10 rounded-full border-2 border-bg overflow-hidden"
                  style={{ marginLeft: i > 0 ? "-8px" : 0, zIndex: mySquad.length - i }}
                >
                  <Image src={member.photo} alt={member.name} fill sizes="40px" className="object-cover" />
                </m.div>
              ))}
              {mySquad.length < 4 && (
                <m.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ ...springs.elastic, delay: mySquad.length * 0.06 }}
                  className="w-10 h-10 rounded-full border-2 border-dashed border-text-muted flex items-center justify-center text-text-muted"
                  style={{ marginLeft: "-8px" }}
                  aria-label="Place disponible"
                >
                  <Plus size={16} strokeWidth={2.5} aria-hidden="true" />
                </m.div>
              )}
            </div>
          )}

          {/* Join with code */}
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="Code d'invitation"
              maxLength={6}
              className="flex-1 px-3 py-2.5 bg-bg border border-border rounded-xl text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-accent font-mono tracking-wider"
              aria-label="Code d'invitation"
            />
            {/* 4. "Rejoindre" button: whileHover scale:1.05 y:-2 with glow, whileTap scale:0.92 */}
            <m.button
              onClick={handleJoin}
              disabled={joinCode.length !== 6 || busy}
              whileHover={{ scale: 1.05, y: -2, boxShadow: "0 0 20px color-mix(in srgb, var(--color-accent) 40%, transparent)" }}
              whileTap={{ scale: 0.92 }}
              transition={springs.snap}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-opacity"
              style={{ background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-2))" }}
            >
              Rejoindre
            </m.button>
          </div>
          {joinError && (
            <p className="text-[11px] text-red-400 mb-2">{joinError}</p>
          )}
          {!inviteCode && mySquad.length === 0 && (
            <m.button
              onClick={handleCreateSquad}
              disabled={busy}
              whileTap={{ scale: 0.95 }}
              className="w-full mb-3 py-2.5 rounded-xl border border-accent/30 text-accent text-sm font-semibold hover:bg-accent/10 transition-colors disabled:opacity-50"
            >
              {busy ? "Creation..." : "Creer mon squad"}
            </m.button>
          )}

          {/* Share invite link — 8. Invite code section: slide from right */}
          <m.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={springs.heavy}
            className="flex items-center gap-2 bg-bg rounded-xl p-2.5 border border-border"
          >
            <span className="flex-1 text-xs font-mono text-text-muted truncate">{inviteLink}</span>
            {/* 4. Action button: whileHover glow + whileTap */}
            <m.button
              onClick={handleCopy}
              whileHover={{ scale: 1.05, y: -2, boxShadow: "0 0 20px color-mix(in srgb, var(--color-accent) 40%, transparent)" }}
              whileTap={{ scale: 0.92 }}
              transition={springs.snap}
              className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all"
              style={{ background: copied ? "var(--color-accent-2)" : "var(--color-accent)" }}
              aria-label={copied ? "Lien copie" : "Copier le lien d'invitation"}
            >
              <AnimatePresence mode="wait">
                {copied ? (
                  <m.span
                    key="check"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="inline-flex items-center gap-1"
                  >
                    <Check size={12} strokeWidth={3} color="var(--color-text)" aria-hidden="true" />
                    Copie
                  </m.span>
                ) : (
                  <m.span
                    key="copy"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    Copier
                  </m.span>
                )}
              </AnimatePresence>
            </m.button>
          </m.div>
        </m.section>

        {/* Active squads section */}
        <section aria-label="Squads actifs ce soir">
          {/* 6. Squad name: slide from left with springs.heavy */}
          <m.h2
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={springs.heavy}
            className="text-base font-display font-bold text-text mb-3"
          >
            Squads actifs ce soir
          </m.h2>

          <div className="space-y-3">
            {displaySquads.length === 0 && (
              <EmptyState
                emoji="☾"
                title="Aucun squad actif pour le moment"
                subtitle="Cree le tien ou rejoins avec un code"
              />
            )}
            {displaySquads.map((squad, i) => (
              /* 2. Squad cards: initial={opacity:0, y:40, scale:0.9} with springs.heavy + stagger 0.1 */
              <m.div
                key={squad.id}
                initial={{ opacity: 0, y: 40, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ ...springs.heavy, delay: i * 0.1 }}
                className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3"
              >
                {/* Overlapping avatars */}
                <div className="flex flex-shrink-0" aria-label={`${squad.members.length} membres`}>
                  {squad.members.slice(0, 3).map((member, j) => (
                    /* 3. Member avatars: scale from 0 with springs.elastic, stagger 0.06 */
                    <m.div
                      key={member.id}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ ...springs.elastic, delay: i * 0.1 + j * 0.06 }}
                      className="relative w-9 h-9 rounded-full border-2 border-card overflow-hidden"
                      style={{ marginLeft: j > 0 ? "-10px" : 0, zIndex: squad.members.length - j }}
                    >
                      <Image src={member.photo} alt={member.name} fill sizes="36px" className="object-cover" />
                    </m.div>
                  ))}
                  {squad.members.length > 3 && (
                    <m.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ ...springs.elastic, delay: i * 0.1 + 3 * 0.06 }}
                      className="w-9 h-9 rounded-full bg-accent/20 border-2 border-card flex items-center justify-center text-[10px] font-bold text-accent"
                      style={{ marginLeft: "-10px" }}
                    >
                      +{squad.members.length - 3}
                    </m.div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text truncate">
                    {squad.members[0].name} + {squad.members.length - 1}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-text-muted">{squad.activity}</span>
                    {/* 5. Online indicator dot: ambient.breathe(3) for living pulse */}
                    <m.span
                      animate={ambient.breathe(3)}
                      className="inline-block w-1.5 h-1.5 rounded-full bg-accent-2"
                    />
                    <span className="text-[10px] text-text-muted">{squad.distance} km</span>
                  </div>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-accent/10 text-[10px] font-semibold text-accent">
                    {squad.mode}
                  </span>
                </div>

                {/* 4. "Proposer" button: whileHover scale:1.05 y:-2 with glow, whileTap scale:0.92 */}
                <m.button
                  whileHover={{ scale: 1.05, y: -2, boxShadow: "0 0 20px color-mix(in srgb, var(--color-accent) 40%, transparent)" }}
                  whileTap={{ scale: 0.92 }}
                  transition={springs.snap}
                  className="flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold text-white"
                  style={{ background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-2))" }}
                  aria-label={`Proposer un plan au squad de ${squad.members[0].name}`}
                >
                  Proposer
                </m.button>
              </m.div>
            ))}
          </div>
        </section>

        {/* 7. Empty state / Fallback solo link: ambient.float(5) for gentle bobbing */}
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, ...ambient.float(5) }}
          transition={{ delay: 0.8 }}
          className="text-center pt-2 pb-4"
        >
          <a href="/browse" className="text-sm font-semibold text-text-muted hover:text-accent transition-colors">
            Matcher en solo &rarr;
          </a>
        </m.div>
      </div>
    </div>
  );
}
