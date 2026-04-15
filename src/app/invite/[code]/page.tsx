import Link from "next/link";
import type { Metadata } from "next";
import { MODES } from "@/lib/modes";

interface PageProps {
  params: Promise<{ code: string }>;
}

// Demo: resolve referral code to inviter info
// In production, this would query Supabase
async function getInviter(code: string) {
  return {
    code,
    name: "Youssef",
    city: "Paris",
    modesCount: 3,
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params;
  const inviter = await getInviter(code);
  return {
    title: `${inviter.name} t'invite sur CeSoir`,
    description: `Rejoins CeSoir gratuitement et decouvre 14 modes de rencontre. Invite par ${inviter.name}.`,
    openGraph: {
      title: `${inviter.name} t'invite sur CeSoir`,
      description: "14 modes de rencontre pour ne plus etre seul(e) ce soir. 100% gratuit.",
      url: `https://cesoir-app.vercel.app/invite/${code}`,
      siteName: "CeSoir",
      locale: "fr_FR",
      type: "website",
    },
  };
}

const PREVIEW_MODES = ["solo-diner", "plus-one", "night-owl", "dog-date", "culture-club", "gamer-night"] as const;

export default async function InvitePage({ params }: PageProps) {
  const { code } = await params;
  const inviter = await getInviter(code);

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-bg opacity-10" />
        <div className="relative px-5 pt-12 pb-8 text-center max-w-md mx-auto">
          {/* Inviter avatar */}
          <div className="mx-auto w-20 h-20 rounded-full gradient-bg p-[3px] shadow-glow mb-4">
            <div className="w-full h-full rounded-full bg-bg flex items-center justify-center text-[28px] font-black text-accent">
              {inviter.name.charAt(0).toUpperCase()}
            </div>
          </div>

          <p className="text-[13px] text-text-muted mb-1">
            {inviter.name} de {inviter.city} t&apos;invite sur
          </p>
          <h1 className="text-[36px] font-black tracking-tight">
            <span className="gradient-text">CeSoir</span>
          </h1>
          <p className="text-[14px] text-text-muted mt-3 max-w-[300px] mx-auto">
            L&apos;app qui te connecte avec des gens pres de toi, disponibles ce soir.
          </p>
        </div>
      </div>

      {/* App preview - mode cards */}
      <div className="px-5 py-6 max-w-md mx-auto w-full">
        <p className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-bold mb-3">14 modes de rencontre</p>
        <div className="grid grid-cols-2 gap-2">
          {PREVIEW_MODES.map((key) => {
            const mode = MODES[key];
            return (
              <div
                key={key}
                className="bg-bg-card border border-border rounded-xl p-3 flex items-center gap-2.5"
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-[18px] shrink-0"
                  style={{ background: `${mode.color}15` }}
                >
                  {mode.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] font-bold text-text truncate">{mode.name}</p>
                  <p className="text-[10px] text-text-muted truncate">{mode.tags[0]}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Value props */}
      <div className="px-5 py-4 max-w-md mx-auto w-full">
        <div className="space-y-3">
          {[
            { icon: "💯", text: "100% gratuit, pas de paywall" },
            { icon: "🔒", text: "Securise, verifie, respectueux" },
            { icon: "📍", text: "Trouve des gens pres de toi, ce soir" },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-3">
              <span className="text-[18px]" aria-hidden="true">{item.icon}</span>
              <span className="text-[13px] text-text font-medium">{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="flex-1" />
      <div className="sticky bottom-0 px-5 py-6 bg-gradient-to-t from-bg via-bg to-transparent max-w-md mx-auto w-full">
        <Link
          href={`/signup?ref=${code}`}
          className="block w-full py-4 rounded-2xl gradient-bg text-white text-center text-[15px] font-bold shadow-glow active:scale-[0.97] transition-transform tap-target"
        >
          S&apos;inscrire avec l&apos;invitation
        </Link>
        <p className="text-center text-[11px] text-text-muted mt-3">
          Code d&apos;invitation : <span className="font-mono font-bold text-accent">{code}</span>
        </p>
      </div>
    </div>
  );
}
