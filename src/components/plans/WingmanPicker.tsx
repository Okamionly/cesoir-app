"use client";

/**
 * WingmanPicker — modal that lists who the user can invite as a wingman
 * for a given flash_plan. Eligible candidates = (1) recent matches with
 * an active conversation, (2) members of any squad the user belongs to.
 *
 * UX: bottom sheet with a search filter + two grouped sections
 * ("Matchs récents", "Squad"). Tapping a person fires
 * POST /api/plans/wingman/invite and closes on success.
 *
 * Surfaces:
 *   - /plans/create after a plan has been created (auto-opened when the
 *     "inviter un wingman" toggle is on)
 *   - /plans/[id] header — "Inviter un wingman" pill (future)
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/Toast";
import { Loader2, Search, UserPlus } from "@/components/ui/lucide";
import { logger } from "@/lib/logger";

interface Candidate {
  id: string;
  name: string;
  avatarUrl: string | null;
  source: "match" | "squad";
  hint: string;
}

interface ConversationRow {
  id: string;
  user_a: string;
  user_b: string;
  created_at: string | null;
}

interface SquadRow {
  id: string;
  name: string | null;
  members: string[] | null;
  status: string | null;
}

interface ProfileRow {
  id: string;
  name: string | null;
  avatar_url: string | null;
}

interface WingmanPickerProps {
  open: boolean;
  onClose: () => void;
  planId: string;
  /** IDs to exclude (existing wingmen + plan participants). */
  excludeIds?: string[];
  onInvited?: (inviteeId: string) => void;
}

