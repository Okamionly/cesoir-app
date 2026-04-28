"use client";

/**
 * WingmanInviteCard — invitee-side surface mounted in /notifications.
 *
 * Renders any pending wingman invite for the current user with two
 * primary actions: Accepter / Refuser. Both call
 * /api/plans/wingman/respond and re-fetch the list. Realtime + polling
 * keep the card fresh if multiple invites land in the same session.
 *
 * Usage: drop <WingmanInviteCard /> at the top of /notifications above
 * the segmented filter; the component self-hides if no pending invite
 * exists for the caller.
 */

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/Toast";
import { Loader2, UserPlus, X } from "@/components/ui/lucide";
import { logger } from "@/lib/logger";

interface PendingInvite {
  id: string;
  planId: string;
  invitedAt: string;
  inviterId: string;
  inviterName: string;
  inviterAvatar: string | null;
  planTitle: string;
  planWhenAt: string;
  planVenue: string | null;
}

interface InviteRow {
  id: string;
  plan_id: string;
  inviter_id: string;
  status: string;
  invited_at: string;
}

interface PlanRow {
  id: string;
  title: string;
  when_at: string;
  venue: string | null;
  status: string | null;
}

interface ProfileRow {
  id: string;
  name: string | null;
  avatar_url: string | null;
}

export function WingmanInviteCard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [submitting, setSubmitting] = useState<{
    inviteId: string;
    accept: boolean;
  } | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("wingman_invites")
        .select("id, plan_id, inviter_id, status, invited_at")
        .eq("invitee_id", user.id)
        .eq("status", "pending")
        .order("invited_at", { ascending: false });

      if (error) {
        logger.warn("wingman_card_fetch_failed", { err: error.message });
        return;
      }

      const rows = (data ?? []) as InviteRow[];
      if (rows.length === 0) {
        setInvites([]);
        return;
      }

      const planIds = rows.map((r) => r.plan_id);
      const inviterIds = rows.map((r) => r.inviter_id);

      const [{ data: plans }, { data: profiles }] = await Promise.all([
        supabase
          .from("flash_plans")
          .select("id, title, when_at, venue, status")
          .in("id", planIds),
        supabase
          .from("profiles")
          .select("id, name, avatar_url")
          .in("id", inviterIds),
      ]);

      const planMap = new Map<string, PlanRow>();
      for (const p of (plans ?? []) as PlanRow[]) planMap.set(p.id, p);
      const profileMap = new Map<string, ProfileRow>();
      for (const p of (profiles ?? []) as ProfileRow[]) profileMap.set(p.id, p);

      const now = Date.now();
      const enriched: PendingInvite[] = rows
        .map((r) => {
          const plan = planMap.get(r.plan_id);
          if (!plan) return null;
          // Filter out plans already past or closed (server will respond
          // 410 on accept anyway — UX-side we just hide the card).
          if (
            plan.status !== "open"
            || new Date(plan.when_at).getTime() <= now
          ) {
            return null;
          }
          const profile = profileMap.get(r.inviter_id);
          const out: PendingInvite = {
            id: r.id,
            planId: r.plan_id,
            invitedAt: r.invited_at,
            inviterId: r.inviter_id,
            inviterName: profile?.name ?? "?",
            inviterAvatar: profile?.avatar_url ?? null,
            planTitle: plan.title,
            planWhenAt: plan.when_at,
            planVenue: plan.venue,
          };
          return out;
        })
        .filter((x): x is PendingInvite => x !== null);

      setInvites(enriched);
    } catch (err) {
      logger.warn("wingman_card_load_threw", {
        err: err instanceof Error ? err.message : String(err),
      });
    }
  }, [user]);

  useEffect(() => {
    void load();
    if (!user) return;

    // Realtime: any change to wingman_invites for this user triggers a
    // re-fetch. Cheap because the list is small.
    const channel = supabase
      .channel(`wingman-invites-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "wingman_invites",
          filter: `invitee_id=eq.${user.id}`,
        },
        () => {
          void load();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, load]);

  const respond = useCallback(
    async (inviteId: string, accept: boolean) => {
      if (!user || submitting) return;
      setSubmitting({ inviteId, accept });
      try {
        const { data: session } = await supabase.auth.getSession();
        const token = session.session?.access_token;
        if (!token) {
          toast("Reconnecte-toi pour répondre.", "error");
          return;
        }

        const res = await fetch("/api/plans/wingman/respond", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ inviteId, accept }),
        });
        const json = (await res.json().catch(() => null)) as
          | { ok?: boolean; error?: string }
          | null;
        if (!res.ok) {
          toast(json?.error ?? "Réponse refusée", "error");
          return;
        }
        toast(
          accept ? "Tu rejoins le plan comme wingman" : "Invitation refusée",
          "success",
        );
        // Optimistic remove (realtime will also trigger a re-fetch).
        setInvites((prev) => prev.filter((i) => i.id !== inviteId));
      } catch (err) {
        logger.warn("wingman_card_respond_failed", {
          err: err instanceof Error ? err.message : String(err),
        });
        toast("Erreur réseau — réessaie.", "error");
      } finally {
        setSubmitting(null);
      }
    },
    [user, submitting, toast],
  );

  if (invites.length === 0) return null;

  return (
    <div className="px-5 pt-4 space-y-3">
      <AnimatePresence initial={false}>
        {invites.map((inv) => {
          const isBusy = submitting?.inviteId === inv.id;
          const isAccepting = isBusy && submitting?.accept === true;
          const isDeclining = isBusy && submitting?.accept === false;
          const whenLabel = formatPlanWhen(inv.planWhenAt);
          return (
            <motion.div
              key={inv.id}
              layout
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 30 }}
              className="rounded-2xl border border-accent/30 bg-card p-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-full bg-accent/15 flex items-center justify-center text-accent">
                  <UserPlus size={20} aria-hidden />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold uppercase tracking-wider text-accent">
                    Invitation wingman
                  </p>
                  <p className="text-sm text-text font-semibold mt-0.5 leading-snug">
                    <span className="text-accent">{inv.inviterName}</span>
                    {" t'invite comme wingman pour "}
                    <Link
                      href={`/plans/${inv.planId}`}
                      className="underline decoration-accent/40 underline-offset-2"
                    >
                      {inv.planTitle}
                    </Link>
                  </p>
                  <p className="text-[12px] text-text-muted mt-1">
                    {whenLabel}
                    {inv.planVenue ? ` · ${inv.planVenue}` : ""}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 mt-3">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  disabled={isBusy}
                  onClick={() => respond(inv.id, true)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl gradient-bg text-white text-[13px] font-bold py-2.5 shadow-glow disabled:opacity-60"
                >
                  {isAccepting ? (
                    <Loader2 size={14} className="animate-spin" aria-hidden />
                  ) : null}
                  Accepter
                </motion.button>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  disabled={isBusy}
                  onClick={() => respond(inv.id, false)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-border text-text-muted text-[13px] font-semibold py-2.5 disabled:opacity-60"
                >
                  {isDeclining ? (
                    <Loader2 size={14} className="animate-spin" aria-hidden />
                  ) : (
                    <X size={14} aria-hidden />
                  )}
                  Refuser
                </motion.button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function formatPlanWhen(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default WingmanInviteCard;
