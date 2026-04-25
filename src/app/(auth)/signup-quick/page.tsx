"use client";

/**
 * /signup-quick — 3-step unified signup that replaces the legacy
 * 12-step register → onboarding → welcome chain.
 *
 * Promise on the marketing landing: "tu y es en 90 secondes". The old
 * flow took 12 screens (4 register + 5 welcome + 3 onboarding) which
 * killed activation. This consolidates to:
 *
 *   Step 1 — identity   (email, password, age, optional invite code)
 *   Step 2 — intent     (one mode pick + geolocation consent)
 *   Step 3 — landing    (welcome + tap to enter)
 *
 * Skipped (deferred to /profile):
 *   - name (we use the email prefix as fallback; user can edit later)
 *   - gender / looking_for (defaulted to "u" = unspecified, no impact
 *     on matching since the gender filter is opt-in client-side)
 *   - photo upload (the old flow forced this on screen 2 and bounced
 *     50% of users without a photo handy; now optional in /profile)
 *   - bio (deferred to /profile)
 *
 * The legacy /register flow is intentionally left intact so we can A/B
 * compare conversion before switching the landing CTAs.
 */

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { m } from "motion/react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useGeolocation } from "@/lib/useGeolocation";
import { supabase } from "@/lib/supabase";
import { MODES, type ModeKey } from "@/lib/modes";
import { easings } from "@/lib/motion-design";

const PUBLIC_MODES: ModeKey[] = [
  "solo-diner",
  "plus-one",
  "night-owl",
  "foodie-quest",
];

const MODE_TAGLINES: Record<ModeKey, string> = {
  "solo-diner": "Tu manges seul ce soir, ouvert à un convive.",
  "plus-one": "Cherche quelqu'un pour un événement / une sortie.",
  "night-owl": "Tu sors tard, dispo après 22h.",
  "foodie-quest": "Tu veux tester un nouveau resto, en duo.",
};

function SignupQuickInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { signUp } = useAuth();
  const geo = useGeolocation();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [age, setAge] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [selectedMode, setSelectedMode] = useState<ModeKey | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Auto-extract invite code from URL (?invite=XXX)
  useEffect(() => {
    const c = params?.get("invite")?.trim();
    if (c) setInviteCode(c.toUpperCase());
  }, [params]);

  async function handleStep1Submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const ageNum = parseInt(age, 10);
    if (!email || !password || password.length < 8 || !age || isNaN(ageNum) || ageNum < 18) {
      setError("Email, mot de passe (8+ caractères), âge 18+ requis.");
      setLoading(false);
      return;
    }

    // Pre-verify invite code if user pasted one (UX: catch typo before signUp)
    if (inviteCode) {
      try {
        const res = await fetch("/api/invites/claim", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: inviteCode, verify: true }),
        });
        const data = (await res.json()) as { valid?: boolean; reason?: string };
        if (!data.valid) {
          setError(`Code invitation invalide${data.reason ? ` (${data.reason})` : ""}.`);
          setLoading(false);
          return;
        }
      } catch {
        setError("Vérification du code impossible. Réessaye.");
        setLoading(false);
        return;
      }
    }

    // Use the email local-part as a fallback display name. User edits in
    // /profile later if they care.
    const fallbackName = email.split("@")[0].slice(0, 30) || "Anon";

    const user = await signUp(email, password, {
      name: fallbackName,
      age: ageNum,
      // Defaulted; user updates in /profile post-signup. Matching gender
      // filter is opt-in client-side so "u" doesn't break discovery.
      gender: "u",
      looking_for: "u",
    });

    if (!user) {
      setError("Inscription refusée. Si l'email existe déjà, va sur /login.");
      setLoading(false);
      return;
    }

    // Background — claim invite, never block UX on it.
    if (inviteCode) {
      void supabase.auth.getSession().then(({ data }) => {
        const token = data.session?.access_token;
        if (!token) return;
        void fetch("/api/invites/claim", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ code: inviteCode }),
        });
      });
    }

    setLoading(false);
    setStep(2);
  }

  async function handleStep2Submit() {
    if (!selectedMode) return;
    setLoading(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Session expirée. Reconnecte-toi.");
      setLoading(false);
      return;
    }

    // Activate the chosen mode + flip is_online so the user appears in
    // nearby_profiles right away. Supabase query builders are PromiseLike
    // (not real Promises) so we wrap them in async IIFEs to make
    // Promise.allSettled happy on TypeScript's strict types.
    const tasks: Promise<unknown>[] = [
      (async () => supabase.from("mode_activations").upsert({
        user_id: user.id,
        mode: selectedMode,
        is_active: true,
        activated_at: new Date().toISOString(),
      }, { onConflict: "user_id,mode" }))(),
      (async () => supabase.from("profiles").update({
        is_online: true,
        last_seen: new Date().toISOString(),
      }).eq("id", user.id))(),
    ];

    // Persist location only if the user actually granted geolocation. Geo
    // permission denied → silently skip; the user can still browse using
    // the active-city fallback (HOTSPOTS centroids).
    if (geo.latitude !== null && geo.longitude !== null) {
      tasks.push(
        (async () => supabase.rpc("update_location", {
          user_id: user.id,
          lat: geo.latitude,
          lng: geo.longitude,
        }))(),
      );
    }

    await Promise.allSettled(tasks);
    setLoading(false);
    setStep(3);
  }

  function handleStep3Enter() {
    router.push("/browse");
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-10 bg-bg">
      <div className="w-full max-w-sm">
        {/* Logo + brand */}
        <div className="flex items-center justify-center gap-2 mb-7">
          <span className="text-2xl text-accent" aria-hidden="true">☾</span>
          <span className="font-display text-xl font-bold tracking-tight">
            CeSoir
          </span>
        </div>

        {/* Progress (3 segments) */}
        <div
          className="flex gap-1.5 mb-7"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={3}
          aria-valuenow={step}
          aria-label={`Étape ${step} sur 3`}
        >
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className="h-1 flex-1 rounded-full transition-colors duration-300"
              style={{
                background:
                  s <= step ? "var(--color-accent)" : "var(--color-border)",
              }}
            />
          ))}
        </div>

        {/* ─────────── STEP 1 — Identity ─────────── */}
        {step === 1 && (
          <m.form
            key="step1"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: easings.out }}
            onSubmit={handleStep1Submit}
            className="space-y-4"
          >
            <header className="mb-6">
              <h1 className="font-display text-2xl font-bold mb-1">Crée ton compte</h1>
              <p className="text-sm text-text-muted">
                30 secondes. Pas de photo, pas de bio. Juste l&apos;essentiel.
              </p>
            </header>

            <label className="block">
              <span className="text-xs font-semibold text-text-muted">Email</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full px-3 py-2.5 rounded-xl border border-border bg-card text-text focus:outline-none focus:ring-2 focus:ring-accent text-base"
                placeholder="toi@email.com"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-text-muted">Mot de passe</span>
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full px-3 py-2.5 rounded-xl border border-border bg-card text-text focus:outline-none focus:ring-2 focus:ring-accent text-base"
                placeholder="8 caractères minimum"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-text-muted">Âge</span>
              <input
                type="number"
                required
                min={18}
                max={99}
                inputMode="numeric"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="mt-1 w-full px-3 py-2.5 rounded-xl border border-border bg-card text-text focus:outline-none focus:ring-2 focus:ring-accent text-base"
                placeholder="18+"
              />
            </label>

            {/* Invite code is optional — only shown if not auto-detected */}
            {!params?.get("invite") && (
              <label className="block">
                <span className="text-xs font-semibold text-text-muted">
                  Code invitation (optionnel)
                </span>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase().slice(0, 16))}
                  className="mt-1 w-full px-3 py-2.5 rounded-xl border border-border bg-card text-text focus:outline-none focus:ring-2 focus:ring-accent text-base font-mono uppercase tracking-wider"
                  placeholder="XXXXXX"
                />
              </label>
            )}
            {params?.get("invite") && (
              <div className="text-xs text-accent font-semibold">
                ✓ Code <span className="font-mono">{inviteCode}</span> appliqué
              </div>
            )}

            {error && (
              <div role="alert" className="text-sm text-danger px-3 py-2 rounded-lg bg-danger/10 border border-danger/20">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-full bg-accent text-white font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-50 tap-target"
            >
              {loading ? "Création..." : "Continuer →"}
            </button>

            <p className="text-xs text-center text-text-muted pt-2">
              Déjà un compte ?{" "}
              <Link href="/login" className="text-accent font-semibold">
                Connecte-toi
              </Link>
            </p>
          </m.form>
        )}

        {/* ─────────── STEP 2 — Intent (mode + geoloc) ─────────── */}
        {step === 2 && (
          <m.div
            key="step2"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: easings.out }}
            className="space-y-4"
          >
            <header className="mb-6">
              <h1 className="font-display text-2xl font-bold mb-1">Tu veux quoi ce soir ?</h1>
              <p className="text-sm text-text-muted">
                Choisis un mode. Tu pourras le changer à tout moment.
              </p>
            </header>

            <div className="grid grid-cols-1 gap-3" role="radiogroup">
              {PUBLIC_MODES.map((m) => {
                const def = MODES[m];
                const active = selectedMode === m;
                return (
                  <button
                    key={m}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setSelectedMode(m)}
                    className={`text-left px-4 py-3 rounded-2xl border-2 transition-all tap-target ${
                      active
                        ? "border-accent bg-accent/5 shadow-md"
                        : "border-border bg-card hover:border-text-muted/40"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-base shrink-0"
                        style={{ background: def.color }}
                      >
                        {def.name[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-sm text-text">{def.name}</div>
                        <div className="text-xs text-text-muted line-clamp-1">
                          {MODE_TAGLINES[m]}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Geolocation status — quietly informative, not blocking */}
            <div className="text-xs text-text-muted text-center pt-1">
              {geo.loading && "📍 Demande de ta position..."}
              {!geo.loading && geo.error && (
                <>📍 Position non partagée — tu pourras swiper en mode ville par défaut.</>
              )}
              {!geo.loading && !geo.error && geo.latitude !== null && (
                <>📍 Position détectée (précision ~{Math.round(geo.accuracy ?? 0)} m)</>
              )}
            </div>

            {error && (
              <div role="alert" className="text-sm text-danger px-3 py-2 rounded-lg bg-danger/10 border border-danger/20">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleStep2Submit}
              disabled={loading || !selectedMode}
              className="w-full py-3 rounded-full bg-accent text-white font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-50 tap-target"
            >
              {loading ? "Activation..." : "C'est parti →"}
            </button>
          </m.div>
        )}

        {/* ─────────── STEP 3 — Landing ─────────── */}
        {step === 3 && (
          <m.div
            key="step3"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: easings.out }}
            className="text-center space-y-5"
          >
            <m.div
              className="text-6xl"
              animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.05, 1] }}
              transition={{ duration: 1.6, repeat: 0, ease: "easeInOut" }}
              aria-hidden="true"
            >
              ☾
            </m.div>

            <header>
              <h1 className="font-display text-2xl font-bold mb-2">Bienvenue</h1>
              <p className="text-sm text-text-muted">
                {selectedMode && MODES[selectedMode].name} activé. Les profils près de toi sont prêts.
              </p>
            </header>

            <button
              type="button"
              onClick={handleStep3Enter}
              className="w-full py-3 rounded-full bg-accent text-white font-semibold text-sm transition-opacity hover:opacity-90 tap-target"
            >
              Commencer à swiper →
            </button>

            <p className="text-xs text-text-muted">
              Tu peux compléter ton profil plus tard depuis l&apos;onglet{" "}
              <Link href="/profile" className="text-accent font-semibold">
                Profil
              </Link>
              .
            </p>
          </m.div>
        )}
      </div>
    </main>
  );
}

export default function SignupQuickPage() {
  return (
    <Suspense fallback={null}>
      <SignupQuickInner />
    </Suspense>
  );
}
