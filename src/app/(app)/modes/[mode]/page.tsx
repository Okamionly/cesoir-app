"use client";

import { use, useState, useCallback } from "react";
import { m } from "motion/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { MODES, type ModeKey } from "@/lib/modes";
import { VENUES } from "@/lib/venues";
import { MOCK_PROFILES } from "@/lib/mock-profiles";
import { springs, ambient } from "@/lib/motion-design";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Magnetic } from "@/components/motion/Magnetic";
import { RackFocus } from "@/components/motion/RackFocus";
import { ArrowLeft, ChevronRight as LucideChevronRight, Star } from "@/components/ui/lucide";

// ─────────────────────────────────────────
// Mock testimonials per mode
// ─────────────────────────────────────────

const TESTIMONIALS: Record<string, { name: string; text: string; avatar: string }[]> = {
  "solo-diner": [
    { name: "Camille, 26", text: "J'ai trouve quelqu'un pour partager un ramen en 10 min. On se revoit jeudi !", avatar: "https://randomuser.me/api/portraits/women/21.jpg" },
    { name: "Youssef, 30", text: "Fini les repas solo devant Netflix. CeSoir a change mes soirees.", avatar: "https://randomuser.me/api/portraits/men/45.jpg" },
  ],
  "plus-one": [
    { name: "Lea, 28", text: "J'avais une place en plus pour un concert. Match en 5 min, soiree incroyable.", avatar: "https://randomuser.me/api/portraits/women/34.jpg" },
    { name: "Hugo, 31", text: "Plus jamais de places perdues. CeSoir c'est le Vinted des +1.", avatar: "https://randomuser.me/api/portraits/men/52.jpg" },
  ],
  tourist: [
    { name: "Emily, 25", text: "A local showed me hidden Paris spots I'd never find on TripAdvisor. Magic.", avatar: "https://randomuser.me/api/portraits/women/11.jpg" },
    { name: "Marco, 34", text: "J'adore guider les voyageurs. On decouvre sa propre ville autrement.", avatar: "https://randomuser.me/api/portraits/men/68.jpg" },
  ],
  "night-owl": [
    { name: "Luna, 24", text: "Balade a 2h du mat le long du canal. Les meilleures conversations.", avatar: "https://randomuser.me/api/portraits/women/18.jpg" },
    { name: "Theo, 27", text: "Les noctambules se comprennent. Ce mode c'est notre QG.", avatar: "https://randomuser.me/api/portraits/men/84.jpg" },
  ],
  breakup: [
    { name: "Marie, 30", text: "Zero pression, zero drague. Juste quelqu'un qui ecoute. Exactement ce qu'il fallait.", avatar: "https://randomuser.me/api/portraits/women/90.jpg" },
    { name: "Antoine, 32", text: "Apres ma rupture, ce mode m'a aide a sortir de chez moi. Merci CeSoir.", avatar: "https://randomuser.me/api/portraits/men/15.jpg" },
  ],
  "new-in-town": [
    { name: "Sofia, 23", text: "Arrivee a Paris sans connaitre personne. 3 semaines plus tard, j'ai un groupe d'amis.", avatar: "https://randomuser.me/api/portraits/women/12.jpg" },
    { name: "Paul, 27", text: "Les ambassadeurs locaux sont incroyables. Ils connaissent tous les bons plans.", avatar: "https://randomuser.me/api/portraits/men/43.jpg" },
  ],
  langue: [
    { name: "Marta, 26", text: "Mon francais a plus progresse en 2 soirees CeSoir qu'en 6 mois de cours.", avatar: "https://randomuser.me/api/portraits/women/79.jpg" },
    { name: "Julien, 29", text: "Apprendre le japonais autour d'un cafe, c'est tellement plus fun qu'une app.", avatar: "https://randomuser.me/api/portraits/men/51.jpg" },
  ],
  "dog-date": [
    { name: "Claire, 28", text: "Rex a trouve son meilleur pote au parc. Et moi aussi.", avatar: "https://randomuser.me/api/portraits/women/25.jpg" },
    { name: "Maxime, 32", text: "Les bars dog-friendly de Paris, on les connait tous maintenant.", avatar: "https://randomuser.me/api/portraits/men/62.jpg" },
  ],
  seasonal: [
    { name: "Luca, 29", text: "Mon meilleur Noel ? Avec 6 inconnus trouves sur CeSoir. Famille choisie.", avatar: "https://randomuser.me/api/portraits/men/91.jpg" },
    { name: "Oceane, 31", text: "Anti-Valentine avec 8 celibataires. On a tellement ri que j'ai oublie mon ex.", avatar: "https://randomuser.me/api/portraits/women/36.jpg" },
  ],
  "fit-date": [
    { name: "Kevin, 28", text: "Running a deux c'est 10x plus motivant. On fait 3 sorties par semaine maintenant.", avatar: "https://randomuser.me/api/portraits/men/29.jpg" },
    { name: "Lea, 26", text: "J'ai trouve ma partenaire d'escalade ideale. Meme niveau, meme energie.", avatar: "https://randomuser.me/api/portraits/women/42.jpg" },
  ],
  "foodie-quest": [
    { name: "Priya, 27", text: "On a trouve le meilleur pho de Paris ensemble. Mission accomplie.", avatar: "https://randomuser.me/api/portraits/women/64.jpg" },
    { name: "Bastien, 30", text: "Street food tour a Belleville avec un inconnu. Meilleure soiree de l'annee.", avatar: "https://randomuser.me/api/portraits/men/47.jpg" },
  ],
  "culture-club": [
    { name: "Gabriel, 33", text: "Debattre de Basquiat avec quelqu'un de passionne, ca n'a pas de prix.", avatar: "https://randomuser.me/api/portraits/men/73.jpg" },
    { name: "Elise, 29", text: "Cinema d'auteur + discussion apres. Le combo parfait du mode Culture.", avatar: "https://randomuser.me/api/portraits/women/31.jpg" },
  ],
  "sober-tonight": [
    { name: "Manon, 25", text: "Salon de the + jeux de societe. La preuve qu'on peut s'amuser sans alcool.", avatar: "https://randomuser.me/api/portraits/women/57.jpg" },
    { name: "Lucas, 27", text: "Balade nocturne + patisserie. Simple, sobre, parfait.", avatar: "https://randomuser.me/api/portraits/men/24.jpg" },
  ],
  "gamer-night": [
    { name: "Enzo, 23", text: "Mario Kart au bar avec des inconnus. J'ai perdu, j'ai paye les frites, j'ai adore.", avatar: "https://randomuser.me/api/portraits/men/16.jpg" },
    { name: "Nina, 26", text: "On cherchait un joueur pour notre campagne D&D. Trouve en 20 min.", avatar: "https://randomuser.me/api/portraits/women/83.jpg" },
  ],
};

