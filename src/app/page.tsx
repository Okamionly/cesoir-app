import Link from "next/link";
import { MODES, MODE_KEYS } from "@/lib/modes";
import Countdown from "@/components/landing/Countdown";
import LiveTicker from "@/components/landing/LiveTicker";

const features = [
  { icon: "⚡", title: "Ce soir, pas demain", desc: "Trouve quelqu'un disponible maintenant. Pas de conversations qui trainent." },
  { icon: "🎯", title: "9 modes uniques", desc: "Diner, langues, chiens, events, voyageurs... trouve TON mode." },
  { icon: "🔒", title: "Securite d'abord", desc: "Verification par selfie, bouton SOS, lieux publics. Ta securite est non-negociable." },
  { icon: "🆓", title: "100% gratuit", desc: "Pas de paywall, pas de swipes limites. Tout est ouvert." },
  { icon: "📍", title: "Pres de toi", desc: "Geolocalisation intelligente. Des gens a quelques minutes de chez toi." },
  { icon: "💬", title: "Brise-glaces", desc: "Suggestions de premiers messages adaptes. Plus jamais de 'salut ca va'." },
];

const stories = [
  { names: "Leslie & Thomas", text: "On s'est retrouves en mode Solo Diner un mardi soir. On s'est maries en 2025.", mode: "Solo Diner", icon: "🍽️" },
  { names: "Yuki & Julien", text: "Un echange linguistique qui a fini en histoire d'amour. Merci CeSoir.", mode: "Langue Exchange", icon: "🌐" },
  { names: "Claire & Max", text: "Nos chiens se sont choisis avant nous. Rex et Lola sont inseparables.", mode: "Dog Date", icon: "🐶" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg text-text">
      {/* === NAVBAR === */}
      <nav aria-label="Navigation du site" className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-3 bg-bg/90 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-xl text-accent" aria-hidden="true">☾</span>
          <span className="text-base font-bold">CeSoir</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-[13px] text-text-muted font-medium py-2 px-4 tap-target">Connexion</Link>
          <Link href="/register" className="gradient-bg text-white text-[13px] font-semibold py-2 px-5 rounded-full active:scale-95 transition-transform tap-target">S&apos;inscrire</Link>
        </div>
      </nav>

      {/* === HERO === */}
      <main>
        <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16 text-center">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute w-[400px] h-[400px] rounded-full bg-accent opacity-10 blur-[120px] -top-32 -right-32" style={{ animation: "float 8s ease-in-out infinite" }} />
            <div className="absolute w-[300px] h-[300px] rounded-full bg-accent-2 opacity-10 blur-[120px] -bottom-20 -left-32" style={{ animation: "float 10s ease-in-out infinite reverse" }} />
          </div>

          <div className="relative z-10 max-w-lg">
            <div className="inline-flex items-center gap-2 gradient-bg-subtle border border-accent/15 px-4 py-2 rounded-full mb-8">
              <span className="w-2 h-2 rounded-full bg-safe" aria-hidden="true" />
              <span className="text-[12px] text-text-muted font-medium">3 842 personnes en ligne ce soir</span>
            </div>

            <Countdown />

            <h1 className="font-display text-[48px] sm:text-[56px] font-bold leading-[0.95] tracking-tight mb-6">
              Seul(e) ce soir&nbsp;?<br />
              <span className="gradient-text">Plus maintenant.</span>
            </h1>

            <p className="text-text-muted text-[16px] leading-relaxed mb-10 max-w-sm mx-auto">
              L&apos;app qui te connecte avec des gens pres de toi, disponibles <strong className="text-text">ce soir</strong>. Pas demain. <strong className="text-text">Maintenant.</strong>
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link href="/register" className="gradient-bg text-white font-semibold py-4 px-8 rounded-full text-[15px] shadow-glow active:scale-[0.97] transition-transform text-center tap-target">
                Je suis dispo ce soir →
              </Link>
              <Link href="/browse" className="border border-border text-text font-medium py-4 px-8 rounded-full text-[15px] hover:border-accent transition-colors text-center tap-target">
                Explorer les profils
              </Link>
            </div>

            <div className="mt-12 flex items-center justify-center gap-3">
              <div className="flex -space-x-2" aria-hidden="true">
                {["#8B5CF6", "#00FF88", "#f59e0b", "#ec4899", "#22c55e"].map((c, i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-bg flex items-center justify-center text-[10px] font-bold text-white" style={{ background: c }}>
                    {["S", "M", "L", "T", "C"][i]}
                  </div>
                ))}
              </div>
              <p className="text-[12px] text-text-muted">
                <strong className="text-text">+1 200</strong> rencontres ce mois
              </p>
            </div>
          </div>
        </section>

        {/* === LIVE TICKER === */}
        <LiveTicker />

        {/* === HOW IT WORKS === */}
        <section className="px-6 py-20" aria-labelledby="how-title">
          <div className="max-w-lg mx-auto">
            <p className="text-[10px] text-accent uppercase tracking-[0.3em] font-bold mb-3 text-center">Comment ca marche</p>
            <h2 id="how-title" className="font-display text-[28px] font-bold text-center mb-12 leading-tight">
              3 etapes.<br /><span className="gradient-text">Zero prise de tete.</span>
            </h2>
            <div className="space-y-6">
              {[
                { n: "01", title: "Choisis ton mode", desc: "Solo Diner, Dog Date, Langue Exchange... 9 facons de connecter." },
                { n: "02", title: "Decouvre qui est la", desc: "Swipe les profils de gens pres de toi, dispos ce soir." },
                { n: "03", title: "Retrouvez-vous", desc: "Match, message, lieu. En moyenne, nos utilisateurs se voient dans les 2 heures." },
              ].map((s) => (
                <div key={s.n} className="flex gap-5 items-start">
                  <span className="text-[28px] font-black gradient-text shrink-0 w-12">{s.n}</span>
                  <div>
                    <h3 className="text-[16px] font-bold mb-1">{s.title}</h3>
                    <p className="text-[14px] text-text-muted leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* === FEATURES === */}
        <section className="px-6 py-20" aria-labelledby="features-title">
          <p className="text-[10px] text-accent uppercase tracking-[0.3em] font-bold mb-3 text-center">Pourquoi CeSoir</p>
          <h2 id="features-title" className="font-display text-[28px] font-bold text-center mb-12 leading-tight">
            Pas une app de plus.<br /><span className="gradient-text">LA reference.</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {features.map((f) => (
              <div key={f.title} className="bg-bg-card border border-border rounded-2xl p-6 hover:border-accent/30 transition-all">
                <span className="text-2xl mb-3 block" aria-hidden="true">{f.icon}</span>
                <h3 className="text-[15px] font-bold mb-2">{f.title}</h3>
                <p className="text-[13px] text-text-muted leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* === MODES === */}
        <section className="px-6 py-20" aria-labelledby="modes-title">
          <p className="text-[10px] text-accent uppercase tracking-[0.3em] font-bold mb-3 text-center">9 modes</p>
          <h2 id="modes-title" className="font-display text-[28px] font-bold text-center mb-4 leading-tight">
            Choisis ton <span className="gradient-text">ambiance</span>
          </h2>
          <p className="text-[14px] text-text-muted text-center mb-12 max-w-sm mx-auto">Chaque mode a ses propres profils, ses propres regles, son propre vibe.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-5xl mx-auto">
            {MODE_KEYS.map((key) => {
              const mode = MODES[key];
              return (
                <Link href="/register" key={key} className="bg-bg-card border border-border rounded-2xl p-5 text-left hover:border-accent/40 transition-all group">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-2xl group-hover:scale-110 transition-transform" aria-hidden="true">{mode.icon}</span>
                    {mode.badge && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border border-accent/20 bg-accent/10 text-accent">{mode.badge}</span>
                    )}
                  </div>
                  <h3 className="text-[15px] font-bold mb-1">{mode.name}</h3>
                  <p className="text-[12px] text-text-muted leading-relaxed mb-3">{mode.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {mode.tags.slice(0, 3).map((t) => (
                      <span key={t} className="text-[9px] bg-bg border border-border px-2 py-0.5 rounded text-text-muted">{t}</span>
                    ))}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* === STORIES === */}
        <section className="px-6 py-20" aria-labelledby="stories-title">
          <p className="text-[10px] text-accent uppercase tracking-[0.3em] font-bold mb-3 text-center">Histoires vraies</p>
          <h2 id="stories-title" className="font-display text-[28px] font-bold text-center mb-12 leading-tight">
            Ils se sont trouves<br /><span className="gradient-text">ce soir-la.</span>
          </h2>
          <div className="space-y-4 max-w-lg mx-auto">
            {stories.map((s) => (
              <div key={s.names} className="bg-bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg" aria-hidden="true">{s.icon}</span>
                  <span className="text-[10px] text-text-muted font-semibold uppercase tracking-wider">{s.mode}</span>
                </div>
                <p className="text-[15px] text-text-soft leading-relaxed mb-3 italic">&ldquo;{s.text}&rdquo;</p>
                <p className="text-[13px] font-bold gradient-text">{s.names}</p>
              </div>
            ))}
          </div>
        </section>

        {/* === SAFETY === */}
        <section className="px-6 py-20" aria-labelledby="safety-title">
          <p className="text-[10px] text-safe uppercase tracking-[0.3em] font-bold mb-3 text-center">Securite</p>
          <h2 id="safety-title" className="font-display text-[28px] font-bold text-center mb-4 leading-tight">
            Ta securite est<br /><span className="text-safe">non-negociable.</span>
          </h2>
          <p className="text-[14px] text-text-muted text-center mb-12 max-w-sm mx-auto">Chaque fonctionnalite est pensee pour ta confiance.</p>
          <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
            {[
              { icon: "📸", title: "Selfie verifie", desc: "Chaque profil authentifie par photo en temps reel." },
              { icon: "📍", title: "Lieux publics", desc: "On ne recommande que des endroits surs." },
              { icon: "🆘", title: "Bouton SOS", desc: "Un appui alerte tes contacts d'urgence." },
              { icon: "⭐", title: "Avis verifies", desc: "Note chaque rencontre. Les profils toxiques sont retires." },
              { icon: "🛡️", title: "Moderation 24/7", desc: "Notre equipe veille en permanence." },
              { icon: "🚫", title: "Zero tolerance", desc: "Harcelement, arnaques = ban immediat." },
            ].map((item) => (
              <div key={item.title} className="bg-safe/5 border border-safe/15 rounded-2xl p-4 hover:border-safe/30 transition-colors">
                <div className="text-2xl mb-2" aria-hidden="true">{item.icon}</div>
                <h3 className="text-[13px] font-bold mb-1">{item.title}</h3>
                <p className="text-[11px] text-text-muted leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/safety" className="text-[13px] text-safe font-semibold underline underline-offset-4 decoration-safe/30 tap-target inline-block py-2">
              Lire nos regles communautaires →
            </Link>
          </div>
        </section>

        {/* === CTA === */}
        <section className="px-6 py-24 text-center">
          <h2 className="font-display text-[36px] font-bold mb-4 leading-tight">
            Ce soir, c&apos;est<br /><span className="gradient-text">ton</span> soir.
          </h2>
          <p className="text-text-muted text-[15px] mb-10 max-w-xs mx-auto">9 modes. Des milliers de personnes. Zero solitude. 100% gratuit.</p>
          <Link href="/register" className="inline-block gradient-bg text-white font-bold py-4 px-10 rounded-full text-[17px] shadow-glow active:scale-[0.97] transition-transform tap-target">
            Commencer maintenant
          </Link>
          <p className="text-[11px] text-text-muted mt-4">Gratuit. Sans engagement. Sans pub.</p>
        </section>
      </main>

      {/* === FOOTER === */}
      <footer className="border-t border-border px-6 py-10" role="contentinfo">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-xl text-accent" aria-hidden="true">☾</span>
            <span className="text-lg font-bold">CeSoir</span>
          </div>
          <p className="text-[12px] text-text-muted text-center mb-6">La soiree parfaite commence ici.</p>
          <div className="flex justify-center gap-6 mb-6">
            <Link href="/safety" className="text-[11px] text-text-muted hover:text-text transition-colors tap-target py-1">Securite</Link>
            <Link href="/modes" className="text-[11px] text-text-muted hover:text-text transition-colors tap-target py-1">Modes</Link>
            <Link href="/cgu" className="text-[11px] text-text-muted hover:text-text transition-colors tap-target py-1">CGU</Link>
            <Link href="/privacy" className="text-[11px] text-text-muted hover:text-text transition-colors tap-target py-1">Confidentialite</Link>
          </div>
          <p className="text-[11px] text-text-muted text-center">&copy; 2026 CeSoir. Tous droits reserves.</p>
        </div>
      </footer>
    </div>
  );
}