export function WingmanPicker({
  open,
  onClose,
  planId,
  excludeIds = [],
  onInvited,
}: WingmanPickerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [search, setSearch] = useState("");

  const exclude = useMemo(
    () => new Set([user?.id, ...excludeIds].filter(Boolean) as string[]),
    [user?.id, excludeIds],
  );

  // Load candidates when the sheet opens.
  useEffect(() => {
    if (!open || !user) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        // 1) Active conversations (= matches).
        const { data: convosA } = await supabase
          .from("conversations")
          .select("id, user_a, user_b, created_at")
          .eq("user_a", user.id)
          .order("created_at", { ascending: false })
          .limit(40);

        const { data: convosB } = await supabase
          .from("conversations")
          .select("id, user_a, user_b, created_at")
          .eq("user_b", user.id)
          .order("created_at", { ascending: false })
          .limit(40);

        const conversations = [
          ...((convosA ?? []) as ConversationRow[]),
          ...((convosB ?? []) as ConversationRow[]),
        ];

        const matchPeerIds = Array.from(
          new Set(
            conversations.map((c) =>
              c.user_a === user.id ? c.user_b : c.user_a,
            ),
          ),
        );

        // 2) Squad members.
        const { data: squads } = await supabase
          .from("squads")
          .select("id, name, members, status")
          .contains("members", [user.id])
          .eq("status", "active");

        const squadPeerIds = new Set<string>();
        for (const s of (squads ?? []) as SquadRow[]) {
          for (const m of s.members ?? []) {
            if (m !== user.id) squadPeerIds.add(m);
          }
        }

        const allPeerIds = Array.from(
          new Set([...matchPeerIds, ...Array.from(squadPeerIds)]),
        ).filter((id) => !exclude.has(id));

        if (allPeerIds.length === 0) {
          if (!cancelled) setCandidates([]);
          return;
        }

        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, name, avatar_url")
          .in("id", allPeerIds);

        const profileMap = new Map<string, ProfileRow>();
        for (const p of (profiles ?? []) as ProfileRow[]) {
          profileMap.set(p.id, p);
        }

        const matchSet = new Set(matchPeerIds);
        const out: Candidate[] = allPeerIds.map((id) => {
          const p = profileMap.get(id);
          const isMatch = matchSet.has(id);
          return {
            id,
            name: p?.name ?? "?",
            avatarUrl: p?.avatar_url ?? null,
            source: isMatch ? "match" : "squad",
            hint: isMatch ? "Match" : "Squad",
          };
        });

        if (!cancelled) setCandidates(out);
      } catch (err) {
        logger.warn("wingman_picker_load_failed", {
          err: err instanceof Error ? err.message : String(err),
        });
        if (!cancelled) setCandidates([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, user, exclude]);

  const filtered = useMemo(() => {
    if (!search.trim()) return candidates;
    const q = search.trim().toLowerCase();
    return candidates.filter((c) => c.name.toLowerCase().includes(q));
  }, [candidates, search]);

  const grouped = useMemo(() => {
    const matches = filtered.filter((c) => c.source === "match");
    const squad = filtered.filter((c) => c.source === "squad");
    return { matches, squad };
  }, [filtered]);

  const handleInvite = useCallback(
    async (candidate: Candidate) => {
      if (!user || submittingId) return;
      setSubmittingId(candidate.id);
      try {
        const { data: session } = await supabase.auth.getSession();
        const token = session.session?.access_token;
        if (!token) {
          toast("Connecte-toi pour inviter un wingman.", "error");
          return;
        }

        const res = await fetch("/api/plans/wingman/invite", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ planId, inviteeId: candidate.id }),
        });
        const json = (await res.json().catch(() => null)) as
          | { ok?: boolean; error?: string }
          | null;

        if (!res.ok) {
          toast(json?.error ?? "Invitation refusée", "error");
          return;
        }
        toast(`${candidate.name} a été invité comme wingman`, "success");
        onInvited?.(candidate.id);
        onClose();
      } catch (err) {
        logger.warn("wingman_picker_invite_failed", {
          err: err instanceof Error ? err.message : String(err),
        });
        toast("Erreur réseau — réessaie.", "error");
      } finally {
        setSubmittingId(null);
      }
    },
    [user, submittingId, planId, toast, onInvited, onClose],
  );

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Inviter un wingman"
      snapPoints={[0.85]}
      initialSnap={0}
    >
      <div className="space-y-4">
        <p className="text-[13px] text-text-muted leading-snug">
          Ton wingman est un ami CeSoir qui vient avec toi au plan. Choisis un
          match actif ou un membre de ton squad.
        </p>

        {/* Search */}
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            aria-hidden
          />
          <input
            type="text"
            placeholder="Chercher un nom..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-card border border-border rounded-2xl pl-9 pr-3 py-2.5 text-sm text-text placeholder:text-text-muted/60 focus:border-accent focus:outline-none"
            aria-label="Filtrer les candidats wingman"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-text-muted">
            <Loader2 size={20} className="animate-spin" aria-hidden />
            <span className="ml-2 text-sm">Chargement...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-text-muted">
            <p className="text-sm font-semibold mb-1">Aucun wingman possible</p>
            <p className="text-[13px]">
              Tu peux inviter un match actif ou un membre de ton squad.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {grouped.matches.length > 0 && (
              <Section
                label="Matchs récents"
                items={grouped.matches}
                onPick={handleInvite}
                submittingId={submittingId}
              />
            )}
            {grouped.squad.length > 0 && (
              <Section
                label="Squad"
                items={grouped.squad}
                onPick={handleInvite}
                submittingId={submittingId}
              />
            )}
          </div>
        )}
      </div>
    </BottomSheet>
  );
}

function Section({
  label,
  items,
  onPick,
  submittingId,
}: {
  label: string;
  items: Candidate[];
  onPick: (c: Candidate) => void;
  submittingId: string | null;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase text-text-muted mb-2">
        {label}
      </p>
      <ul className="space-y-2">
        {items.map((c) => {
          const busy = submittingId === c.id;
          return (
            <li key={c.id}>
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                disabled={busy || submittingId !== null}
                onClick={() => onPick(c)}
                className="w-full flex items-center gap-3 rounded-2xl border border-border bg-card px-3 py-2.5 text-left disabled:opacity-50"
              >
                <div
                  className="w-10 h-10 rounded-full bg-border/40 overflow-hidden flex items-center justify-center text-text-muted text-[13px] font-bold"
                  aria-hidden
                >
                  {c.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.avatarUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    c.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text truncate">
                    {c.name}
                  </p>
                  <p className="text-[11px] text-text-muted">{c.hint}</p>
                </div>
                {busy ? (
                  <Loader2
                    size={18}
                    className="animate-spin text-accent"
                    aria-hidden
                  />
                ) : (
                  <UserPlus size={18} className="text-accent" aria-hidden />
                )}
              </motion.button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default WingmanPicker;
