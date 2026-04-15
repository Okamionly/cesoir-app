"use client";

import Link from "next/link";

interface ReportFeedbackProps {
  onClose: () => void;
}

export default function ReportFeedback({ onClose }: ReportFeedbackProps) {
  return (
    <div className="w-full max-w-sm mx-auto bg-bg border border-border rounded-3xl p-8 text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
        <svg
          width={32}
          height={32}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#22c55e"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
          <path d="M8 12l3 3 5-5" />
        </svg>
      </div>

      <h2 className="text-[17px] font-bold mb-2">
        Merci pour ton signalement
      </h2>

      <p className="text-[14px] text-text-muted leading-relaxed mb-2">
        Notre equipe examine ce profil sous 24h. Tu ne verras plus cette personne dans tes suggestions.
      </p>

      <p className="text-[12px] text-text-muted mb-6">
        Si tu te sens en danger, contacte les autorites locales.
      </p>

      <div className="space-y-3">
        <Link
          href="/safety"
          className="block w-full py-3 rounded-full text-sm font-semibold border border-border text-text hover:bg-border/20 transition-colors"
        >
          Centre de securite
        </Link>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-full text-sm font-bold text-white gradient-bg active:scale-[0.98] transition-transform"
        >
          Continuer
        </button>
      </div>
    </div>
  );
}