// ─────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────

// Local wrappers preserve previous call sites (no props needed at usage).
function BackArrow() {
  return <ArrowLeft size={22} strokeWidth={1.5} aria-hidden="true" />;
}

function StarIcon() {
  // Filled star (currentColor) — matches the original solid review look.
  return <Star size={12} fill="currentColor" stroke="none" aria-hidden="true" />;
}

function ChevronRight() {
  return <LucideChevronRight size={16} strokeWidth={1.5} aria-hidden="true" />;
}

// ─────────────────────────────────────────
// Main page
// ─────────────────────────────────────────

export default function ModeDetailPage({
  params,
}: {
  params: Promise<{ mode: string }>;
}) {
  const { mode: modeSlug } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [activating, setActivating] = useState(false);
  const [activated, setActivated] = useState(false);

  // Resolve mode data
  const modeKey = modeSlug as ModeKey;
  const modeData = MODES[modeKey];

  // If mode doesn't exist, show 404-like state
  if (!modeData) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6">
        <span className="text-5xl mb-4">🤷</span>
        <h1 className="text-xl font-bold mb-2">Mode introuvable</h1>
        <p className="text-sm text-text-muted mb-6">Ce mode n&apos;existe pas encore.</p>
        <Link href="/modes" className="text-sm text-accent font-semibold">
          Retour aux modes
        </Link>
      </div>
    );
  }

  // Filter venues compatible with this mode
  const modeVenues = VENUES.filter((v) => v.compatible_modes.includes(modeKey)).slice(0, 3);

  // Count active users in this mode (mock)
  const modeProfiles = MOCK_PROFILES.filter((p) => p.mode === modeKey);
  const activeCount = modeProfiles.length * 12 + (modeKey.length * 7) % 30;

  // Get testimonials for this mode
  const testimonials = TESTIMONIALS[modeKey] ?? TESTIMONIALS["solo-diner"];

  // Avatar previews (first 3 profiles from this mode)
  const avatarPreviews = modeProfiles.slice(0, 3);

  // Activate mode handler
  const handleActivate = useCallback(async () => {
    setActivating(true);
    try {
      if (user) {
        await supabase.from("mode_activations").insert({
          user_id: user.id,
          mode: modeKey,
          activated_at: new Date().toISOString(),
        });
      }
      setActivated(true);
      setTimeout(() => {
        router.push(`/browse?mode=${modeKey}`);
      }, 600);
    } catch {
      // Proceed to browse even if insert fails
      router.push(`/browse?mode=${modeKey}`);
    }
  }, [user, modeKey, router]);

  // Steps data
  const steps = [
    { icon: "⚡", title: "Active le mode", description: `Active "${modeData.name}" et montre ta disponibilite.` },
    { icon: "👀", title: "Decouvre les profils", description: "Parcours les personnes disponibles ce soir pres de toi." },
    { icon: "🎯", title: "Propose un plan", description: "Envoie une invitation et organisez votre soiree." },
  ];

  // Price range formatting
  const formatPrice = (range: 1 | 2 | 3) => "\u20AC".repeat(range);

  return (
    <div className="min-h-screen bg-bg pb-32">
      {/* ─── HERO SECTION ─── */}
      <m.section
        className="relative overflow-hidden"
        initial={{ opacity: 0, filter: "blur(20px)" }}
        animate={{ opacity: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Gradient background */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${modeData.color}20 0%, ${modeData.color}08 50%, transparent 100%)`,
          }}
        />
        <div
          className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20"
          style={{ background: modeData.color }}
        />

        {/* Back button — Magnetic */}
        <div className="relative z-10 px-4 pt-4">
          <Magnetic strength={0.18} radius={70}>
            <Link
              href="/modes"
              className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text transition-colors tap-target"
              aria-label="Retour aux modes"
            >
              <BackArrow />
              <span>Modes</span>
            </Link>
          </Magnetic>
        </div>

        {/* Hero content */}
        <div className="relative z-10 px-6 pt-8 pb-10 text-center">
          {/* Floating emoji */}
          <m.div
            className="text-7xl mb-4 inline-block"
            animate={ambient.float(5)}
            aria-hidden="true"
          >
            {modeData.icon}
          </m.div>

          <m.h1
            className="text-3xl font-bold font-display mb-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, ...springs.heavy }}
          >
            {modeData.name}
          </m.h1>

          <m.p
            className="text-sm text-text-muted max-w-xs mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, ...springs.heavy }}
          >
            {modeData.description}
          </m.p>

          {/* Tags */}
          <m.div
            className="flex flex-wrap justify-center gap-1.5 mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
          >
            {modeData.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-2.5 py-1 rounded-full border font-medium"
                style={{
                  borderColor: `${modeData.color}30`,
                  color: modeData.color,
                  background: `${modeData.color}08`,
                }}
              >
                {tag}
              </span>
            ))}
          </m.div>
        </div>
      </m.section>

      {/* ─── QUI EST LA CE SOIR ─── */}
      <section className="px-5 py-6" aria-labelledby="active-users-heading">
        <m.div
          className="bg-bg-card border border-border rounded-2xl p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, ...springs.heavy }}
        >
          <h2 id="active-users-heading" className="text-[15px] font-bold mb-3">
            Qui est la ce soir
          </h2>
          <div className="flex items-center gap-4">
            {/* Avatar stack */}
            <div className="flex -space-x-3">
              {avatarPreviews.map((profile, i) => (
                <m.div
                  key={profile.id}
                  className="relative"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    delay: 0.5 + i * 0.1,
                    ...springs.elastic,
                  }}
                >
                  <Image
                    src={profile.photo}
                    alt={profile.name}
                    width={44}
                    height={44}
                    className="w-11 h-11 rounded-full border-2 border-bg object-cover"
                  />
                  <div
                    className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-bg bg-safe"
                    aria-hidden="true"
                  />
                </m.div>
              ))}
              {activeCount > 3 && (
                <m.div
                  className="w-11 h-11 rounded-full border-2 border-bg flex items-center justify-center text-[10px] font-bold"
                  style={{ background: `${modeData.color}15`, color: modeData.color }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8, ...springs.elastic }}
                >
                  +{activeCount - 3}
                </m.div>
              )}
            </div>

            {/* Count */}
            <div>
              <p className="text-2xl font-bold font-display" style={{ color: modeData.color }}>
                {activeCount}
              </p>
              <p className="text-[11px] text-text-muted">actifs maintenant</p>
            </div>

            {/* Live pulse */}
            <div className="ml-auto flex items-center gap-1.5">
              <m.div
                className="w-2 h-2 rounded-full bg-safe"
                animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-[10px] text-safe font-semibold">LIVE</span>
            </div>
          </div>
        </m.div>
      </section>

      {/* ─── GOING TONIGHT ─── */}
      <section className="px-5 py-2" aria-labelledby="going-tonight-heading">
        <m.h2
          id="going-tonight-heading"
          className="text-[15px] font-bold mb-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
        >
          Going Tonight
        </m.h2>

        <div className="space-y-2">
          {[
            { title: `${modeData.name} Meetup`, time: "20h30", venue: "Le Comptoir", attendees: Math.max(4, activeCount % 12) },
            { title: `Soiree ${modeData.tags[0] ?? modeData.name}`, time: "21h00", venue: "Cafe de Flore", attendees: Math.max(3, (activeCount % 8) + 2) },
          ].map((event, i) => (
            <m.div
              key={i}
              className="flex items-center gap-3 bg-bg-card border border-border rounded-2xl p-3.5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1, ...springs.heavy }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-base"
                style={{ background: `${modeData.color}12` }}
              >
                {modeData.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[13px] font-bold truncate">{event.title}</h3>
                <p className="text-[11px] text-text-muted">{event.venue} &middot; {event.time}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="flex -space-x-1.5">
                  {Array.from({ length: Math.min(3, event.attendees) }).map((_, j) => (
                    <div
                      key={j}
                      className="w-5 h-5 rounded-full border border-bg"
                      style={{ background: `${modeData.color}${25 + j * 15}` }}
                    />
                  ))}
                </div>
                <span className="text-[10px] font-semibold" style={{ color: modeData.color }}>
                  {event.attendees}
                </span>
              </div>
            </m.div>
          ))}
        </div>
      </section>

      {/* ─── COMMENT CA MARCHE ─── */}
      <section className="px-5 py-2" aria-labelledby="how-it-works-heading">
        <m.h2
          id="how-it-works-heading"
          className="text-[15px] font-bold mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Comment ca marche
        </m.h2>

        <div className="space-y-3">
          {steps.map((step, i) => (
            <m.div
              key={i}
              className="flex items-start gap-4 bg-bg-card border border-border rounded-2xl p-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 + i * 0.1, ...springs.heavy }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg"
                style={{ background: `${modeData.color}12` }}
              >
                {step.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                    style={{ background: `${modeData.color}15`, color: modeData.color }}
                  >
                    {i + 1}
                  </span>
                  <h3 className="text-[14px] font-bold">{step.title}</h3>
                </div>
                <p className="text-[12px] text-text-muted leading-relaxed">{step.description}</p>
              </div>
            </m.div>
          ))}
        </div>
      </section>

      {/* ─── LIEUX POPULAIRES ─── */}
      {modeVenues.length > 0 && (
        <section className="px-5 py-6" aria-labelledby="venues-heading">
          <m.h2
            id="venues-heading"
            className="text-[15px] font-bold mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            Lieux populaires
          </m.h2>

          <div className="space-y-2.5">
            {modeVenues.map((venue, i) => (
              <m.div
                key={venue.id}
                className="flex items-center gap-3 bg-bg-card border border-border rounded-2xl p-4 hover:border-accent/20 transition-colors"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.75 + i * 0.1, ...springs.heavy }}
              >
                {/* Venue type icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-base"
                  style={{ background: `${modeData.color}10` }}
                >
                  {venue.type === "restaurant" && "🍽️"}
                  {venue.type === "bar" && "🍸"}
                  {venue.type === "concert" && "🎵"}
                  {venue.type === "cinema" && "🎬"}
                  {venue.type === "balade" && "🚶"}
                  {venue.type === "cafe" && "☕"}
                  {venue.type === "musee" && "🎨"}
                  {venue.type === "sport" && "💪"}
                </div>

                {/* Venue info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-[13px] font-bold truncate">{venue.name}</h3>
                  <p className="text-[11px] text-text-muted truncate">{venue.address}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-0.5 text-warn">
                      <StarIcon />
                      <span className="text-[10px] font-semibold">{venue.rating}</span>
                    </div>
                    <span className="text-[10px] text-text-muted">{formatPrice(venue.priceRange)}</span>
                    <span className="text-[10px] text-text-muted">{venue.arrondissement}</span>
                  </div>
                </div>

                {/* Popular badge */}
                {venue.popular && (
                  <span
                    className="text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0"
                    style={{ background: `${modeData.color}12`, color: modeData.color }}
                  >
                    Populaire
                  </span>
                )}

                <ChevronRight />
              </m.div>
            ))}
          </div>
        </section>
      )}

      {/* ─── TEMOIGNAGES ─── */}
      <section className="px-5 py-2" aria-labelledby="reviews-heading">
        <m.h2
          id="reviews-heading"
          className="text-[15px] font-bold mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          Temoignages
        </m.h2>

        <div className="space-y-3">
          {testimonials.map((review, i) => (
            <m.div
              key={i}
              className="bg-bg-card border border-border rounded-2xl p-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.95 + i * 0.12, ...springs.cinematic }}
            >
              <div className="flex items-center gap-3 mb-3">
                <Image
                  src={review.avatar}
                  alt={review.name}
                  width={36}
                  height={36}
                  className="w-9 h-9 rounded-full object-cover"
                />
                <div>
                  <p className="text-[13px] font-bold">{review.name}</p>
                  <div className="flex gap-0.5 text-warn">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <StarIcon key={s} />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-[12px] text-text-muted leading-relaxed italic">
                &ldquo;{review.text}&rdquo;
              </p>
            </m.div>
          ))}
        </div>
      </section>

      {/* ─── CTA: ACTIVER CE MODE — Magnetic + glow ─── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 px-5 pb-6 pt-4 bg-gradient-to-t from-bg via-bg/95 to-transparent">
        <Magnetic as="div" strength={0.14} radius={140}>
        <m.button
          onClick={handleActivate}
          disabled={activating || activated}
          className="w-full relative overflow-hidden rounded-2xl py-4 text-white font-bold text-base shadow-glow disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            background: activated
              ? "var(--color-safe)"
              : `linear-gradient(135deg, ${modeData.color}, ${modeData.color}CC)`,
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, ...springs.heavy }}
          whileHover={{ y: -3, boxShadow: `0 12px 40px ${modeData.color}40` }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Glow effect */}
          <m.div
            className="absolute inset-0 opacity-30"
            style={{
              background: `radial-gradient(circle at 50% 50%, white, transparent 70%)`,
            }}
            animate={{ opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 3, repeat: Infinity }}
          />

          <span className="relative z-10 flex items-center justify-center gap-2">
            {activated ? (
              <>
                <m.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={springs.elastic}
                >
                  ✓
                </m.span>
                Mode active !
              </>
            ) : activating ? (
              <>
                <m.span
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                />
                Activation...
              </>
            ) : (
              <>
                <span>{modeData.icon}</span>
                Activer {modeData.name}
              </>
            )}
          </span>
        </m.button>
        </Magnetic>
      </div>
    </div>
  );
}
