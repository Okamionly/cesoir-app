"use client";

export const dynamic = "force-dynamic";

/**
 * /admin/finance — owner-only CFO dashboard.
 *
 * Wave 15 · CFO 10/10 · 2026-04-23. Wraps the RunwayCalculator inside an
 * email-whitelist gate. The whitelist is read from
 * `NEXT_PUBLIC_ADMIN_OWNERS` (comma-separated emails, lowercased). Same
 * pattern as `NEXT_PUBLIC_VENUE_OWNERS` (see src/app/api/venues/events/route.ts).
 *
 * Not a SEO page — no-indexed via Next metadata. Always client-rendered
 * because RunwayCalculator depends on localStorage.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import RunwayCalculator from "@/components/admin/RunwayCalculator";
import { useAuth } from "@/context/AuthContext";

const ADMIN_OWNERS = new Set(
  (process.env.NEXT_PUBLIC_ADMIN_OWNERS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
);

type GateState = "loading" | "ok" | "denied" | "unauth";

export default function AdminFinancePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [state, setState] = useState<GateState>("loading");

  useEffect(() => {
    if (loading) {
      setState("loading");
      return;
    }
    if (!user) {
      setState("unauth");
      return;
    }
    const email = user.email?.toLowerCase() ?? "";
    if (ADMIN_OWNERS.size === 0) {
      // Fail-safe: if the whitelist is not configured, deny everyone.
      setState("denied");
      return;
    }
    setState(ADMIN_OWNERS.has(email) ? "ok" : "denied");
  }, [loading, user]);

  if (state === "loading") {
    return <FullScreenMsg title="Chargement…" />;
  }

  if (state === "unauth") {
    return (
      <FullScreenMsg
        title="Authentification requise"
        body="Connecte-toi pour accéder au tableau de bord finance."
        cta={{ href: "/login", label: "Aller à la connexion" }}
      />
    );
  }

  if (state === "denied") {
    return (
      <FullScreenMsg
        title="Accès refusé"
        body="Cet écran est réservé aux propriétaires. Si c'est une erreur, vérifie NEXT_PUBLIC_ADMIN_OWNERS."
        cta={{ href: "/", label: "Retour accueil" }}
      />
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between p-4 text-sm">
          <Link href="/" className="text-neutral-500 hover:text-neutral-900">
            ← Retour app
          </Link>
          <div className="font-mono text-xs uppercase tracking-wide text-neutral-500">
            admin · finance
          </div>
          <button
            type="button"
            onClick={() => router.refresh()}
            className="text-neutral-500 hover:text-neutral-900"
          >
            Refresh
          </button>
        </div>
      </header>
      <RunwayCalculator />
    </main>
  );
}

function FullScreenMsg({
  title,
  body,
  cta,
}: {
  title: string;
  body?: string;
  cta?: { href: string; label: string };
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-white px-6 text-center text-[#111]">
      <div className="max-w-sm space-y-3">
        <h1 className="text-xl font-semibold">{title}</h1>
        {body ? <p className="text-sm text-neutral-600">{body}</p> : null}
        {cta ? (
          <Link
            href={cta.href}
            className="inline-block rounded-full bg-[#8B5CF6] px-4 py-2 text-sm font-semibold text-white"
          >
            {cta.label}
          </Link>
        ) : null}
      </div>
    </main>
  );
}
